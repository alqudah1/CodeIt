/* eslint-disable no-useless-escape -- fallback project templates intentionally preserve escaped HTML/JS */
// Part 1 of what the studio does: the long handlers and effects of Builder(), moved out word for
// word. Each "make" function is handed, as one object, exactly the names the code used inside
// Builder(), and gives back the function that used to be written there.
// See Builder.js for why the studio is in parts.
import { API_BASE_URL } from '../../config/api';
import { COMPANION_TIPS, STARTER_TYPES } from './studioKit1';
import { clearGuestProjectDraft, readGuestProjectDraft, saveGuestProjectDraft } from '../../utils/guestProjectDraft';
import { collapseErrors, describeError, isErrorMessage } from './previewErrors';
import { colourSettings, describePaint, paintCode } from './paint';
import { deriveProjectName, extractColors, isValidHtml } from './studioKit2';
import { getProject as getShelfProject, migrateLegacyDraft, saveProject as saveToShelf } from '../../utils/projectShelf';
import { isStorageMessage, savePreviewStorage, stripPreviewScripts } from './previewStorage';
import { markBroken } from './codeSafety';
import { readInstantPrefs, readProjectHeading } from './instantStyle';
import { readScoreMessage } from './scoreBridge';
import { recordChangedBuild } from '../../utils/chests';
import { remember as rememberEdit } from './editHistory';
import { reportFailure } from '../../utils/humanError';
import { starterProjectById } from './starterProjects';
import { trackActivityComplete, trackActivityStart } from '../../utils/activity';
import { trackEvent } from '../../utils/trackEvent';

export function makeTrackPersonalizationOnce(studio) {
  const { personalizationTrackedRef, playedReportedRef, previewKeyRef, setHasPersonalized, setHasTestedLatest, setIsPlayMode, setIsStarter, shelfIdRef, token } = studio;
  return (function trackPersonalizationOnce() {
    setHasPersonalized(true);
    // A build the child changed, not one they generated. The third one earns
    // a chest; three untouched builds is three prompts typed and earns nothing.
    recordChangedBuild(shelfIdRef.current || previewKeyRef.current);
    setHasTestedLatest(false);
    playedReportedRef.current = false;
    setIsStarter(false);
    // A changed project must be opened again before it can pass the quality
    // check. Leaving play mode makes that next action unambiguous.
    setIsPlayMode(false);
    if (personalizationTrackedRef.current) return;
    personalizationTrackedRef.current = true;
    void trackEvent('project_personalize', null, token);
  });
}

export function makeBakeColorsIntoCode(studio) {
  const { code } = studio;
  return (function bakeColorsIntoCode(vars) {
    let updated = code;
    // Patch each var in existing :root blocks
    Object.entries(vars).forEach(([k, v]) => {
      const escaped = k.replace(/-/g, '\\-');
      updated = updated.replace(new RegExp(`(${escaped}\\s*:\\s*)[^;]+`, 'g'), `$1${v}`);
    });
    // Append an override block so new vars always win (last :root wins in CSS cascade)
    const overrideBlock = `/* codeit-color-override */ :root { ${Object.entries(vars).map(([k, v]) => `${k}: ${v}`).join('; ')} }`;
    if (updated.includes('/* codeit-color-override */')) {
      updated = updated.replace(/\/\* codeit-color-override \*\/ :root \{[^}]*\}/, overrideBlock);
    } else {
      updated = updated.replace(/<\/style>(?![\s\S]*<\/style>)/, `${overrideBlock}\n</style>`);
    }
    return updated;
  });
}

export function makeHandleApplyColors(studio) {
  const { aiTitle, bakeColorsIntoCode, code, commitInstantChange, promptHistory, pushLocalVersion, setCode, setInstantNotice, setIsSaved, setSaveStatus, trackPersonalizationOnce } = studio;
  return (function handleApplyColors(vars, themeName) {
    if (!code) return '';
    const painted = paintCode(code, vars);
    if (painted.changes.length) {
      const said = describePaint(painted.changes, themeName);
      commitInstantChange(painted.code, `${themeName || 'Colour'} colours`, said);
      return said;
    }
    if (colourSettings(code).length) {
      // The project has colour settings and every one is already this colour.
      const said = `${themeName ? `${themeName} is` : 'Those colours are'} already in your game. Pick a different one to see it change.`;
      setInstantNotice(said);
      return said;
    }
    const newCode = bakeColorsIntoCode(vars);
    setCode(newCode);
    setIsSaved(false);
    setSaveStatus(null);
    pushLocalVersion('Color change', newCode, promptHistory, aiTitle);
    trackPersonalizationOnce();
    return '';
  });
}

