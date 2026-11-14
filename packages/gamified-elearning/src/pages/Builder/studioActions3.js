/* eslint-disable no-useless-escape -- fallback project templates intentionally preserve escaped HTML/JS */
// Part 3 of what the studio does: the long handlers and effects of Builder(), moved out word for
// word. Each "make" function is handed, as one object, exactly the names the code used inside
// Builder(), and gives back the function that used to be written there.
// See Builder.js for why the studio is in parts.
import { API_BASE_URL } from '../../config/api';
import { awardChest } from '../../utils/chests';
import { clearGuestProjectDraft } from '../../utils/guestProjectDraft';
import { journeyHeaders } from '../../utils/journey';
import { learnerGuideLevel } from '../../utils/guideLevel';
import { trackEvent } from '../../utils/trackEvent';

export function makeHandlePublish(studio) {
  const { awardXP, builtPrompt, code, continueAfterAuth, hasTestedLatest, isPersonalized, popXp, projectName, projectType, savedProjectId, setError, setIsPublished, setIsSaved, setJustPublished, setPublicId, setPublishRefusal, setPublishStatus, setSavedProjectId, setSavedProjects, setShowEditPanel, token, user } = studio;
  return (async () => {
    if (!code) return;
    if (!isPersonalized || !hasTestedLatest) {
      setShowEditPanel(!isPersonalized);
      return;
    }
    if (!user || !token) {
      continueAfterAuth('publish');
      return;
    }
    if (user.managedProfile) {
      setError('This parent-managed learner profile keeps projects private. A parent can still see progress from the family account.');
      return;
    }

    // Save first if not saved
    let projectId = savedProjectId;
    let earnedXp = 0;
    if (!projectId) {
      // Prefer the name the student chose over one derived from their prompt.
      const title = projectName || 'My Project';
      try {
        const res  = await fetch(`${API_BASE_URL}/api/builder/projects`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...journeyHeaders() },
          body:    JSON.stringify({ title, prompt: builtPrompt, generated_code: code, project_type: projectType }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Save failed');
        projectId = data.project.id;
        setSavedProjectId(projectId);
        setSavedProjects(prev => [data.project, ...prev]);
        setIsSaved(true);
        earnedXp += Number(data.xp_awarded) || 0;
      } catch (err) {
        setPublishStatus('error');
        setTimeout(() => setPublishStatus(null), 3000);
        return;
      }
    }

    setPublishStatus('publishing');
    setPublishRefusal(null);
    try {
      const res  = await fetch(`${API_BASE_URL}/api/builder/projects/${projectId}/publish`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, ...journeyHeaders() },
      });
      const data = await res.json();
      if (!res.ok) {
        // A rule, not a failure. It will say the same thing every time, so it
        // stays on screen until the child does something else, and the button
        // stops offering a retry that cannot succeed.
        const isRule = ['MANAGED_PROFILE_PRIVATE', 'PLAN_UPGRADE_REQUIRED'].includes(data.code);
        if (isRule) {
          setPublishRefusal({ code: data.code, message: data.error });
          setPublishStatus('refused');
          void trackEvent('publish_refused', data.code, token);
          return;
        }
        throw new Error(data.error || 'Publish failed');
      }
      earnedXp += Number(data.xp_awarded) || 0;
      if (earnedXp > 0) {
        awardXP(earnedXp);
        popXp(earnedXp, earnedXp >= 50 ? 'Saved and published' : 'Project published');
      }
      setIsPublished(true);
      awardChest('first-publish');
      setPublicId(data.public_id);
      setJustPublished(true);
      sessionStorage.removeItem('codeit_builder_draft');
      clearGuestProjectDraft(localStorage);
      const url = `https://codeitlearn.com/project/${data.public_id}?utm_source=project-share`;
      try { await navigator.clipboard.writeText(url); } catch (_) {}
      setPublishStatus('copied');
      setTimeout(() => setPublishStatus(null), 3000);
    } catch (error) {
      setPublishRefusal({ code: null, message: error.message || 'Publishing did not work. Your project is still saved.' });
      setPublishStatus('error');
    }
  });
}

export function makeEffect32(studio) {
  const { coachRestTimer, coachStage, guideLevelOverride, readCoach, setCoachOpen, user, voiceMode } = studio;
  return (() => {
    const level = guideLevelOverride || learnerGuideLevel(user);
    if (level === 'independent') return undefined;
    setCoachOpen(true);
    // ── Pixel speaks first for children who cannot read yet ─────────────────
    //
    // Mustafa's bar: can the kid do it alone? For a five-year-old the bubble
    // text is a wall however short it is; the words have to arrive as SOUND.
    // So on the big-help level, Pixel reads each new step out loud himself,
    // once, the moment it changes. But never before the child has asked once
    // (message 72): a phone that starts talking on its own is startling on a
    // bus and silently refused by browsers that want a gesture. The switch
    // below remembers "quiet please" on this device.
    if (level === 'early' && voiceMode === 'asked') {
      readCoach(`${coachStage.title}. ${coachStage.detail}`);
    }
    if (level === 'early') return undefined;
    clearTimeout(coachRestTimer.current);
    coachRestTimer.current = setTimeout(() => setCoachOpen(false), 9000);
    return () => clearTimeout(coachRestTimer.current);
    // Re-fires when the step moves on, and when the child asks for the voice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });
}
