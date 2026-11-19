/* eslint-disable no-useless-escape -- fallback project templates intentionally preserve escaped HTML/JS */
// Part 2 of what the studio does: the long handlers and effects of Builder(), moved out word for
// word. Each "make" function is handed, as one object, exactly the names the code used inside
// Builder(), and gives back the function that used to be written there.
// See Builder.js for why the studio is in parts.
import { API_BASE_URL } from '../../config/api';
import { MISSIONS_ENABLED, detectProjectType, fetchAiMissions, getMissions } from './studioKit1';
import { RECIPE_KINDS, recipeGame } from './recipeGame';
import { STARTER_TEMPLATES, isValidHtml } from './studioKit2';
import { awardChest } from '../../utils/chests';
import { beatLink } from './scoreBridge';
import { clearGuestProjectDraft } from '../../utils/guestProjectDraft';
import { clearHistory } from './editHistory';
import { displayTitle } from '../../utils/displayTitle';
import { isSessionError } from '../../utils/tokenExpiry';
import { journeyHeaders } from '../../utils/journey';
import { namedGame } from '../Build/gameWords';
import { readBuildStream } from './buildStream';
import { reportFailure } from '../../utils/humanError';
import { tabAfter } from './builderTabs';
import { trackEvent } from '../../utils/trackEvent';