export function makeFetchServerVersions(studio) {
  const { setHistoryLoading, setServerVersions, token } = studio;
  return (async function fetchServerVersions(projectId) {
    if (!projectId || !token) return;
    setHistoryLoading(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/api/builder/projects/${projectId}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setServerVersions(data.versions.map(v => ({
          id:        `server-${v.id}`,
          serverId:  v.id,
          label:     v.label || 'Saved',
          title:     v.title || '',
          primary:   v.primary_color || '#FF7A00',
          accent:    v.accent_color  || '#A855F7',
          createdAt: v.created_at,
          isLocal:   false,
        })));
      }
    } catch (_) {}
    finally { setHistoryLoading(false); }
  });
}

export function makeRestoreVersion(studio) {
  const { restoringVersion, savedProjectId, setActiveVersionId, setAiTitle, setCode, setIsSaved, setLocalVersions, setPromptHistory, setRestoringVersion, setSaveStatus, setShowHistory, token } = studio;
  return (async function restoreVersion(version) {
    if (restoringVersion) return;
    setRestoringVersion(true);
    try {
      if (version.isLocal) {
        setCode(version.code);
        setAiTitle(version.title || '');
        setPromptHistory(version.promptHistory || []);
        setIsSaved(false);
        setSaveStatus(null);
        setActiveVersionId(version.id);
      } else {
        const res  = await fetch(
          `${API_BASE_URL}/api/builder/projects/${savedProjectId}/versions/${version.serverId}/restore`,
          { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Restore failed');
        const restored = data.code;
        const { primary, accent } = extractColors(restored);
        const localId = `local-${Date.now()}`;
        setLocalVersions(prev => [{
          id:            localId,
          label:         version.label,
          title:         data.title || version.title || '',
          code:          restored,
          // jsonb arrives as an array on Postgres; JSON.parse of an array threw and the history was lost.
          promptHistory: (() => { if (Array.isArray(data.prompt_history)) return data.prompt_history; try { return JSON.parse(data.prompt_history || '[]'); } catch { return []; } })(),
          primary, accent,
          createdAt:     version.createdAt || new Date().toISOString(),
          isLocal:       true,
        }, ...prev].slice(0, 20));
        setCode(restored);
        setAiTitle(data.title || version.title || '');
        setActiveVersionId(localId);
        setIsSaved(true);
        setSaveStatus(null);
      }
      setShowHistory(false);
    } catch (err) {
      console.error('Restore failed:', err.message);
    } finally {
      setRestoringVersion(false);
    }
  });
}

export function makeEffect9(studio) {
  const { autoBuildRef, location, personalizationTrackedRef, setAiTitle, setBuildKey, setBuiltPrompt, setCode, setIsSaved, setProjectType, setPrompt, setPromptHistory, setSavedProjectId, setShowEditPanel, shelfIdRef, token } = studio;
  return (() => {
    const params = new URLSearchParams(location.search);
    const pre = params.get('prompt');
    if (pre) setPrompt(pre);

    // ?shelf=<id> — a project the child made before, tapped from the front page.
    //
    // Checked before ?start, so returning to something you made always wins
    // over starting something new.
    migrateLegacyDraft(localStorage);
    const shelved = getShelfProject(localStorage, params.get('shelf'));
    if (shelved) {
      shelfIdRef.current = shelved.id;
      setPrompt(shelved.prompt);
      setBuiltPrompt(shelved.prompt);
      setProjectType(shelved.projectType);
      setAiTitle(shelved.title);
      setCode(shelved.code);
      setPromptHistory([shelved.prompt].filter(Boolean));
      setBuildKey(k => k + 1);
      void trackEvent('shelf_project_reopened');
      return;
    }

    // ?start=catch-stars — a game the child tapped on the front page.
    //
    // It is already written, so it appears now rather than after twenty
    // seconds of watching a spinner. That wait was the single longest gap
    // between "I want a game" and "I have a game", and for a seven-year-old
    // twenty seconds is a very long time to believe nothing is broken.
    const starter = starterProjectById(params.get('start'));
    if (starter) {
      setPrompt(starter.prompt);
      setBuiltPrompt(starter.prompt);
      // The rest of the studio already knows these three words: they choose the
      // companion's tips and which set of one-tap changes is offered. A quiz
      // offered "make the enemies faster" would be a promise the code cannot
      // keep.
      setProjectType(STARTER_TYPES[starter.kind] || 'website');
      setAiTitle(starter.label);
      setCode(starter.code);
      setPromptHistory([starter.prompt]);
      setBuildKey(k => k + 1);
    }
    if (!starter && pre && pre.trim() && params.get('go') === '1') {
      // scratch=1: the child already has the quick game for this sentence and
      // asked for it written from scratch, so the quick path is skipped.
      autoBuildRef.current = { text: pre.trim().slice(0, 1000), scratch: params.get('scratch') === '1' };
    }

    // Auto-load a remixed project (redirected from /project/:publicId after remix)
    const remixId = params.get('remix');
    if (remixId && token) {
      fetch(`${API_BASE_URL}/api/builder/projects/${remixId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => {
          if (!data.success) return;
          const p = data.project;
          setPrompt(p.prompt || '');
          setCode(p.generated_code);
          setBuiltPrompt(p.prompt || '');
          setProjectType(p.project_type || 'website');
          setAiTitle(p.title || '');
          setPromptHistory([p.prompt || '']);
          personalizationTrackedRef.current = true;
          setIsSaved(true);
          setSavedProjectId(p.id);
          setBuildKey(k => k + 1);
          setShowEditPanel(true);
        })
        .catch(() => {});
    }
  });
}

export function makeEffect10(studio) {
  const { location, navigate, personalizationTrackedRef, setAiTitle, setBuildKey, setBuiltPrompt, setBuiltSummary, setCode, setConceptsUsed, setGuestDraftRecovered, setHasPersonalized, setHasPlayedOnce, setHasTestedLatest, setProjectType, setPrompt, setPromptHistory, setResumeAction, skipNextGuestDraftPersistRef, user } = studio;
  return (() => {
    const raw = sessionStorage.getItem('codeit_builder_draft');
    if (raw) {
      try {
        const draft = JSON.parse(raw);
        if (!draft.code) return;
        setCode(draft.code);
        setPrompt(draft.prompt || '');
        setBuiltPrompt(draft.builtPrompt || '');
        setProjectType(draft.projectType || 'website');
        setAiTitle(draft.aiTitle || '');
        setBuiltSummary(draft.builtSummary || '');
        setConceptsUsed(draft.conceptsUsed || []);
        setPromptHistory(draft.promptHistory || []);
        const personalized = draft.hasPersonalized === true || (draft.promptHistory || []).length > 1;
        personalizationTrackedRef.current = personalized;
        setHasPersonalized(personalized);
        const draftIsFresh = Number.isFinite(draft.savedAt) && Date.now() - draft.savedAt < 30 * 60 * 1000;
        const requestedAction = ['save', 'publish'].includes(location.state?.resumeBuilderAction)
          ? location.state.resumeBuilderAction
          : location.state?.resumeBuilderSave === true
            ? 'save'
            : null;
        // A fresh account handoff came from the final quality-check button. Keep
        // older handoff drafts working even though they predate these flags.
        const handoffCompleted = Boolean(requestedAction && draftIsFresh);
        setHasPlayedOnce(draft.hasPlayedOnce === true || handoffCompleted);
        setHasTestedLatest(draft.hasTestedLatest === true || handoffCompleted);
        setBuildKey(k => k + 1);
        setResumeAction(draftIsFresh ? requestedAction : null);
        if (!requestedAction || !draftIsFresh) {
          sessionStorage.removeItem('codeit_builder_draft');
        }
        if (requestedAction) {
          navigate('/builder', { replace: true, state: null });
        }
        return;
      } catch (_) {
        sessionStorage.removeItem('codeit_builder_draft');
      }
    }

    if (user) return;

    // A child who has just tapped a game on the front page, or tapped a project
    // on their shelf, has said which project they want. Restoring the old draft
    // over the top of it would hand them yesterday's game and quietly discard
    // the one they asked for — which is exactly what happened before this
    // check: tapping "Penalty shootout" gave you the star catcher back.
    const asked = new URLSearchParams(location.search || '');
    if (asked.get('start') || asked.get('shelf')) return;

    const draft = readGuestProjectDraft(localStorage);
    if (!draft || !isValidHtml(draft.code)) {
      if (draft) clearGuestProjectDraft(localStorage);
      return;
    }
    skipNextGuestDraftPersistRef.current = true;
    setCode(draft.code);
    setPrompt(draft.prompt || '');
    setBuiltPrompt(draft.builtPrompt || '');
    setProjectType(draft.projectType || 'website');
    setAiTitle(draft.aiTitle || '');
    setBuiltSummary(draft.builtSummary || '');
    setConceptsUsed(draft.conceptsUsed || []);
    setPromptHistory(draft.promptHistory || []);
    const personalized = draft.hasPersonalized === true || (draft.promptHistory || []).length > 1;
    personalizationTrackedRef.current = personalized;
    setHasPersonalized(personalized);
    setHasPlayedOnce(draft.hasPlayedOnce === true || personalized);
    setHasTestedLatest(draft.hasTestedLatest === true || personalized);
    setGuestDraftRecovered(true);
    setBuildKey(k => k + 1);
    void trackEvent('guest_draft_recovered');
  });
}

export function makeEffect11(studio) {
  const { aiTitle, builtPrompt, builtSummary, code, conceptsUsed, hasPersonalized, hasPlayedOnce, hasTestedLatest, isSaved, projectType, prompt, promptHistory, shelfIdRef, skipNextGuestDraftPersistRef, user } = studio;
  return (() => {
    if (user || !code || isSaved) return undefined;
    if (skipNextGuestDraftPersistRef.current) {
      skipNextGuestDraftPersistRef.current = false;
      return undefined;
    }
    const timer = setTimeout(() => {
      saveGuestProjectDraft(localStorage, {
        code,
        prompt,
        builtPrompt,
        projectType,
        aiTitle,
        builtSummary,
        conceptsUsed,
        promptHistory,
        hasPersonalized,
        hasPlayedOnce,
        hasTestedLatest,
      });

      // And onto the shelf, which unlike the single draft above can hold more
      // than one thing — so tomorrow's game does not delete today's. The id is
      // kept so that editing keeps writing to the same entry instead of filling
      // the shelf with eight copies of one project.
      const stored = saveToShelf(localStorage, {
        id: shelfIdRef.current,
        title: aiTitle || deriveProjectName(builtPrompt || prompt || 'My project'),
        prompt: builtPrompt || prompt,
        projectType,
        code,
      });
      if (stored) shelfIdRef.current = stored.id;
    }, 250);
    return () => clearTimeout(timer);
  });
}

export function makeEffect17(studio) {
  const { code, setCustomAccent, setCustomBg, setCustomPrimary, setCustomText, setInstantNotice, setInstantPrefs, setTitleDraft, studioPanel } = studio;
  return (() => {
    if (studioPanel === 'colors' && code) {
      setCustomBg(code.match(/--bg:\s*(#[\da-fA-F]{3,8})/)?.[1] || '#FFF6ED');
      setCustomPrimary(code.match(/--primary:\s*(#[\da-fA-F]{3,8})/)?.[1] || '#FF7A00');
      setCustomAccent(code.match(/--accent:\s*(#[\da-fA-F]{3,8})/)?.[1] || '#A855F7');
      setCustomText(code.match(/--text:\s*(#[\da-fA-F]{3,8})/)?.[1] || '#38291F');
    }
    if (studioPanel === 'mine' && code) {
      // Read the choices back out of the project so reopening the panel — or
      // loading a saved project — shows what the student actually picked.
      setInstantPrefs(readInstantPrefs(code));
      setTitleDraft(readProjectHeading(code));
      setInstantNotice('');
    }
  });
}

export function makeEffect18(studio) {
  const { companionVisible, projectType, setCompanionTip } = studio;
  return (() => {
    if (!companionVisible) return;
    const t = (projectType || '').toLowerCase();
    const pool =
      /quiz/.test(t)                                                         ? COMPANION_TIPS.quiz :
      /game|clicker|runner|memory|reaction|soccer/.test(t)                   ? COMPANION_TIPS.game :
      /website|portfolio|restaurant|shop|sports|blog|landing/.test(t)        ? COMPANION_TIPS.website :
      /tool|calculator|timer|drawing|flashcard/.test(t)                      ? COMPANION_TIPS.tool :
      COMPANION_TIPS.default;

    let idx = Math.floor(Math.random() * pool.length);
    setCompanionTip(pool[idx]);
    const id = setInterval(() => {
      idx = (idx + 1) % pool.length;
      setCompanionTip(pool[idx]);
    }, 15000);
    return () => clearInterval(id);
  });
}

export function makeEffect19(studio) {
  const { companionTip, companionVisible, setTipBlocked, toastsRef } = studio;
  return (() => {
    if (!companionVisible || !companionTip) return undefined;
    let frame = 0;
    const check = () => {
      frame = 0;
      const stack = toastsRef.current;
      const bar = document.querySelector('.bldr-success-banner');
      if (!stack || !bar) { setTipBlocked(false); return; }
      const a = stack.getBoundingClientRect();
      const b = bar.getBoundingClientRect();
      // Where the tip would be: the stack's corner, as tall as a tip.
      const tip = { left: window.innerWidth - Math.min(240, window.innerWidth - 24) - 12, right: window.innerWidth - 12, top: a.top, bottom: a.top + 72 };
      setTipBlocked(tip.left < b.right && tip.right > b.left && tip.top < b.bottom && tip.bottom > b.top);
    };
    const later = () => { if (!frame) frame = window.requestAnimationFrame(check); };
    check();
    window.addEventListener('scroll', later, { passive: true });
    window.addEventListener('resize', later);
    return () => {
      window.removeEventListener('scroll', later);
      window.removeEventListener('resize', later);
      if (frame) window.cancelAnimationFrame(frame);
    };
  });
}

export function makeEffect24(studio) {
  const { codeRef, editModeOnRef, iframeRef, personalizedRef, playedReportedRef, popXp, previewKeyRef, sendBridgeCmd, setCode, setEditHistory, setElAnim, setElBgColor, setElColor, setElPadding, setElPanelTab, setElText, setHasPlayedOnce, setHasTestedLatest, setIsSaved, setPatchError, setRunErrors, setSafety, setSaveStatus, setSelectedEl, setShowElPanel, setStudioBest, settleTimer, tokenRef, trackPersonalizationOnce } = studio;
  return (() => {
    function handleIframeMessage(e) {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const d = e.data;
      if (!d || typeof d.type !== 'string') return;
      if (d.type === 'CODEIT_SELECTED') {
        setSelectedEl(d);
        setElText(d.text || '');
        setElColor(d.styles?.color || '');
        setElBgColor(d.styles?.bg || '');
        setElPadding(parseInt(d.styles?.pt) || 0);
        setElAnim(d.styles?.anim && d.styles.anim !== 'none' ? d.styles.anim : '');
        setElPanelTab(d.isText ? 'text' : 'colors');
        setPatchError('');
        setShowElPanel(true);
      }
      if (d.type === 'CODEIT_HTML') {
        // stripPreviewScripts, here and below: the frame serialises the whole
        // live document, which contains the editor bridge and the storage shim
        // we injected. Saving that would grow the project on every edit and
        // ship one child's high score to everyone who plays their game.
        setCode(stripPreviewScripts(d.html));
        setIsSaved(false);
      }
      if (d.type === 'CODEIT_SYNC') {
        // Text, colour, delete, duplicate and resize all end here. Until now
        // this message was ignored, so those edits only reached the code when
        // the student happened to leave edit mode — and a child who deleted
        // something and pressed Save straight away lost the deletion.
        setCode(stripPreviewScripts(d.html));
        setIsSaved(false);
        setSaveStatus(null);
      }
      if (d.type === 'CODEIT_MOVED') {
        // Snapshot before the move lands, so "Undo" puts it back where it was.
        setEditHistory(prev => rememberEdit(prev, codeRef.current, 'Moved it'));
        // A drag is a real edit, so it lands in the code straight away and
        // counts towards the save gate. Baking it in reloads the iframe, which
        // is why CODEIT_READY re-enables edit mode below — otherwise moving one
        // thing would silently kick the student out of the editor.
        setCode(stripPreviewScripts(d.html));
        setIsSaved(false);
        setSaveStatus(null);
        trackPersonalizationOnce();
        popXp(0, 'Moved it');
      }
      if (d.type === 'CODEIT_READY' && editModeOnRef.current) {
        sendBridgeCmd('ENABLE');
      }
      if (isErrorMessage(d)) {
        // The project threw. Record it against the code that is running right
        // now, so the safety net knows this exact version is broken.
        const described = describeError(d);
        if (described) {
          setRunErrors(prev => collapseErrors([...prev, described]));
          setSafety(prev => markBroken(prev, codeRef.current));
          clearTimeout(settleTimer.current);
        }
        return;
      }
      {
        const score = readScoreMessage(d);
        if (score !== null) { setStudioBest((prev) => Math.max(prev, score)); return; }
      }
      if (isStorageMessage(d)) {
        // The preview saved something — a high score, a level, a name. It runs
        // on an opaque origin with no storage of its own, so we keep it here,
        // scoped to this one project.
        savePreviewStorage(previewKeyRef.current, d.data);
        return;
      }
      if (d.type === 'CODEIT_PLAYED') {
        // Students naturally test by using the buttons inside their game or
        // website—not by finding a separate CodeIt control.
        //
        // This is also the gate on Save and Publish, and until 1 September
        // 2026 it emitted nothing, so the drop between a project being
        // generated and a project being saved could not be attributed to
        // anything. Fired once per build, not once per click, because the
        // question is whether the child touched their project at all.
        if (!playedReportedRef.current) {
          playedReportedRef.current = true;
          void trackEvent('project_played', null, tokenRef.current);
          // The first run of their own program is a real moment, and it used
          // to pass in silence.
          popXp(0, 'That is your game, running.');
        }
        // The engaged start for a game: a real tap, key or click inside it.
        // Once per session, whichever project.
        void trackActivityStart('game-play', tokenRef.current);
        // The finish: the child changed the game and is now playing the
        // changed version. Once per session, and never for a change alone.
        if (personalizedRef.current) void trackActivityComplete('game-changed-tested', tokenRef.current);
        setHasPlayedOnce(true);
        setHasTestedLatest(true);
      }
    }
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  });
}

export function makeToggleEditMode(studio) {
  const { editModeOn, editModeOnRef, sendBridgeCmd, setEditModeOn, setPatchError, setSelectedEl, setShowEditPanel, setShowElPanel, setShowHistory, setWorkspaceTab } = studio;
  return (function toggleEditMode() {
    const next = !editModeOn;
    // The panel, the undo bar and the "click anything" hint all live on the
    // Change tab. Turning edit mode on from anywhere else armed the frame and
    // left the child with outlines appearing under their finger and nothing to
    // explain them.
    if (next) setWorkspaceTab('change');
    editModeOnRef.current = next;
    setEditModeOn(next);
    if (!next) {
      setSelectedEl(null);
      setShowElPanel(false);
      setPatchError('');
      sendBridgeCmd('DISABLE');
    } else {
      setShowEditPanel(false);
      setShowHistory(false);
      sendBridgeCmd('ENABLE');
    }
  });
}

export function makeHandleAiRefine(studio) {
  const { aiRefineText, selectedEl, sendBridgeCmd, setAiRefineText, setPatchError, setPatchLoading, trackPersonalizationOnce } = studio;
  return (async function handleAiRefine() {
    if (!selectedEl || !aiRefineText.trim()) return;
    setPatchLoading(true);
    setPatchError('');
    try {
      const elementHtml = `<${selectedEl.tag} id="${selectedEl.id}">${selectedEl.text}</${selectedEl.tag}>`;
      const res  = await fetch(`${API_BASE_URL}/api/builder/patch`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          elementId:   selectedEl.id,
          tag:         selectedEl.tag,
          elementHtml,
          instruction: aiRefineText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI patch failed');
      sendBridgeCmd('SET_PATCH', { id: selectedEl.id, html: data.patchedHtml });
      setAiRefineText('');
      trackPersonalizationOnce();
    } catch (err) {
      setPatchError(reportFailure('Element patch', err, 'That change did not go through. Try describing it a different way.'));
    } finally {
      setPatchLoading(false);
    }
  });
}