export function makeCallBuilder(studio) {
  const { namedByChildRef, personalizationTrackedRef, playedReportedRef, pushLocalVersion, quietStudio, setAiTitle, setBuildKey, setBuildProgress, setBuiltPrompt, setBuiltSummary, setCoachOpen, setCode, setCompanionVisible, setConceptsUsed, setEditError, setEditHistory, setError, setExplanation, setGuestDraftRecovered, setHasPersonalized, setHasPlayedOnce, setHasTestedLatest, setIsPlayMode, setIsSaved, setIsStarter, setLimitReached, setLoading, setLoadingPreviewType, setMissions, setPreviousCode, setProjectType, setPromptHistory, setSaveStatus, setShowEditPanel, setShowWow, setStarterRetry, setStudioBest, setUnsavedWarning, setWorkspaceTab, setWowType, token, waitingRef, wowShownRef } = studio;
  return (async (text, { escalate = false, scratch = false } = {}) => {
    // ── Look at the thing you were given ───────────────────────────────────
    //
    // The prompt box sits below the twenty starter cards, so a child who typed
    // their own idea is scrolled several hundred pixels down when they press
    // Build. The empty state then disappears and the waiting game renders at
    // the top of a much shorter page — above where they are looking. They spend
    // the whole build staring at whatever happens to be under their scroll
    // position.
    //
    // Two frames, because the loading state has to render before there is
    // anything to scroll to.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      waitingRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }));

    personalizationTrackedRef.current = false;
    setHasPersonalized(false);
    setHasPlayedOnce(false);
    setHasTestedLatest(false);
    playedReportedRef.current = false;
    setIsStarter(false);
    namedByChildRef.current = false;
    // Reopened for a learner who wants the guidance, not for one who has said
    // they want to explore on their own. A 23-year-old told us there is too
    // much text and talking, and this was a mascot reappearing after every
    // single build no matter how many times it had been put away.
    setCoachOpen(quietStudio ? false : true);
    setGuestDraftRecovered(false);
    const previewType = detectProjectType(text);
    setLoadingPreviewType(previewType);
    setBuildProgress(null);
    setStudioBest(0);
    setLoading(true);
    setError('');
    setLimitReached('');
    setCode('');
    setBuiltSummary('');
    setAiTitle('');
    setProjectType('website');
    setConceptsUsed([]);
    setExplanation('');
    setIsSaved(false);
    setSaveStatus(null);
    setUnsavedWarning(false);
    setPromptHistory([]);
    setPreviousCode('');
    setEditHistory(clearHistory());
    setWorkspaceTab(prev => tabAfter('built', prev));
    setShowEditPanel(false);
    setEditError('');
    // ── The instant path ───────────────────────────────────────────────────
    //
    // A ship game typed by a child in a classroom on 15 October 2026 waited
    // through two full builds and got a "could not build it" card. For a game
    // idea the server now answers with a recipe in about two seconds, the
    // engine in recipeGame.js turns it into a playable game here, and the
    // full build is never waited for. If this call fails for any reason the
    // code falls through to the full build exactly as before.
    // Tic tac toe, chess, hangman: none of the nine quick kinds, so straight
    // to the full build rather than a catch game that ignores the idea.
    const ownRules = Boolean(namedGame(text) && !namedGame(text).kind);
    if (!escalate && !ownRules && !scratch) {
      try {
        const quickController = new AbortController();
        const quickTimeout = setTimeout(() => quickController.abort(), 12000);
        const quick = await fetch(`${API_BASE_URL}/api/builder/recipe`, {
          method: 'POST', signal: quickController.signal,
          headers: { 'Content-Type': 'application/json', ...journeyHeaders(), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ prompt: text }),
        });
        clearTimeout(quickTimeout);
        const quickData = quick.ok ? await quick.json() : null;
        // The server read the idea better than the guess above: "tic tac
        // toe" has no game words in it, and was waiting as a website.
        if (quickData?.game === true) setLoadingPreviewType('game');
        // An idea none of the nine kinds fits goes to the full build, which can
        // write anything, unless the model is out of reach; then the closest
        // quick game is better than a starter that ignores the idea.
        const fitsAKind = quickData?.fits !== false || quickData?.ai === 'down';
        if (quickData?.game && quickData.recipe && RECIPE_KINDS.includes(quickData.recipe.kind) && fitsAKind) {
          const html = recipeGame(quickData.recipe);
          setCode(html);
          setBuiltPrompt(text);
          setIsStarter(false);
          setStarterRetry(null);
          awardChest('first-build');
          setBuiltSummary(`Your ${quickData.recipe.kind} game. You are ${quickData.recipe.player}, watch out for ${quickData.recipe.enemy}. Change any line at the top of the code.`);
          setAiTitle(quickData.recipe.title);
          setProjectType('game');
          setConceptsUsed(['variables', 'if-else', 'loops', 'functions']);
          setPromptHistory([text]);
          setBuildKey(k => k + 1);
          setShowEditPanel(false);
          setIsPlayMode(false);
          setCompanionVisible(!quietStudio);
          pushLocalVersion(`Build: ${text.slice(0, 50)}`, html, [text], quickData.recipe.title);
          setLoading(false);
          return;
        }
      } catch (quickErr) {
        // fall through to the full build
      }
    }

    const buildController = new AbortController();
    // The server has 165 s for the whole build (BUILD_BUDGET in
    // routes/builder.js): a first attempt that may use most of it, and a
    // retry on the next model up only if there is time for one to finish.
    // From here it is one request, and 175 s leaves room for the answer.
    const buildTimeout = setTimeout(() => buildController.abort(), 175000);
    try {
      const response = await fetch(`${API_BASE_URL}/api/builder`, {
        method:  'POST',
        signal:  buildController.signal,
        headers: {
          'Content-Type': 'application/json',
          // Round 143: ask to watch it being written. A server or a proxy that
          // does not stream still answers with the same JSON as before.
          Accept: 'application/x-ndjson, application/json',
          ...journeyHeaders(),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body:    JSON.stringify(escalate ? { prompt: text, escalate: true } : { prompt: text }),
      });
      const responseType = response.headers.get('content-type') || '';
      let data;
      let res = response;
      if (responseType.includes('application/x-ndjson') && response.body?.getReader) {
        // The timer stays on until the last line: a stream that stops
        // halfway must still end in "timed out", not a spinner for ever.
        const finished = await readBuildStream(response.body, (p) => setBuildProgress(p));
        if (!finished) throw new Error('The studio stopped answering halfway. Please try again in a moment.');
        data = finished;
        res = { status: finished.status || 200, ok: (finished.status || 200) < 400 };
      } else if (responseType.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error('The studio is temporarily unavailable. Please try again in a moment.');
      }
      clearTimeout(buildTimeout);
      // 402 with this code is the monthly allowance, not a fault. It gets its
      // own panel with a way forward, not the red error card.
      if (res.status === 402 && data.code === 'FREE_AI_LIMIT_REACHED') {
        setLimitReached(data.error || data.message || '');
        // The refusal itself is recorded by the server, which is the only
        // place that knows it happened. Whether the offer was actually put in
        // front of anyone is recorded where the card is rendered, further down
        // this file, and not here: at this instant the server may not have
        // said yet whether this account may be charged, so a count taken here
        // misses anyone whose answer was still in flight.
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      const generatedHtml = data.html || data.code;
      const html = data.isFallback
        ? (STARTER_TEMPLATES[previewType] || generatedHtml)
        : generatedHtml;
      if (!isValidHtml(html)) throw new Error('The builder returned an incomplete page. Please try again.');
      setCode(html);
      setBuiltPrompt(text);
      setIsStarter(Boolean(data.isFallback));
      // rest: the whole site has built all it can today. Said as that, with
      // the hours, and not as "I tried your idea twice", which did not happen.
      setStarterRetry(data.isFallback && data.rest?.hours
        ? { rest: Number(data.rest.hours) || 1 }
        : (data.isFallback && data.retry ? data.retry : null));
      // The first build finished is the single best moment this product has,
      // and it passed quietly. A chest, with fixed contents, that waits in the
      // corner until the child wants it. A canned starter is not a build.
      if (!data.isFallback) awardChest('first-build');
      setBuiltSummary(data.isFallback ? '' : (data.summary || ''));
      // A starter must not wear the child's title. "Game where a cat jumps"
      // printed above a star-clicking game is the sentence that teaches a
      // nine-year-old this site does not listen.
      setAiTitle(data.isFallback ? '' : (data.title || ''));
      setProjectType(data.type || 'website');
      setConceptsUsed(Array.isArray(data.conceptsUsed) ? data.conceptsUsed : []);
      setPromptHistory([text]);
      setBuildKey(k => k + 1);
      setShowEditPanel(false);
      const builtType = data.type || 'website';
      // Let the learner press Play themselves so the guide can teach the action.
      setIsPlayMode(false);
      // Upgrade missions are OFF (rounds 66 and 67). They were model-written
      // specifications ("increase spawn rate by 100ms every 10 seconds") in
      // circles that cut the text mid-word. The hand-written, checkable,
      // one-at-a-time version is the ladder in challenges.js. Until a project
      // type has five rungs of its own, empty space is better than this.
      if (MISSIONS_ENABLED) {
        setMissions(getMissions(builtType));
        fetchAiMissions(html, builtType, data.title || '', token).then(aiMissions => {
          if (aiMissions) setMissions(aiMissions);
        });
      }
      // Companion and the celebration overlay: both are for someone who needs
      // to be told that something good happened. An independent learner can
      // see that for themselves, and being congratulated by a cartoon is the
      // fastest way to make an adult close the tab.
      setCompanionVisible(!quietStudio);
      // Not for a starter. "YOU BUILT A REAL WEBSITE" and confetti over a
      // page with none of the child's words in it was the loudest thing on
      // the screen, directly above a notice saying the idea was not built
      // (seen 19 November 2026). And a starter must not use up the one time
      // this is shown: the real build that follows is the one that earns it.
      if (!data.isFallback && !wowShownRef.current && !quietStudio) {
        wowShownRef.current = true;
        setWowType(builtType);
        setTimeout(() => {
          setShowWow(true);
          setTimeout(() => setShowWow(false), 3800);
        }, 600);
      }
      pushLocalVersion(`Build: ${text.slice(0, 50)}`, html, [text], data.title || '');
    } catch (err) {
      clearTimeout(buildTimeout);
      setError(err.name === 'AbortError' ? 'Build timed out. Please try again.' : err.message);
    } finally {
      setLoading(false);
    }
  });
}

export function makeApplyEdit(studio) {
  const { aiTitle, builtSummary, code, editRetrySeconds, editing, projectName, promptHistory, pushLocalVersion, setBuiltSummary, setCode, setEditError, setEditInstruction, setEditRetrySeconds, setEditing, setIsSaved, setPreviousCode, setPromptHistory, setSaveStatus, token, trackPersonalizationOnce } = studio;
  return (async (instruction) => {
    if (!code || !instruction.trim() || editing || editRetrySeconds > 0) return;
    setEditing(true);
    setEditError('');
    const snapshot = code; // save fallback before we touch anything
    const controller = new AbortController();
    // The server gives an edit 55 s in all (EDIT_BUDGET in routes/builder.js).
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
      const res  = await fetch(`${API_BASE_URL}/api/builder/edit`, {
        method:  'POST',
        signal:  controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...journeyHeaders(),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body:    JSON.stringify({
          currentCode:    code,
          currentTitle:   aiTitle || projectName,
          promptHistory:  promptHistory.slice(-5),
          newInstruction: instruction.trim(),
        }),
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (res.status === 429) {
        const headerSeconds = Number(res.headers?.get?.('retry-after'));
        setEditRetrySeconds(Number(data.retryAfterSeconds) || headerSeconds || 60);
        setEditError('AI_LIMIT');
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Edit failed');
      const html = data.html || data.code;
      if (!isValidHtml(html)) throw new Error('The builder returned invalid code. Your project was not changed.');
      // Only touch state after confirmed success
      setPreviousCode(snapshot);
      setCode(html);
      setBuiltSummary(data.summary || builtSummary);
      setPromptHistory(prev => [...prev, instruction.trim()]);
      setIsSaved(false);
      setSaveStatus(null);
      setEditInstruction('');
      setEditRetrySeconds(0);
      pushLocalVersion(`Edit: ${instruction.slice(0, 45)}`, html, [...promptHistory, instruction.trim()], aiTitle);
      trackPersonalizationOnce();
      // Don't rebuildKey — keeps iframe alive; srcdoc update re-renders the content
    } catch (err) {
      clearTimeout(timeoutId);
      // Code unchanged — snapshot was never committed
      const msg = err.name === 'AbortError'
        ? 'That change took too long. Your project was not changed. Try asking for one smaller change.'
        : err.message;
      setEditError(msg);
    } finally {
      setEditing(false);
    }
  });
}

export function makeHandleExplain(studio) {
  const { code, setExplainError, setExplaining, setExplanation } = studio;
  return (async () => {
    if (!code) return;
    setExplaining(true);
    setExplainError('');
    setExplanation('');
    try {
      const res  = await fetch(`${API_BASE_URL}/api/builder/explain`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setExplanation(data.explanation);
    } catch (err) {
      setExplainError(reportFailure('Explain project', err, 'We could not explain this one just now. Your project is fine.'));
    } finally {
      setExplaining(false);
    }
  });
}

export function makeHandleSaveProject(studio) {
  const { awardXP, builtPrompt, code, continueAfterAuth, hasTestedLatest, isPersonalized, namedByChildRef, namingRef, popXp, projectName, projectType, promptHistory, saveInFlightRef, savedProjectId, savedProjects, setAiTitle, setIsSaved, setNaming, setPaperBurst, setSaveError, setSaveStatus, setSavedProjectId, setSavedProjects, token, user } = studio;
  return (async ({ name, skipNaming = false } = {}) => {
    if (!code) return;
    if (!isPersonalized || !hasTestedLatest) return;
    if (!user || !token) {
      continueAfterAuth('save');
      return;
    }
    // The first save of a project asks for its name. Later saves keep it.
    if (!savedProjectId && !name && !skipNaming && !namedByChildRef.current) {
      setNaming({ value: displayTitle(projectName || 'My project') });
      setTimeout(() => namingRef.current?.select?.(), 0);
      return;
    }
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    setSaveStatus('saving');
    setSaveError('');
    // The name the child chose, then the one they were shown, then a name
    // derived from their prompt. Never a sentence.
    const title = (name && name.trim()) || displayTitle(projectName || 'My project');
    if (name && name.trim()) setAiTitle(name.trim());
    try {
      const isUpdating = Boolean(savedProjectId);
      const projectUrl = isUpdating
        ? `${API_BASE_URL}/api/builder/projects/${savedProjectId}`
        : `${API_BASE_URL}/api/builder/projects`;
      const res  = await fetch(projectUrl, {
        method:  isUpdating ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...journeyHeaders() },
        body:    JSON.stringify({ title, prompt: builtPrompt, generated_code: code, project_type: projectType }),
      });
      const data = await res.json();
      if (!res.ok && isSessionError(res.status, data.error)) {
        // The session died since the page loaded. Keep everything, sign the
        // browser out, and send them through the gate with the draft intact,
        // exactly as a guest who pressed Save.
        saveInFlightRef.current = false;
        setSaveStatus(null);
        window.dispatchEvent(new Event('codeit:session-invalid'));
        continueAfterAuth('save');
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Could not save project.');
      // Older API versions returned only { success: true } for updates.
      const projectRecord = data.project || {
        ...(savedProjects.find(project => project.id === savedProjectId) || {}),
        id: savedProjectId,
        title,
        prompt: builtPrompt,
        project_type: projectType,
        updated_at: new Date().toISOString(),
      };
      setSavedProjects(prev => isUpdating
        ? prev.map(project => project.id === projectRecord.id ? projectRecord : project)
        : [projectRecord, ...prev]);
      setSavedProjectId(projectRecord.id);
      // The once-in-a-lifetime moment: a kid's FIRST project saved. One paper
      // burst, once ever per browser, never again — celebration that repeats
      // is wallpaper. (CSS side is reduced-motion-guarded.)
      if (!isUpdating) {
        try {
          if (!localStorage.getItem('codeit_first_save_burst')) {
            localStorage.setItem('codeit_first_save_burst', '1');
            setPaperBurst(true);
            setTimeout(() => setPaperBurst(false), 1800);
          }
        } catch (_) { /* storage blocked: skip the confetti, keep the save */ }
      }
      // Keep a restorable snapshot alongside the latest project state.
      const versionRes = await fetch(`${API_BASE_URL}/api/builder/projects/${projectRecord.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          generated_code: code,
          title,
          label: isUpdating ? 'Saved changes' : 'Initial save',
          prompt_history: promptHistory,
        }),
      });
      if (!versionRes.ok && isUpdating && !data.project) {
        throw new Error('Could not save your latest changes. Please try again.');
      }
      setIsSaved(true);
      setSaveStatus('saved');
      sessionStorage.removeItem('codeit_builder_draft');
      clearGuestProjectDraft(localStorage);
      const earnedXp = Number(data.xp_awarded) || 0;
      if (earnedXp > 0) {
        awardXP(earnedXp);
        popXp(earnedXp, 'Project saved');
      }
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (err) {
      setSaveStatus('error');
      setSaveError(reportFailure('Save project', err, 'Your project did not save. Nothing is lost, try again.'));
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      saveInFlightRef.current = false;
    }
  });
}

export function makeHandleLoadProject(studio) {
  const { fetchServerVersions, personalizationTrackedRef, setActiveVersionId, setAiTitle, setBuildKey, setBuiltPrompt, setBuiltSummary, setCode, setEditError, setEditHistory, setExplanation, setHasPersonalized, setHasPlayedOnce, setHasTestedLatest, setIsPublished, setIsSaved, setLocalVersions, setPreviousCode, setProjectOpenError, setProjectOpeningId, setPrompt, setPromptHistory, setPublicId, setPublishStatus, setSaveStatus, setSavedProjectId, setServerVersions, setShowEditPanel, setUnsavedWarning, setWorkspaceTab, token } = studio;
  return (async (project) => {
    try {
    setProjectOpeningId(project.id);
    setProjectOpenError('');
      const res  = await fetch(`${API_BASE_URL}/api/builder/projects/${project.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error();
      const p = data.project;
      let latestCode = p.generated_code;
      let latestTitle = p.title || '';
      let latestPromptHistory = [p.prompt];
      try {
        const versionsRes = await fetch(`${API_BASE_URL}/api/builder/projects/${p.id}/versions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const versionsData = await versionsRes.json();
        const latestVersion = versionsData.success && versionsData.versions?.[0];
        if (latestVersion) {
          const versionRes = await fetch(
            `${API_BASE_URL}/api/builder/projects/${p.id}/versions/${latestVersion.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const versionData = await versionRes.json();
          if (versionData.success) {
            latestCode = versionData.version.generated_code || latestCode;
            latestTitle = versionData.version.title || latestTitle;
            try {
              const storedHistory = typeof versionData.version.prompt_history === 'string'
                ? JSON.parse(versionData.version.prompt_history)
                : versionData.version.prompt_history;
              if (Array.isArray(storedHistory) && storedHistory.length) latestPromptHistory = storedHistory;
            } catch (_) {}
          }
        }
      } catch (_) {}
      setPrompt(p.prompt);
      setCode(latestCode);
      setAiTitle(latestTitle);
      setBuiltPrompt(p.prompt);
      setBuiltSummary('');
      setExplanation('');
      setPromptHistory(latestPromptHistory);
      personalizationTrackedRef.current = true;
      setHasPersonalized(latestPromptHistory.length > 1);
      setHasPlayedOnce(true);
      setHasTestedLatest(true);
      setPreviousCode('');
      setEditHistory(clearHistory());
      setWorkspaceTab(prev => tabAfter('saved', prev));
      setIsSaved(true);
      setSaveStatus(null);
      setUnsavedWarning(false);
      setShowEditPanel(false);
      setEditError('');
      setBuildKey(k => k + 1);
      setSavedProjectId(p.id);
      setIsPublished(!!(p.is_public && p.public_id));
      setPublicId(p.public_id || null);
      setPublishStatus(null);
      setLocalVersions([]);
      setServerVersions([]);
      setActiveVersionId(null);
      fetchServerVersions(p.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setProjectOpenError('We could not open that project. Please check your connection and try again.');
    } finally {
      setProjectOpeningId(null);
    }
  });
}

export function makeHandlePublishSavedProject(studio) {
  const { awardXP, popXp, projectCardAction, savedProjectId, setIsPublished, setJustPublished, setProjectCardAction, setPublicId, setSavedProjects, token, user } = studio;
  return (async (project) => {
    if (
      !project?.id
      || !token
      || user?.managedProfile
      || ['publishing', 'sharing'].includes(projectCardAction.status)
    ) return;
    setProjectCardAction({ id: project.id, status: 'publishing' });
    void trackEvent('activation_next_step', 'publish', token);

    try {
      const res = await fetch(`${API_BASE_URL}/api/builder/projects/${project.id}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, ...journeyHeaders() },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');

      const earnedXp = Number(data.xp_awarded) || 0;
      if (earnedXp > 0) {
        awardXP(earnedXp);
        popXp(earnedXp, 'Project published');
      }

      setSavedProjects(prev => prev.map(saved => (
        saved.id === project.id
          ? { ...saved, is_public: 1, public_id: data.public_id }
          : saved
      )));
      if (savedProjectId === project.id) {
        setIsPublished(true);
        awardChest('first-publish');
        setPublicId(data.public_id);
        // Same moment, same fuss: most children publish through this card,
        // not the footer button, and the celebration belongs to the moment,
        // not to the button that happened to trigger it.
        setJustPublished(true);
      }
      setProjectCardAction({ id: project.id, status: 'published' });
      setTimeout(() => {
        setProjectCardAction(current => (
          current.id === project.id ? { id: null, status: null } : current
        ));
      }, 2200);
    } catch (_) {
      setProjectCardAction({ id: project.id, status: 'error' });
    }
  });
}

export function makeHandleShareSavedProject(studio) {
  const { projectCardAction, setProjectCardAction, token } = studio;
  return (async (project) => {
    if (!project?.public_id || ['publishing', 'sharing'].includes(projectCardAction.status)) return;
    const shareUrl = new URL(`/project/${project.public_id}`, window.location.origin);
    shareUrl.searchParams.set('utm_source', 'project-share');
    const url = shareUrl.toString();
    const title = project.title || 'My Project';
    const text = `I made "${title}" with CodeIt. Try it, then build your own.`;
    let completed = false;

    setProjectCardAction({ id: project.id, status: 'sharing' });
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        setProjectCardAction({ id: project.id, status: 'shared' });
        completed = true;
      } catch (error) {
        if (error?.name === 'AbortError') {
          setProjectCardAction({ id: null, status: null });
          return;
        }
      }
    }

    if (!completed) {
      try {
        await navigator.clipboard.writeText(url);
        setProjectCardAction({ id: project.id, status: 'copied' });
        completed = true;
      } catch (_) {
        setProjectCardAction({ id: project.id, status: 'error' });
      }
    }

    if (completed) {
      void trackEvent('project_share', 'creator', token);
      setTimeout(() => {
        setProjectCardAction(current => (
          current.id === project.id ? { id: null, status: null } : current
        ));
      }, 2200);
    }
  });
}

export function makeClearEditor(studio) {
  const { personalizationTrackedRef, playedReportedRef, promptRef, setActiveVersionId, setAiRefineText, setAiTitle, setBuiltPrompt, setBuiltSummary, setCode, setCompanionTip, setCompanionVisible, setConceptsUsed, setDeviceView, setEditError, setEditHistory, setEditInstruction, setEditModeOn, setEditingDesc, setError, setExplanation, setGuestDraftRecovered, setHasPersonalized, setHasPlayedOnce, setHasTestedLatest, setIsPlayMode, setIsPublished, setIsSaved, setIsStarter, setLoadingPreviewType, setLocalVersions, setMissionActive, setMissions, setPatchError, setPreviousCode, setProjectDesc, setProjectType, setPrompt, setPromptHistory, setPublicId, setPublishStatus, setRestoringVersion, setSaveStatus, setSavedProjectId, setSelectedEl, setServerVersions, setSettingDrafts, setShowEditPanel, setShowElPanel, setShowHistory, setShowWow, setStudioPanel, setUnsavedWarning, setWorkspaceTab } = studio;
  return (() => {
    clearGuestProjectDraft(localStorage);
    personalizationTrackedRef.current = false;
    setPrompt('');
    setCode('');
    setBuiltPrompt('');
    setBuiltSummary('');
    setAiTitle('');
    setProjectType('website');
    setConceptsUsed([]);
    setIsPlayMode(false);
    setExplanation('');
    setError('');
    setIsSaved(false);
    setSaveStatus(null);
    setUnsavedWarning(false);
    setPromptHistory([]);
    setPreviousCode('');
    setEditHistory(clearHistory());
    setWorkspaceTab(prev => tabAfter('built', prev));
    setShowEditPanel(false);
    setEditInstruction('');
    setEditError('');
    setLocalVersions([]);
    setServerVersions([]);
    setShowHistory(false);
    setSavedProjectId(null);
    setActiveVersionId(null);
    setRestoringVersion(false);
    setLoadingPreviewType('');
    setIsPublished(false);
    setPublicId(null);
    setPublishStatus(null);
    setStudioPanel(null);
    setDeviceView('desktop');
    setProjectDesc('');
    setEditingDesc(false);
    // Controls are read out of whatever project is loaded now, so there is no
    // stale slider position to reset — only the half-finished drag.
    setSettingDrafts({});
    setEditModeOn(false);
    setHasPersonalized(false);
    setHasPlayedOnce(false);
    setHasTestedLatest(false);
    playedReportedRef.current = false;
    setIsStarter(false);
    setGuestDraftRecovered(false);
    setSelectedEl(null);
    setShowElPanel(false);
    setPatchError('');
    setAiRefineText('');
    setMissions([]);
    setMissionActive(null);
    setCompanionVisible(false);
    setCompanionTip('');
    setShowWow(false);
    promptRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

export function makeHandleSendToFriend(studio) {
  const { code, friendStatus, projectName, projectType, setFriendPath, setFriendStatus, studioBest, token } = studio;
  return (async () => {
    if (!code || friendStatus === 'making') return;
    setFriendStatus('making');
    try {
      const res = await fetch(`${API_BASE_URL}/api/builder/unlisted`, {
        method: 'POST',
        // Which browser this is, and who is signed in if anyone: the server
        // allows so many links an hour, and without these it could only count
        // by address, so a class of thirty shared one child's allowance.
        headers: { 'Content-Type': 'application/json', ...journeyHeaders(), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          code,
          title: projectName || 'My project',
          projectType,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not make a link.');
      const url = beatLink(data.path, window.location.origin, studioBest, null);
      setFriendPath(data.path);
      setFriendStatus('ready');
      if (studioBest > 0) void trackEvent('score_challenge', 'sent');
      void trackEvent('project_share', 'creator', token);
      // The link is the deliverable, so it is put on the clipboard straight
      // away as well as shown. A child who taps once and walks off with it
      // has still got what they came for.
      try { await navigator.clipboard.writeText(url); } catch (_) {}
    } catch (error) {
      setFriendStatus('error');
    }
  });
}

export function makeHandleShare(studio) {
  const { projectName, publicId, setShareStatus, studioBest, token } = studio;
  return (async () => {
    if (!publicId) return;
    const title = projectName || 'My Project';
    const url = beatLink(`/project/${publicId}`, 'https://codeitlearn.com', studioBest);
    const text = studioBest > 0
      ? `I got ${studioBest} on "${title}", a game I made with CodeIt. Can you beat it?`
      : `I made "${title}" with CodeIt. Try it, then build your own.`;
    let completed = false;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        setShareStatus('shared');
        completed = true;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    if (!completed) {
      try {
        await navigator.clipboard.writeText(url);
        setShareStatus('copied');
        completed = true;
      } catch (_) {}
    }

    if (completed) {
      void trackEvent('project_share', 'creator', token);
      setTimeout(() => setShareStatus(null), 2200);
    }
  });
}
