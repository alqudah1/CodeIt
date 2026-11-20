/* eslint-disable no-useless-escape -- fallback project templates intentionally preserve escaped HTML/JS */
import { useTheme, nightClass } from '../../utils/theme';
import { useState, useRef, useEffect, useMemo, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Header from '../Header/Header';
import { API_BASE_URL } from '../../config/api';
import { AuthContext } from '../../context/AuthContext';
import { useCharacter } from '../../context/CharacterContext';
import { useSEO } from '../../hooks/useSEO';
import { trackEvent } from '../../utils/trackEvent';
import { DEFAULT_BILLING_STATE, fetchBillingStatus } from '../../utils/billing';
import { DEFAULT_PREFS, bakeInstantStyle, buildInstantCss, controlsForGuideLevel, setProjectHeading } from './instantStyle';
import '../../ds/night.css';
import './Builder.css';
import { changeIdeasFor } from './changeIdeas';
import { loadPreviewStorage } from './previewStorage';
import CodePanel from './CodePanel';
import Icon from '../../components/Icon/Icon';
import { starterProjectById } from './starterProjects';
import { HOME_PICKS } from './starterGames';
import LiveFrame from '../Home/LiveFrame';
import '../Home/MemberHome.css';
import { changeInvitation } from './whatCanIChange';
import { VOICE_EVENT, speak, voiceState } from '../../utils/voice';
import { lookInside } from './lookInside';
import { closestStarter } from './closestStarter';
import { beatLink } from './scoreBridge';

import { EMPTY as EMPTY_SAFETY, rememberWorking, restore as restoreWorking } from './codeSafety';
import { initialTab, tabsFor } from './builderTabs';
import { liveUpdateScript, readSettings, setSetting } from './gameSettings';
import { conceptsIn } from './codeConcepts';
import { EMPTY as EMPTY_HISTORY, redo as historyRedo, remember as rememberEdit, undo as historyUndo } from './editHistory';
import {
  GUIDE_LEVELS,
  learnerGuideLevel,
  storeGuideLevelOverride,
  storedGuideLevelOverride,
} from '../../utils/guideLevel';
import { avatarSpriteDataUri } from '../../utils/avatarSprite';
import {
  makeBakeColorsIntoCode,
  makeEffect10,
  makeEffect11,
  makeEffect17,
  makeEffect18,
  makeEffect19,
  makeEffect24,
  makeEffect9,
  makeFetchServerVersions,
  makeHandleAiRefine,
  makeHandleApplyColors,
  makeRestoreVersion,
  makeToggleEditMode,
  makeTrackPersonalizationOnce,
} from './studioActions1';
import {
  makeApplyEdit,
  makeCallBuilder,
  makeClearEditor,
  makeHandleExplain,
  makeHandleLoadProject,
  makeHandlePublishSavedProject,
  makeHandleSaveProject,
  makeHandleSendToFriend,
  makeHandleShare,
  makeHandleShareSavedProject,
} from './studioActions2';
import {
  makeEffect32,
  makeHandlePublish,
} from './studioActions3';
import {
  FIRST_CHANGE_THEMES,
  PRESET_PALETTES,
  STARTER_TYPES,
  STUDIO_TOOLS,
  TOOL_MODIFIERS,
  WEBSITE_MODIFIERS,
  gameModifiersFor,
  getBuildSteps,
} from './studioKit1';
import {
  CONFETTI_COLORS,
  deriveProjectName,
  extractColors,
  preparePreview,
} from './studioKit2';
import {
  studioView1,
  studioView10,
  studioView11,
  studioView12,
  studioView2,
  studioView3,
  studioView4,
  studioView5,
  studioView6,
  studioView7,
  studioView8,
  studioView9,
} from './studioScreen1';
import {
  studioView13,
  studioView14,
  studioView15,
  studioView16,
  studioView17,
} from './studioScreen2';
import {
  studioView18,
  studioView19,
  studioView20,
  studioView21,
  studioView22,
  studioView23,
  studioView24,
  studioView25,
  studioView26,
  studioView27,
  studioView28,
} from './studioScreen3';
import {
  studioView29,
  studioView30,
  studioView31,
  studioView32,
  studioView33,
} from './studioScreen4';
export { gameModifiersFor, MISSIONS_ENABLED } from './studioKit1';

// ── The studio is in parts ───────────────────────────────────────────────────
//
// This file was one 330 KB module, and the build cannot cut a module in two, so
// the studio reached the browser as one 156 KB script. On 13 November 2026 a
// school's web filter was refusing every large script, and the studio was the
// one page of the site that could not be made to open there.
//
// So the long pieces were moved out, word for word, into the files beside this
// one: studioKit (constants and helpers from the top of this file),
// studioScreen (pieces of what Builder() draws) and studioActions (its long
// handlers and effects). Each moved piece is a function that is handed, as one
// object, the names it used here. Nothing was rewritten, no component was
// added and no state moved: Builder() still owns every hook.
//
// To change a piece, change it where it lives now. If it needs a name from
// Builder() that it is not handed yet, add the name to the object at the call
// here and to the first line of the function there.



export default function Builder() {
  const theme = useTheme();
  useSEO({
    canonical:   '/builder',
  });

  const { user, token } = useContext(AuthContext);
  const { awardXP, character, stats } = useCharacter();
  const navigate        = useNavigate();
  const location        = useLocation();
  const isNewAccountWelcome = Boolean(user)
    && new URLSearchParams(location.search || '').get('welcome') === '1';
  const [welcomeToast, setWelcomeToast] = useState(isNewAccountWelcome);
  useEffect(() => {
    if (!isNewAccountWelcome) return undefined;
    setWelcomeToast(true);
    const t = setTimeout(() => setWelcomeToast(false), 7000);
    return () => clearTimeout(t);
  }, [isNewAccountWelcome]);

  // A parent who clicked "Start building free" on the pricing page lands here,
  // in their child's tool — which is the honest demo, but the trail back to
  // the decision goes cold. One quiet, dismissible line bridges back. It only
  // exists for arrivals from pricing, so no child ever builds next to an ad.
  const [parentTrail, setParentTrail] = useState(() => {
    try {
      return new URLSearchParams(location.search || '').get('from') === 'pricing'
        && sessionStorage.getItem('codeit_parent_trail_dismissed') !== '1';
    } catch (_) { return false; }
  });

  useEffect(() => {
    if (!isNewAccountWelcome || !token) return;
    const accountKey = user?.id || user?.userId || 'account';
    const storageKey = `codeit_new_account_studio_${accountKey}`;
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, '1');
    void trackEvent('new_account_studio_view', null, token);
  }, [isNewAccountWelcome, token, user?.id, user?.userId]);

  // ── Every arrival at the studio, by any route ─────────────────────────────
  //
  // new_account_studio_view above fires only for ?welcome=1, and the two
  // studio doors fire only from a lesson or a quiz. Roughly forty links in
  // this app reach /builder and four of them said so. That left "of learners
  // who entered the studio, how many generated a project" with no honest
  // denominator, which is the first question anyone asks about this page.
  //
  // Once per mount rather than once per render, and it does not wait for a
  // token: a signed-out child in the studio is exactly the arrival we most
  // need to count.
  const studioViewSentRef = useRef(false);
  useEffect(() => {
    if (studioViewSentRef.current) return;
    studioViewSentRef.current = true;
    void trackEvent('studio_view', null, token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Build state ────────────────────────────────────────────────────────────
  const [prompt, setPrompt]             = useState('');

  // ── Two stuck moments, and one that must be left alone ──────────────────
  //
  // A timer cannot tell a child composing an idea from a child who has given
  // up: to a clock they look identical, and interrupting the first breaks the
  // thought at the moment it was arriving. So three states, help in two.
  //
  //   never started   nothing typed, nothing tapped, a few seconds passed.
  //                   They do not know what to type. Point at the games.
  //   abandoned       typed, deleted back to empty, and again. They have an
  //                   idea they cannot phrase; they need permission to keep it
  //                   short, not more choices.
  //   mid-thought     something is in the box. Leave them completely alone.
  const [stuck, setStuck] = useState(null); // 'never' | 'abandoned' | null
  const [moreChanges, setMoreChanges] = useState(false);
  const typedEverRef = useRef(false);
  const emptiedRef = useRef(0);
  const wasEmptyRef = useRef(true);
  const [builtPrompt, setBuiltPrompt]   = useState('');
  const [code, setCode]                 = useState('');
  const [builtSummary, setBuiltSummary] = useState('');
  // True when the server could not build the child's idea and served a canned
  // starter instead. Walked on 1 September 2026: three specific prompts, three
  // generic templates. A child who asked for a cat jumping over boxes was
  // handed "Click the stars before they disappear" under a heading made from
  // their own words. They know instantly that it did not listen, and no amount
  // of routing them to the studio survives that.
  const [isStarter, setIsStarter] = useState(false);
  // What the server says a third try would do differently, when both of its
  // own attempts failed: { escalates, moreTime }. The retry button reads it.
  const [starterRetry, setStarterRetry] = useState(null);

  // ── The link a child can send with no account ────────────────────────────
  //
  // Watched in a classroom: a nine-year-old typed forty words describing a
  // two-player fighting game and finished the sentence with "so i can play
  // with my friends". That is why they built it. There was no way to do it.
  //
  // Sharing needed an account, a save, a personalisation and a play, and then
  // a publish. Five gates between making a thing and handing it to someone.
  //
  // Unlisted projects were built for exactly this and shipped complete: the
  // route, the rate limit, the report flag, the tables created in production
  // on 1 September. Nothing in the browser had ever called them. This is the
  // call. No account, no email, no personal data, and the link is the only
  // credential.
  const [friendPath, setFriendPath] = useState(null);
  // The child's best score in the preview since this project was built: the
  // score their friend link challenges someone to beat.
  const [studioBest, setStudioBest] = useState(0);
  const friendLink = friendPath ? beatLink(friendPath, window.location.origin, studioBest, null) : null;
  const [friendStatus, setFriendStatus] = useState(null);
  const [aiTitle, setAiTitle]           = useState('');
  const [projectType, setProjectType]   = useState('website');
  const [conceptsUsed, setConceptsUsed] = useState([]);
  // Which lessons this child has finished, so the door into the lessons opens
  // somewhere they have not been. Signed out, this stays empty and the earliest
  // lesson is the right answer anyway. See lookInside.js.
  const [lessonsDone, setLessonsDone] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [buildStep, setBuildStep]       = useState(0);
  // What the server has written so far, when it streams: { chars, lines, tail, attempt }.
  const [buildProgress, setBuildProgress] = useState(null);
  const [error, setError]               = useState('');
  // The monthly free AI limit is not an error. A parent whose child has just
  // hit it is more willing to pay at that second than at any other point in
  // the product, and until today they were shown a red card that said "We
  // couldn't build that yet" with no button on it.
  const [limitReached, setLimitReached] = useState('');
  // Whether this account may be offered a plan, straight from the server.
  // Fail-closed: canSubscribe starts null and every test below is an
  // explicit true, so a child is never shown a price by an answer that has
  // not arrived.
  const [billing, setBilling] = useState(DEFAULT_BILLING_STATE);
  const couldBePayer = Boolean(user) && !user.managedProfile;
  const mayBuy = billing.canSubscribe === true && billing.billingEnabled;

  // Asked once per mount for any account that is not a managed profile. Silent
  // on failure: the state stays on the free plan, which offers nothing.
  useEffect(() => {
    if (!token || !couldBePayer) return undefined;
    let cancelled = false;
    fetchBillingStatus(token)
      .then((state) => { if (!cancelled) setBilling(state); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token, couldBePayer]);
  const [buildKey, setBuildKey]         = useState(0);
  const [hasPersonalized, setHasPersonalized] = useState(false);
  // Sent here by "See the code" under a game on /build (?shelf=…&tab=code): the
  // child was playing this game a moment ago. Telling them "Press Play. Try
  // every button." beside the code they asked for was the guide not listening
  // (20 November 2026), so the guide starts at the next step, changing a thing.
  const [hasPlayedOnce, setHasPlayedOnce] = useState(() => (
    initialTab(location.search) === 'learn' && Boolean(new URLSearchParams(location.search).get('shelf'))
  ));
  const [hasTestedLatest, setHasTestedLatest] = useState(false);
  // The message listener below is registered once, so it cannot read state.
  // These refs carry the two values it needs. playedReportedRef resets with
  // every new build, so 'project_played' is one event per project rather than
  // one per click.
  const playedReportedRef = useRef(false);
  const tokenRef = useRef(null);
  useEffect(() => { tokenRef.current = token; }, [token]);
  // Whether this project has been changed, readable from the once-registered
  // message listener. A game counts as finished only when it is played AFTER
  // a change; playing the untouched starter is a start, not a finish.
  const personalizedRef = useRef(false);
  useEffect(() => { personalizedRef.current = hasPersonalized; }, [hasPersonalized]);
  const [guestDraftRecovered, setGuestDraftRecovered] = useState(false);
  const [guideLevelOverride, setGuideLevelOverride] = useState(storedGuideLevelOverride);
  const [coachOpen, setCoachOpen] = useState(() => learnerGuideLevel(user) !== 'independent');

  // ── When the studio stops narrating ──────────────────────────────────────
  //
  // "Too much text and talking", from a 23-year-old who signed up to learn to
  // code. He is on the level called "Explore myself", which until now only
  // decided how many colour swatches he was offered: the mascot still reopened
  // after every build, the companion still appeared, and a celebration overlay
  // still covered his project for four seconds.
  //
  // Read at the top so every handler below agrees, and read live rather than
  // frozen, because a person can change the level while the page is open.
  const quietStudio = (guideLevelOverride || learnerGuideLevel(user)) === 'independent';
  const coachRestTimer = useRef(null);
  // Three-way (message 72): never asked, asked, muted. Shared with the
  // lesson guide and the quiz.
  const [voiceMode, setVoiceMode] = useState(() => voiceState());
  useEffect(() => {
    const sync = () => setVoiceMode(voiceState());
    window.addEventListener(VOICE_EVENT, sync);
    return () => window.removeEventListener(VOICE_EVENT, sync);
  }, []);

  // ── AI memory ──────────────────────────────────────────────────────────────
  const [promptHistory, setPromptHistory] = useState([]);
  const [previousCode, setPreviousCode]   = useState('');

  // Undo for edits made by hand. The AI-edit undo above keeps one snapshot;
  // this keeps a stack, because a child dragging things around makes many small
  // changes in a row and expects to be able to walk back through them.
  const [editHistory, setEditHistory] = useState(EMPTY_HISTORY);

  // Which page of the studio is showing. Karam, a real child using it, asked
  // for pages because sixteen panels stacked down one phone screen is a wall.
  const [workspaceTab, setWorkspaceTab] = useState(() => initialTab(location.search));
  // Arrived asking for the code (?tab=code): the code is brought onto the
  // screen once, when it first appears, and never again after that.
  const arriveAtCodeRef = useRef(initialTab(location.search) === 'learn');

  /** Is this panel on the page the child is looking at? */
  const onTab = (id) => workspaceTab === id;
  const codeRef = useRef('');

  // ── Play mode ──────────────────────────────────────────────────────────────
  const [isPlayMode, setIsPlayMode] = useState(false);

  // ── Loading preview ────────────────────────────────────────────────────────
  const [loadingPreviewType, setLoadingPreviewType] = useState('');

  // ── Edit-with-AI panel ─────────────────────────────────────────────────────
  const [showEditPanel, setShowEditPanel]     = useState(false);
  const [editInstruction, setEditInstruction] = useState('');
  const [editing, setEditing]                 = useState(false);
  const [editStep, setEditStep]               = useState(0);
  const [editError, setEditError]             = useState('');
  const [editRetrySeconds, setEditRetrySeconds] = useState(0);

  // ── Explain ────────────────────────────────────────────────────────────────
  const [explanation, setExplanation]   = useState('');
  const [explaining, setExplaining]     = useState(false);
  const [explainError, setExplainError] = useState('');

  // ── Save state ─────────────────────────────────────────────────────────────
  const [isSaved, setIsSaved]               = useState(false);
  const [saveStatus, setSaveStatus]         = useState(null);
  const [saveError, setSaveError]           = useState('');
  const [unsavedWarning, setUnsavedWarning] = useState(false);
  const [resumeAction, setResumeAction]     = useState(null);

  // ── Saved projects ─────────────────────────────────────────────────────────
  const [savedProjects, setSavedProjects]     = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectCardAction, setProjectCardAction] = useState({ id: null, status: null });

  const [projectOpeningId, setProjectOpeningId] = useState(null);
  const [projectOpenError, setProjectOpenError] = useState('');
  // ── Version history ────────────────────────────────────────────────────────
  const [localVersions, setLocalVersions]       = useState([]);   // in-session snapshots
  const [serverVersions, setServerVersions]     = useState([]);   // from DB
  const [showHistory, setShowHistory]           = useState(false);
  const [historyLoading, setHistoryLoading]     = useState(false);
  const [restoringVersion, setRestoringVersion] = useState(false);
  const [savedProjectId, setSavedProjectId]     = useState(null);
  // One paper burst on a kid's first-ever save (juice pass, once per browser).
  const [paperBurst, setPaperBurst] = useState(false);
  // Name on save (message 68). The first save asks the child what their
  // project is called: a short field, prefilled with a two or three word
  // suggestion, that they can change. Naming your own thing is worth doing
  // for ownership alone, and it is what fixes every Explore card at once.
  const [naming, setNaming] = useState(null); // { value } while the card is open
  const namingRef = useRef(null);
  // A child who already named it from the Change tab is not asked twice.
  const namedByChildRef = useRef(false);
  const [activeVersionId, setActiveVersionId]   = useState(null);

  const promptRef  = useRef(null);
  const editRef    = useRef(null);
  const iframeRef  = useRef(null);

  // Which project's saved data the preview should be given.
  //
  // A ref, not state, because it is read by the message handler below and
  // baked into the iframe's srcDoc — making it reactive would reload the frame
  // every time a game saved its score, resetting the game the instant a child
  // beat their record.
  // Once a child has a project, everything about *starting* one is in the way.
  // The studio used to keep the hero, the help-level chooser and the whole idea
  // form on screen after the project existed, which pushed the game itself
  // 1700px down a phone — far enough off-screen that the browser suspended its
  // animation frames and the game quietly stopped running.
  const [showStartOver, setShowStartOver] = useState(false);

  const shelfIdRef = useRef(null);
  // ?prompt=...&go=1 from /build: the child already pressed a button that
  // said "Write it for me", so the build starts without a second press.
  const autoBuildRef = useRef(null);
  const previewKeyRef = useRef('draft');

  // What the running project has complained about, and the last version of it
  // that ran without complaining.
  const [runErrors, setRunErrors] = useState([]);
  const [safety, setSafety] = useState(EMPTY_SAFETY);
  const settleTimer = useRef(null);
  const editModeOnRef = useRef(false);
  const studioRef  = useRef(null);
  const waitingRef = useRef(null);
  const resumeActionStartedRef = useRef(false);
  const queryProjectOpenedRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const personalizationTrackedRef = useRef(false);
  const skipNextGuestDraftPersistRef = useRef(false);

  // ── Live element editor ────────────────────────────────────────────────────
  const [editModeOn, setEditModeOn]     = useState(false);
  const [selectedEl, setSelectedEl]     = useState(null);
  const [showElPanel, setShowElPanel]   = useState(false);
  const [elPanelTab, setElPanelTab]     = useState('text');
  const [elText, setElText]             = useState('');
  const [elColor, setElColor]           = useState('');
  const [elBgColor, setElBgColor]       = useState('');
  const [elPadding, setElPadding]       = useState('0');
  const [elAnim, setElAnim]             = useState('');
  const [aiRefineText, setAiRefineText] = useState('');
  const [patchLoading, setPatchLoading] = useState(false);
  const [patchError, setPatchError]     = useState('');

  // ── Studio state ───────────────────────────────────────────────────────────
  const [studioPanel, setStudioPanel] = useState(null);
  const [deviceView, setDeviceView]   = useState('desktop');
  const [projectDesc, setProjectDesc] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [xpPopup, setXpPopup]         = useState(null);

  // Where a slider currently sits, before the change is written into the file.
  //
  // Kept separate from `code` on purpose. Rewriting the source on every pixel
  // of a drag would rebuild the iframe dozens of times a second and restart the
  // game under the child's finger. So the draft drives the control, the running
  // game is poked live, and the file is only rewritten when they let go.
  const [settingDrafts, setSettingDrafts] = useState({});

  // ── Instant color editing ──────────────────────────────────────────────────
  const [customBg, setCustomBg]           = useState('#FFF6ED');
  const [customPrimary, setCustomPrimary] = useState('#FF7A00');
  const [customAccent, setCustomAccent]   = useState('#A855F7');
  const [customText, setCustomText]       = useState('#38291F');

  // ── Instant customization (no AI, no network) ──────────────────────────────
  const [instantPrefs, setInstantPrefs] = useState(DEFAULT_PREFS);
  const [titleDraft, setTitleDraft]     = useState('');
  const [instantNotice, setInstantNotice] = useState('');

  // ── Creator missions ───────────────────────────────────────────────────────
  const [missions, setMissions]           = useState([]);
  const [missionActive, setMissionActive] = useState(null);

  // ── AI Companion ───────────────────────────────────────────────────────────
  const [companionTip, setCompanionTip]       = useState('');
  // The tip floats in the top right corner, and on a phone or a small laptop
  // that corner is where the project's own Size, Full screen and Play
  // buttons sit once the page scrolls (28 October, live: "Describe a change
  // when you want a bigger update" covered Play). It steps aside whenever it
  // would sit on the project's bar.
  const toastsRef = useRef(null);
  const [tipBlocked, setTipBlocked] = useState(false);
  const [companionVisible, setCompanionVisible] = useState(false);

  // ── Wow moment ─────────────────────────────────────────────────────────────
  const [showWow, setShowWow] = useState(false);
  const [wowType, setWowType] = useState('');
  const wowShownRef           = useRef(false);

  // ── Public sharing ────────────────────────────────────────────────────────
  const [isPublished, setIsPublished]     = useState(false);
  const [publicId, setPublicId]           = useState(null);
  const [publishStatus, setPublishStatus] = useState(null); // null | 'publishing' | 'copied' | 'error' | 'refused'
  // The moment itself. Publishing is the proudest second in the product —
  // a child's game just became a real link on the real internet — and it was
  // being celebrated with the word "copied" on a button for three seconds.
  const [justPublished, setJustPublished] = useState(false);
  // ── Why publishing did not happen ──────────────────────────────────────────
  //
  // The server already answers this properly. Under-13 profiles get "Projects
  // on a family profile stay private. Share it with your grown-up or teacher
  // instead." A free plan gets "Publishing to a public CodeIt link is part of
  // CodeIt Plus. Your project stays saved and private until then."
  //
  // Both were thrown away by `catch (_)`, and the child saw the Share button
  // read "Try again" for three seconds before going back to "Share". Trying
  // again cannot work — neither an age nor a plan changes by pressing a button
  // twice — so the one instruction on screen was the one thing guaranteed to
  // fail, and it looked like the site was broken. It was not. It just never
  // said the thing it already knew.
  const [publishRefusal, setPublishRefusal] = useState(null);

  // ── My projects — sort + favorites ───────────────────────────────────────
  const [projectSort, setProjectSort]   = useState('recent');
  const [shareStatus, setShareStatus]   = useState(null); // null | 'copied' | 'shared'
  const [favoriteIds, setFavoriteIds]   = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('codeit_fav_projects') || '[]')); }
    catch { return new Set(); }
  });

  // ── Tier one: inline, no dismiss, fades on its own ─────────────────────────
  //
  // Something should answer every action a child takes, and none of it should
  // be scheduled. This is the smallest tier: a few words near where the action
  // happened, gone in under three seconds.
  //
  // It used to say "+10 XP" for tuning a slider, "+15 XP" for a colour and
  // "+20 XP" for an effect, and the server paid none of that. Ten fake XP for
  // a click is exactly the thing our parent guide says other products do. The
  // words stay, because the acknowledgement is the point; the number appears
  // only when the server really banked it (saving, publishing).
  function popXp(amount, reason) {
    const id = Date.now();
    setXpPopup({ amount: Number(amount) > 0 ? Number(amount) : 0, reason: reason || null, id });
    setTimeout(() => setXpPopup(v => v?.id === id ? null : v), 2600);
  }

  function trackPersonalizationOnce(...args) { return makeTrackPersonalizationOnce({ personalizationTrackedRef, playedReportedRef, previewKeyRef, setHasPersonalized, setHasTestedLatest, setIsPlayMode, setIsStarter, shelfIdRef, token })(...args); }

  function handleTogglePlay() {
    setIsPlayMode(current => {
      const opening = !current;
      if (opening) {
        setHasPlayedOnce(true);
        setHasTestedLatest(true);
      }
      return opening;
    });
  }

  function changeGuideLevel(level) {
    if (!GUIDE_LEVELS.some(option => option.id === level)) return;
    storeGuideLevelOverride(level);
    setGuideLevelOverride(level);
    setCoachOpen(level !== 'independent');
  }

  function showCoachTarget() {
    const target = document.querySelector('[data-codeit-coach="current"]');
    target?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    target?.focus?.({ preventScroll: true });
  }

  // One voice for the site (utils/voice.js): a chosen voice at rate 1 and
  // pitch 1, recorded lines where they exist, and never a word before the
  // child has asked once.
  function readCoach(text) { void speak(text); }

  function applyColorsInstant(vars) {
    sendBridgeCmd('SET_ROOT_VARS', { vars });
  }

  function bakeColorsIntoCode(...args) { return makeBakeColorsIntoCode({ code })(...args); }

  // A palette paints the project's OWN colour settings when it has any
  // (every starter does: starColour, shipColour, snakeColour...), so the
  // change lands in the line a child can read and the game repaints. Only a
  // project with no colour settings gets the :root injection, which is the
  // route the generated projects read. Returns what it told the child, so a
  // caller does not overwrite the truth with "colours applied".
  function handleApplyColors(...args) { return makeHandleApplyColors({ aiTitle, bakeColorsIntoCode, code, commitInstantChange, promptHistory, pushLocalVersion, setCode, setInstantNotice, setIsSaved, setSaveStatus, trackPersonalizationOnce })(...args); }

  // ── Instant customization ──────────────────────────────────────────────────
  // Rewrites the project's own HTML in the browser. No AI call, so this keeps
  // working when generation is unavailable, and lands in well under a second.

  function commitInstantChange(nextCode, versionLabel, noticeText) {
    setCode(nextCode);
    setIsSaved(false);
    setSaveStatus(null);
    pushLocalVersion(versionLabel, nextCode, promptHistory, aiTitle);
    trackPersonalizationOnce();
    setInstantNotice(noticeText);
  }

  function applyInstantChange(change, versionLabel, noticeText) {
    if (!code) return;
    const merged = { ...instantPrefs, ...change };
    setInstantPrefs(merged);
    const nextCode = bakeInstantStyle(code, buildInstantCss(merged));
    if (nextCode === code) return;
    commitInstantChange(nextCode, versionLabel, noticeText);
    popXp(0, 'Made it yours');
  }

  /**
   * Open (or close) a studio tool, and bring what it opens into view.
   *
   * The scroll is not a flourish. On a 390x844 phone the Controls panel opens
   * roughly 1000px down the page — a child taps a button, the thing they asked
   * for appears entirely below the fold, and as far as they can tell nothing
   * happened. Measured, not guessed: the browser check found the slider at
   * y=1005 on a viewport 844 tall.
   */
  function openStudioTool(id) {
    // Every panel renders on the Change page; the tools are reachable from
    // pages where they are not.
    setWorkspaceTab('change');
    setStudioPanel(sp => (sp === id ? null : id));
    setTimeout(() => {
      studioRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  function openInstantPanel() {
    setStudioPanel('mine');
    // The panel is below the preview on phones; bring it into view so "Show me"
    // and the next-step coach point at something the student can actually see.
    setTimeout(() => {
      studioRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  function handleRenameProject() {
    const nextTitle = titleDraft.trim();
    if (!code || !nextTitle) return;
    const nextCode = setProjectHeading(code, nextTitle);
    setAiTitle(nextTitle);
    namedByChildRef.current = true;
    if (nextCode === code) return;
    commitInstantChange(nextCode, `Renamed: ${nextTitle.slice(0, 40)}`, `Your project is now called "${nextTitle}".`);
    popXp(0, 'Named it');
  }


  // ── Changing a setting: live while dragging, written down on release ──────
  //
  // Both halves matter. The live poke is what makes it feel like a toy rather
  // than a form — the stars speed up under your finger. The rewrite is what
  // makes it real: it changes the same line the child will read in the code
  // tab and be asked about in Prove It.
  //
  // No network call, no model, no waiting. This used to be an AI round-trip.
  function previewSetting(setting, value) {
    setSettingDrafts(d => ({ ...d, [setting.name]: value }));
    const js = liveUpdateScript(setting.name, value, setting.type, setting.quote);
    if (js) sendBridgeCmd('RUN_SCRIPT', { js });
  }

  function commitSetting(setting, value) {
    const nextCode = setSetting(code, setting.name, value);
    setSettingDrafts(d => {
      const next = { ...d };
      delete next[setting.name];
      return next;
    });
    // setSetting returns the original string when it could not write safely, so
    // this is also the "nothing actually changed" check.
    if (nextCode === code) return;
    commitInstantChange(
      nextCode,
      `${setting.label}: ${value}`,
      `${setting.label} is now ${value}. Your game restarted so you can see it.`
    );
    popXp(0, 'Tuned it');
  }

  function resetSetting(setting) {
    previewSetting(setting, setting.value);
    setSettingDrafts(d => {
      const next = { ...d };
      delete next[setting.name];
      return next;
    });
  }

  // Run a mission: applyEdit + mission XP
  async function handleMissionClick(mission) {
    if (editing || missionActive) return;
    setMissionActive(mission);
    try {
      await applyEdit(
        `MISSION UPGRADE: ${mission}. ` +
        `Implement this fully. Add real working JavaScript logic, not a placeholder. ` +
        `Preserve all existing gameplay, scoring, and visual style exactly. ` +
        `The new feature must integrate seamlessly with the current code.`
      );
      setTimeout(() => popXp(0, 'Upgrade done'), 350);
    } finally {
      setMissionActive(null);
    }
  }

  // ── Version history functions ──────────────────────────────────────────────
  function pushLocalVersion(label, htmlCode, historyArr, titleStr) {
    if (!htmlCode) return;
    const { primary, accent } = extractColors(htmlCode);
    const id = `local-${Date.now()}`;
    setLocalVersions(prev => [{
      id, label,
      title:         titleStr || '',
      code:          htmlCode,
      promptHistory: [...(historyArr || [])],
      primary, accent,
      createdAt:     new Date().toISOString(),
      isLocal:       true,
    }, ...prev].slice(0, 20));
    setActiveVersionId(id);
  }

  function fetchServerVersions(...args) { return makeFetchServerVersions({ setHistoryLoading, setServerVersions, token })(...args); }

  async function saveVersionToServer(label) {
    if (!savedProjectId || !token || !code) return;
    const title = aiTitle || deriveProjectName(builtPrompt || '') || 'Untitled';
    try {
      await fetch(`${API_BASE_URL}/api/builder/projects/${savedProjectId}/versions`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ generated_code: code, title, label: label || 'Manual save', prompt_history: promptHistory }),
      });
      await fetchServerVersions(savedProjectId);
    } catch (_) {}
  }

  function restoreVersion(...args) { return makeRestoreVersion({ restoringVersion, savedProjectId, setActiveVersionId, setAiTitle, setCode, setIsSaved, setLocalVersions, setPromptHistory, setRestoringVersion, setSaveStatus, setShowHistory, token })(...args); }

  async function handleForkProject() {
    if (!savedProjectId || !token) return;
    try {
      const res  = await fetch(`${API_BASE_URL}/api/builder/projects/${savedProjectId}/fork`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSavedProjects(prev => [data.project, ...prev]);
    } catch (_) {}
  }

  // ── Prefill prompt from ?prompt= URL param (sent by lesson "Use in AI Builder") ─
  // ── Which lessons this child has already finished ──────────────────────────
  //
  // Read once, and only to decide which lesson to offer when they look inside
  // their own code. Nothing on this page waits for it: signed out, or if the
  // request fails, the list stays empty and the door opens on the earliest
  // lesson in their project, which is the right answer for someone who has done
  // none of them.
  useEffect(() => {
    if (!token) { setLessonsDone([]); return undefined; }
    let live = true;
    fetch(`${API_BASE_URL}/api/lessons/progress`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (live && data) setLessonsDone((data.completedLessons || []).map(Number)); })
      .catch(() => { /* the earliest lesson is a fine answer */ });
    return () => { live = false; };
  }, [token]);

  useEffect((...args) => makeEffect9({ autoBuildRef, location, personalizationTrackedRef, setAiTitle, setBuildKey, setBuiltPrompt, setCode, setIsSaved, setProjectType, setPrompt, setPromptHistory, setSavedProjectId, setShowEditPanel, shelfIdRef, token })(...args), []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Restore an account-handoff draft or a fresh device-only guest backup ───
  useEffect((...args) => makeEffect10({ location, navigate, personalizationTrackedRef, setAiTitle, setBuildKey, setBuiltPrompt, setBuiltSummary, setCode, setConceptsUsed, setGuestDraftRecovered, setHasPersonalized, setHasPlayedOnce, setHasTestedLatest, setProjectType, setPrompt, setPromptHistory, setResumeAction, skipNextGuestDraftPersistRef, user })(...args), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep unsaved guest work on this device for seven days. Nothing is uploaded
  // until the creator explicitly continues into an account-backed save.
  useEffect((...args) => makeEffect11({ aiTitle, builtPrompt, builtSummary, code, conceptsUsed, hasPersonalized, hasPlayedOnce, hasTestedLatest, isSaved, projectType, prompt, promptHistory, shelfIdRef, skipNextGuestDraftPersistRef, user })(...args), [aiTitle, builtPrompt, builtSummary, code, conceptsUsed, hasPersonalized, hasPlayedOnce, hasTestedLatest, isSaved, projectType, prompt, promptHistory, user]);

  // ── Confetti (only on fresh builds, not edits) ─────────────────────────────
  const confettiParticles = useMemo(() => {
    if (buildKey === 0) return [];
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      angle: i * 20 + (i % 2 === 0 ? 7 : -7),
      dist:  48 + (i % 5) * 10,
      color: CONFETTI_COLORS[i % 5],
      delay: (i % 4) * 0.05,
      isCircle: i % 3 === 0,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildKey]);

  // The badges this computed — "Playable project", "Game controls ready",
  // "Buttons work" — were removed with the row that displayed them. They read
  // the child's code to tell the child something the child can see by looking
  // at it, and they cost thirty-one pixels above the game.

  // ── Loading step advancement ───────────────────────────────────────────────
  useEffect(() => {
    if (!loading) { setBuildStep(0); return; }
    setBuildStep(0);
    // Spread over the first minute, which is how long a whole project takes
    // to write. These finished in three seconds and then sat on the last
    // step for two minutes, which is a progress bar that lies.
    const timers = [5000, 18000, 40000].map((delay, i) =>
      setTimeout(() => setBuildStep(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  // How long this build has been going, so a long wait is said out loud.
  const [waitedSeconds, setWaitedSeconds] = useState(0);
  useEffect(() => {
    if (!loading) { setWaitedSeconds(0); return undefined; }
    const started = Date.now();
    const id = setInterval(() => setWaitedSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    if (!editing) { setEditStep(0); return; }
    setEditStep(0);
    const timers = [700, 1600, 2600].map((delay, i) =>
      setTimeout(() => setEditStep(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [editing]);

  useEffect(() => {
    if (editRetrySeconds <= 0) return undefined;
    const timer = setTimeout(() => {
      setEditRetrySeconds(seconds => Math.max(0, seconds - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [editRetrySeconds]);

  // ── Auto-focus edit textarea when panel opens ──────────────────────────────
  useEffect(() => {
    if (showEditPanel) editRef.current?.focus();
  }, [showEditPanel]);

  // ── Extract current CSS colors when Colors panel opens ────────────────────
  useEffect((...args) => makeEffect17({ code, setCustomAccent, setCustomBg, setCustomPrimary, setCustomText, setInstantNotice, setInstantPrefs, setTitleDraft, studioPanel })(...args), [studioPanel]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Companion tip rotation ─────────────────────────────────────────────────
  useEffect((...args) => makeEffect18({ companionVisible, projectType, setCompanionTip })(...args), [companionVisible, projectType]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect((...args) => makeEffect19({ companionTip, companionVisible, setTipBlocked, toastsRef })(...args), [companionVisible, companionTip, code]);

  // ── Load saved projects when user logs in ──────────────────────────────────
  useEffect(() => {
    if (!user || !token) { setSavedProjects([]); return; }
    setProjectsLoading(true);
    fetch(`${API_BASE_URL}/api/builder/projects`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setSavedProjects(d.projects); })
      .catch(() => {})
      .finally(() => setProjectsLoading(false));
  }, [user, token]);

  useEffect(() => {
    if (projectsLoading) return undefined;
    if (new URLSearchParams(location.search).get('view') !== 'projects') return undefined;
    const timer = setTimeout(() => {
      document.getElementById('my-creations')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
    return () => clearTimeout(timer);
  }, [location.search, projectsLoading, savedProjects.length]);

  useEffect(() => { codeRef.current = code; }, [code]);

  // ── The run loop ───────────────────────────────────────────────────────────
  //
  // Every time the code changes the iframe reloads, so the errors from the old
  // version are no longer about anything. Clear them, then wait: if nothing has
  // thrown by the time the settle window closes, this version ran clean and
  // becomes the one the child can always get back to.
  //
  // The wait matters. Marking code good the moment it is handed to the frame
  // would happily save a version that throws on its first line.
  const SETTLE_MS = 1200;
  // Whether the version BEFORE this one threw. If it did and this one settles
  // clean, the child fixed something, and nothing else in the studio tells
  // them they did something hard.
  const hadErrorsRef = useRef(false);
  useEffect(() => {
    if (!code) return undefined;
    setRunErrors(prev => { hadErrorsRef.current = prev.length > 0; return []; });
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      setSafety(prev => rememberWorking(prev, codeRef.current));
      if (hadErrorsRef.current) {
        hadErrorsRef.current = false;
        popXp(0, 'You just debugged that.');
      }
    }, SETTLE_MS);
    return () => clearTimeout(settleTimer.current);
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Put the project back to the last version that actually ran. */
  const restoreLastWorking = () => {
    const good = restoreWorking(safety, codeRef.current);
    if (!good) return;
    setEditHistory(prev => rememberEdit(prev, codeRef.current, 'Went back to a working version'));
    setCode(good);
    setIsSaved(false);
    setSaveStatus(null);
    setRunErrors([]);
  };

  /** Record the page as it is now, so the next hand edit can be undone. */
  const recordHandEdit = (label) => {
    setEditHistory(prev => rememberEdit(prev, codeRef.current, label));
  };

  const undoHandEdit = () => {
    const result = historyUndo(editHistory, codeRef.current);
    if (result.html === null) return;
    setEditHistory(result.history);
    setCode(result.html);
    setIsSaved(false);
    setSaveStatus(null);
  };

  const redoHandEdit = () => {
    const result = historyRedo(editHistory, codeRef.current);
    if (result.html === null) return;
    setEditHistory(result.history);
    setCode(result.html);
    setIsSaved(false);
    setSaveStatus(null);
  };

  /** One selected element, one verb. Each is undoable like any other edit. */
  const elementAction = (cmd, label, payload = {}) => {
    if (!selectedEl) return;
    recordHandEdit(label);
    sendBridgeCmd(cmd, { id: selectedEl.id, ...payload });
    if (cmd === 'DELETE') { setShowElPanel(false); setSelectedEl(null); }
    trackPersonalizationOnce();
  };

  // ── Live element editor — postMessage bridge ───────────────────────────────
  useEffect((...args) => makeEffect24({ codeRef, editModeOnRef, iframeRef, personalizedRef, playedReportedRef, popXp, previewKeyRef, sendBridgeCmd, setCode, setEditHistory, setElAnim, setElBgColor, setElColor, setElPadding, setElPanelTab, setElText, setHasPlayedOnce, setHasTestedLatest, setIsSaved, setPatchError, setRunErrors, setSafety, setSaveStatus, setSelectedEl, setShowElPanel, setStudioBest, settleTimer, tokenRef, trackPersonalizationOnce })(...args), []); // eslint-disable-line react-hooks/exhaustive-deps

  function sendBridgeCmd(cmd, payload = {}) {
    iframeRef.current?.contentWindow?.postMessage({ type: 'CODEIT_CMD', cmd, payload }, '*');
  }

  function toggleEditMode(...args) { return makeToggleEditMode({ editModeOn, editModeOnRef, sendBridgeCmd, setEditModeOn, setPatchError, setSelectedEl, setShowEditPanel, setShowElPanel, setShowHistory, setWorkspaceTab })(...args); }

  function applyElTextChange() {
    if (!selectedEl) return;
    recordHandEdit('Changed the words');
    sendBridgeCmd('SET_TEXT', { id: selectedEl.id, v: elText });
    trackPersonalizationOnce();
  }

  function applyElStyleChange(styles) {
    if (!selectedEl) return;
    recordHandEdit('Changed how it looks');
    sendBridgeCmd('SET_STYLE', { id: selectedEl.id, styles });
    trackPersonalizationOnce();
  }

  function handleAiRefine(...args) { return makeHandleAiRefine({ aiRefineText, selectedEl, sendBridgeCmd, setAiRefineText, setPatchError, setPatchLoading, trackPersonalizationOnce })(...args); }

  // ── Fresh build ────────────────────────────────────────────────────────────
  const callBuilder = (...args) => makeCallBuilder({ namedByChildRef, personalizationTrackedRef, playedReportedRef, pushLocalVersion, quietStudio, setAiTitle, setBuildKey, setBuildProgress, setBuiltPrompt, setBuiltSummary, setCoachOpen, setCode, setCompanionVisible, setConceptsUsed, setEditError, setEditHistory, setError, setExplanation, setGuestDraftRecovered, setHasPersonalized, setHasPlayedOnce, setHasTestedLatest, setIsPlayMode, setIsSaved, setIsStarter, setLimitReached, setLoading, setLoadingPreviewType, setMissions, setPreviousCode, setProjectType, setPromptHistory, setSaveStatus, setShowEditPanel, setShowWow, setStarterRetry, setStudioBest, setUnsavedWarning, setWorkspaceTab, setWowType, token, waitingRef, wowShownRef })(...args);

  // Started once. The go is taken out of the address first, so a refresh or
  // a back button does not spend a second build on the same sentence.
  useEffect(() => {
    const pending = autoBuildRef.current;
    if (!pending) return;
    autoBuildRef.current = null;
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('go');
      url.searchParams.delete('scratch');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    } catch { /* the build still starts */ }
    callBuilder(pending.text, { scratch: pending.scratch });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Edit with AI — modifies existing code, never starts from scratch ───────
  const applyEdit = (...args) => makeApplyEdit({ aiTitle, builtSummary, code, editRetrySeconds, editing, projectName, promptHistory, pushLocalVersion, setBuiltSummary, setCode, setEditError, setEditInstruction, setEditRetrySeconds, setEditing, setIsSaved, setPreviousCode, setPromptHistory, setSaveStatus, token, trackPersonalizationOnce })(...args);

  const handleUndoEdit = () => {
    if (!previousCode) return;
    setCode(previousCode);
    setPreviousCode('');
    setPromptHistory(prev => prev.slice(0, -1));
    setBuiltSummary('');
    setIsSaved(false);
    setSaveStatus(null);
    setEditError('');
  };

  // ── Modifiers: use edit endpoint when code exists (incremental) ───────────
  const handleModifier = (mod) => {
    if (code) {
      applyEdit(mod);
    } else {
      const updated = `${prompt.trim()}. ${mod}`;
      setPrompt(updated);
      callBuilder(updated);
    }
  };

  useEffect(() => {
    const empty = !prompt.trim();
    if (!empty) typedEverRef.current = true;
    if (!empty && wasEmptyRef.current) wasEmptyRef.current = false;
    else if (empty && !wasEmptyRef.current && typedEverRef.current) {
      wasEmptyRef.current = true;
      emptiedRef.current += 1;
      if (emptiedRef.current >= 2) setStuck('abandoned');
    }
    if (!empty && stuck) setStuck(null);
  }, [prompt, stuck]);

  useEffect(() => {
    if (code || loading) return undefined;
    const timer = setTimeout(() => {
      if (!typedEverRef.current && !prompt.trim() && !code) setStuck('never');
    }, 8000);
    return () => clearTimeout(timer);
  }, [code, loading, prompt]);

  const handleBuild = () => {
    if (!prompt.trim()) return;
    callBuilder(prompt.trim());
  };

  const handleQuickStart = (qs) => {
    setPrompt(qs.prompt);
    callBuilder(qs.prompt);
  };

  // ── Opening a starter, which is not the same as asking for one ─────────────
  //
  // The chips above send a sentence to the model and wait ten to twenty
  // seconds. These are already written, so the project is on screen before the
  // finger has left the card. That gap is the difference between a child who
  // believes something is happening and one who thinks it is broken.
  const openStarter = (project) => {
    if (!project) return;
    setPrompt(project.prompt);
    setBuiltPrompt(project.prompt);
    setProjectType(STARTER_TYPES[project.kind] || 'website');
    setAiTitle(project.label);
    setCode(project.code);
    setPromptHistory([project.prompt]);
    setBuildKey(k => k + 1);
    setShowStartOver(false);
    void trackEvent('builder_starter_open', project.id);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleBuild();
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) applyEdit(editInstruction);
  };

  const handleFullscreen = () => {
    if (!code) return;
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  };

  // ── Explain ────────────────────────────────────────────────────────────────
  const handleExplain = (...args) => makeHandleExplain({ code, setExplainError, setExplaining, setExplanation })(...args);

  const continueAfterAuth = (action) => {
    try {
      sessionStorage.setItem('codeit_builder_draft', JSON.stringify({
        code, prompt, builtPrompt, projectType, aiTitle,
        builtSummary, conceptsUsed, promptHistory, hasPersonalized,
        hasPlayedOnce, hasTestedLatest, savedAt: Date.now(),
      }));
    } catch (_) {}
    void trackEvent('activation_account_gate', action, token);
    navigate(`/register?from=builder&action=${action}`, {
      state: { from: '/builder', resumeBuilderAction: action },
    });
  };

  // ── Save project ───────────────────────────────────────────────────────────
  const handleSaveProject = (...args) => makeHandleSaveProject({ awardXP, builtPrompt, code, continueAfterAuth, hasTestedLatest, isPersonalized, namedByChildRef, namingRef, popXp, projectName, projectType, promptHistory, saveInFlightRef, savedProjectId, savedProjects, setAiTitle, setIsSaved, setNaming, setPaperBurst, setSaveError, setSaveStatus, setSavedProjectId, setSavedProjects, token, user })(...args);

  // The save action is also a child-friendly next-step button.  A first draft
  // must be personalised and tested, but the button should never feel broken.
  const handleSaveOrGuide = () => {
    if (!isPersonalized) {
      setShowEditPanel(true);
      setTimeout(() => editRef.current?.focus(), 0);
      return;
    }
    if (!hasTestedLatest) {
      handleTogglePlay();
      return;
    }
    handleSaveProject();
  };

  // ── Load saved project ─────────────────────────────────────────────────────
  const handleLoadProject = (...args) => makeHandleLoadProject({ fetchServerVersions, personalizationTrackedRef, setActiveVersionId, setAiTitle, setBuildKey, setBuiltPrompt, setBuiltSummary, setCode, setEditError, setEditHistory, setExplanation, setHasPersonalized, setHasPlayedOnce, setHasTestedLatest, setIsPublished, setIsSaved, setLocalVersions, setPreviousCode, setProjectOpenError, setProjectOpeningId, setPrompt, setPromptHistory, setPublicId, setPublishStatus, setSaveStatus, setSavedProjectId, setServerVersions, setShowEditPanel, setUnsavedWarning, setWorkspaceTab, token })(...args);

  // A returning student can resume the exact project offered on the homepage.
  // The project still comes from the authenticated list, so changing the URL
  // cannot open another learner's work.
  useEffect(() => {
    if (projectsLoading || queryProjectOpenedRef.current) return;
    const requestedId = new URLSearchParams(location.search).get('project');
    if (!requestedId) return;
    const project = savedProjects.find(item => String(item.id) === requestedId);
    if (!project) return;
    queryProjectOpenedRef.current = true;
    void handleLoadProject(project);
  }, [location.search, projectsLoading, savedProjects]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Delete saved project ───────────────────────────────────────────────────
  const handleDeleteProject = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/builder/projects/${id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedProjects(prev => prev.filter(p => p.id !== id));
    } catch {}
  };

  // ── Publish and share from My projects ───────────────────────────────────
  // Returning creators should not have to reopen a saved project and hunt for
  // its publishing controls. The server still enforces the under-13 privacy
  // rule; managed learner profiles never receive a public action here.
  const handlePublishSavedProject = (...args) => makeHandlePublishSavedProject({ awardXP, popXp, projectCardAction, savedProjectId, setIsPublished, setJustPublished, setProjectCardAction, setPublicId, setSavedProjects, token, user })(...args);

  const handleShareSavedProject = (...args) => makeHandleShareSavedProject({ projectCardAction, setProjectCardAction, token })(...args);

  // ── New project ──────────────────────────────────────────────────────────────
  const handleNewBuild = () => {
    if (code && !isSaved) { setUnsavedWarning(true); return; }
    clearEditor();
  };

  const clearEditor = (...args) => makeClearEditor({ personalizationTrackedRef, playedReportedRef, promptRef, setActiveVersionId, setAiRefineText, setAiTitle, setBuiltPrompt, setBuiltSummary, setCode, setCompanionTip, setCompanionVisible, setConceptsUsed, setDeviceView, setEditError, setEditHistory, setEditInstruction, setEditModeOn, setEditingDesc, setError, setExplanation, setGuestDraftRecovered, setHasPersonalized, setHasPlayedOnce, setHasTestedLatest, setIsPlayMode, setIsPublished, setIsSaved, setIsStarter, setLoadingPreviewType, setLocalVersions, setMissionActive, setMissions, setPatchError, setPreviousCode, setProjectDesc, setProjectType, setPrompt, setPromptHistory, setPublicId, setPublishStatus, setRestoringVersion, setSaveStatus, setSavedProjectId, setSelectedEl, setServerVersions, setSettingDrafts, setShowEditPanel, setShowElPanel, setShowHistory, setShowWow, setStudioPanel, setUnsavedWarning, setWorkspaceTab })(...args);

  const handleSendToFriend = (...args) => makeHandleSendToFriend({ code, friendStatus, projectName, projectType, setFriendPath, setFriendStatus, studioBest, token })(...args);

  // One button under the game: a published game shares its page, anything
  // else gets (or reuses) its private friend link. Either way the link carries
  // the score to beat, and a link already made is copied again, not remade.
  const [challengeCopied, setChallengeCopied] = useState(false);
  useEffect(() => { setChallengeCopied(false); }, [studioBest]);
  const challengeFriend = async () => {
    if (isPublished && publicId) { await handleShare(); setChallengeCopied(true); return; }
    if (friendLink) {
      try { await navigator.clipboard.writeText(friendLink); } catch (_) {}
      void trackEvent('score_challenge', 'sent');
      setChallengeCopied(true);
      return;
    }
    await handleSendToFriend();
    setChallengeCopied(true);
  };

  // ── Share project ──────────────────────────────────────────────────────────
  const handleShare = (...args) => makeHandleShare({ projectName, publicId, setShareStatus, studioBest, token })(...args);

  // ── Publish project ────────────────────────────────────────────────────────
  const handlePublish = (...args) => makeHandlePublish({ awardXP, builtPrompt, code, continueAfterAuth, hasTestedLatest, isPersonalized, popXp, projectName, projectType, savedProjectId, setError, setIsPublished, setIsSaved, setJustPublished, setPublicId, setPublishRefusal, setPublishStatus, setSavedProjectId, setSavedProjects, setShowEditPanel, token, user })(...args);

  // Complete the exact action that brought a guest to authentication after
  // their fresh draft has been restored into the builder.
  useEffect(() => {
    if (!resumeAction || !user || !token || !code || resumeActionStartedRef.current) return;
    resumeActionStartedRef.current = true;
    const action = resumeAction;
    setResumeAction(null);
    if (action === 'publish') handlePublish();
    else handleSaveProject({ skipNaming: true });
  }, [resumeAction, user, token, code]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyPublicLink = async () => {
    if (!publicId) return;
    const url = `https://codeitlearn.com/project/${publicId}?utm_source=project-share`;
    let copied = false;
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
    } catch (_) {}

    if (copied) {
      void trackEvent('project_share', 'creator', token);
      setPublishStatus('copied');
    } else {
      setPublishStatus('error');
    }
    setTimeout(() => setPublishStatus(null), 2000);
  };

  const handleUnpublish = async () => {
    if (!savedProjectId || !token) return;
    try {
      await fetch(`${API_BASE_URL}/api/builder/projects/${savedProjectId}/unpublish`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsPublished(false);
    } catch (_) {}
  };

  // ── Favorite toggle ────────────────────────────────────────────────────────
  const toggleFavorite = (id) => {
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('codeit_fav_projects', JSON.stringify([...next]));
      return next;
    });
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const hasResult   = !loading && code;
  const hasError    = !loading && error;
  const hasLimit    = !loading && Boolean(limitReached);

  // The offer is counted when it is on the screen, which is the only claim
  // upgrade_prompt_shown can honestly make. It used to be recorded the moment
  // the 402 came back, under a different condition than the card itself, so
  // the number answered "how many refusals happened to an account we had
  // already classified" rather than "how many people were asked".
  const limitOfferShownRef = useRef(false);
  useEffect(() => {
    if (!hasLimit || !mayBuy || limitOfferShownRef.current) return;
    limitOfferShownRef.current = true;
    void trackEvent('upgrade_prompt_shown', 'build-limit', token);
  }, [hasLimit, mayBuy, token]);
  const earnsProjectXp = String(user?.role || '').toLowerCase() === 'student';
  const activeBuildSteps = getBuildSteps(loadingPreviewType);
  const loadingTitle = loadingPreviewType === 'quiz' ? 'Building your quiz...'
    : loadingPreviewType === 'game' ? 'Building your game...'
    : loadingPreviewType === 'tool' ? 'Building your tool...'
    : 'Building your project...';
  const projectName = aiTitle || (builtPrompt ? deriveProjectName(builtPrompt) : '');
  const editCount   = promptHistory.length > 1 ? promptHistory.length - 1 : 0;
  const isPersonalized = hasPersonalized || editCount > 0;
  const saveActionLabel = isSaved
    ? 'Saved to My projects'
    : !isPersonalized
      ? 'First: change one thing'
      : !hasTestedLatest
        ? 'Next: test my changes'
        : 'Save project';
  const guideLevel = guideLevelOverride || learnerGuideLevel(user);
  // Same panel for everyone, sized to the learner: ages 5–7 get three big
  // picture choices, teenagers get the full set.
  const instantControls = controlsForGuideLevel(guideLevel);

  // The four pages, and what each one has to say right now.
  const workspaceTabs = tabsFor({
    hasPlayed: hasPlayedOnce,
    hasChanged: isPersonalized,
    hasTested: hasTestedLatest,
    isSaved,
  });
  const activeTab = workspaceTabs.find(tab => tab.id === workspaceTab) || workspaceTabs[0];

  // ── The answer to "what can I edit" ────────────────────────────────────────
  //
  // Children asked it out loud. Nothing on the screen answered it: reaching the
  // editor took two steps and the button said "Edit elements", which is a word
  // a seven-year-old has no use for.
  //
  // A general sentence would not have helped. "You can change anything!" is
  // what a screen says when it has nothing specific to offer. This reads their
  // own file and names one real thing they are looking at — and stays quiet on
  // a canvas game, where the only things it could point at are painted rather
  // than written.
  const changeHint = code ? changeInvitation(code) : null;

  // ── Something real to play for the ten to twenty seconds ───────────────────
  //
  // The wait used to show a progress bar first and, underneath it, one of five
  // generic demo templates — click the star, or three questions about oceans.
  // Twenty finished projects sit in this same folder, opened in a real browser
  // at two sizes on every build, and none of them was ever offered here.
  //
  // A child who types "a space game where you dodge rocks" now flies the
  // asteroid game within a second while their own version is written.
  const waitingGame = useMemo(
    () => (loading ? closestStarter(builtPrompt || prompt) : null),
    [loading, builtPrompt, prompt]
  );

  // Concrete things to change in THIS project, for the child who asked what
  // "change one thing" means.
  const allIdeas = code ? changeIdeasFor(code) : [];
  // The rung on offer, if any, so the ideas strip does not repeat it. The
  // "change a number" rung and the "number-<name>" idea are the same change.
  const [ladderOffer, setLadderOffer] = useState(null);
  const ideasForThisProject = ladderOffer
    ? allIdeas.filter(idea => !(
        (ladderOffer.id === 'change-a-number' && (idea.id === `number-${ladderOffer.variable}` || idea.id === 'speed'))
        || (ladderOffer.id === 'rename-the-title' && idea.id === 'title')
      ))
    : allIdeas;
  const mineThemes = guideLevel === 'early' ? FIRST_CHANGE_THEMES : PRESET_PALETTES;
  const coachStage = !code
    ? prompt.trim()
      ? { number: 2, icon: 'play', title: 'Press “Build my project”', detail: 'The big orange button makes your idea.', target: 'build' }
      // Step 1 used to read "Press Game, Website, or Quiz", which points at the
      // buttons that send an idea to the model and then show a blank screen for
      // ten to twenty seconds. That is the slowest path in the product, and it
      // was what the guide told every arriving child to do first.
      //
      // The twenty starters open instantly. A child who taps one is playing
      // something of their own inside a second and has a real project to change,
      // which is the whole loop — and they can type their own idea straight
      // after, having seen what "a project" even means here.
      : { number: 1, icon: 'hand', title: 'Tap a game to open it', detail: 'It opens straight away. Or type your own idea below.', target: 'pick' }
    : !hasPlayedOnce
      ? { number: 2, icon: 'play', title: 'Press Play', detail: 'Try every button. See what works.', target: 'play' }
      : !isPersonalized
        ? { number: 3, icon: 'palette', title: 'Change one thing', detail: 'Pick new colours or add a fun idea.', target: 'change' }
        : !hasTestedLatest
          ? { number: 4, icon: 'flask', title: 'Play it again', detail: 'Make sure your new change works.', target: 'play' }
          : !isSaved
            ? { number: 5, icon: 'save', title: 'Save your project', detail: 'Keep your work so it is here next time.', target: 'save' }
            : user?.managedProfile
              ? { number: 6, icon: 'wave', title: 'Show your grown-up or teacher', detail: 'Your project is ready for a safe review.', target: 'learn' }
              : !isPublished
                ? { number: 6, icon: 'star', title: 'Publish when you are proud', detail: 'Your project is tested, saved, and ready to share.', target: 'publish' }
                : { number: 7, icon: 'party', title: 'Invite someone to play', detail: 'Share your finished project and ask what they think.', target: 'share' };
  // ── A guide who says the step, then goes quiet ─────────────────────────────
  //
  // A screenshot caught Pixel's bubble sitting squarely on top of a quiz's
  // answer buttons while the child had not even pressed Play yet. A guide who
  // talks over the game is a guide a child learns to ignore — or worse, one
  // they cannot get past.
  //
  // So he behaves like a person: when the step changes he speaks, and after a
  // few seconds he rests to his corner; tap him and he says it again. Early
  // learners keep him talking until they put him away themselves — the level
  // that needs big help should never have help disappear on a timer.
  const coachStageNumber = coachStage.number;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect((...args) => makeEffect32({ coachRestTimer, coachStage, guideLevelOverride, readCoach, setCoachOpen, user, voiceMode })(...args), [coachStageNumber, voiceMode]);

  // ── What actually goes into the preview frame ──────────────────────────────
  //
  // Scoped per project, so two games do not fight over one high score, and so a
  // child's saved progress follows the project rather than the browser tab.
  const previewKey = savedProjectId ? `p${savedProjectId}` : publicId ? `x${publicId}` : 'draft';
  previewKeyRef.current = previewKey;
  // Seeded at the moment the frame is built, not in an effect: effects run
  // after the iframe already has its srcDoc, and by then the game has read its
  // high score and found nothing. Re-read on every rebuild so an edit does not
  // roll a child's score back to whatever it was when they opened the page.
  // The kid's avatar, as a sprite, handed to every preview. Changing your
  // outfit in the lab changes the player in every game you open, because the
  // sprite is injected at run time, never baked into the saved code.
  const playerSpriteUri = useMemo(() => avatarSpriteDataUri(character), [character]);
  const previewDoc = useMemo(
    () => preparePreview(code, loadPreviewStorage(previewKey), playerSpriteUri),
    [code, previewKey, playerSpriteUri]
  );

  // ── The controls this particular project offers ──────────────────────────
  //
  // Read out of the child's own file rather than assumed. A project with no
  // settings block gets no Controls tab at all, which is better than a tab of
  // sliders wired to variables that do not exist — which is what was there
  // before: the panel poked `spawnDelay`, `speed` and `gameSpeed`, and not one
  // of the three starter games declares any of them.
  const gameSettings = useMemo(() => readSettings(code), [code]);

  // Read from the code, not from what the child asked for. See codeConcepts.js.
  const conceptsFound = useMemo(() => conceptsIn(code), [code]);

  // What the same slot says after they have changed something. See lookInside.js.
  const behind = useMemo(
    () => (isPersonalized ? lookInside(conceptsFound, lessonsDone) : null),
    [isPersonalized, conceptsFound, lessonsDone],
  );

  // A slider shows the draft if the child is mid-drag, otherwise the file.
  function settingValue(setting) {
    const draft = settingDrafts[setting.name];
    return draft === undefined ? setting.value : draft;
  }

  const allVersions = useMemo(() => [...localVersions, ...serverVersions], [localVersions, serverVersions]);
  const activeModifiers = useMemo(() => {
    const t = (projectType || '').toLowerCase();
    if (['clicker', 'runner', 'memory', 'reaction', 'game', 'soccer'].includes(t)) return gameModifiersFor(code);
    if (['website', 'portfolio', 'restaurant', 'shop', 'sports', 'blog', 'landing'].includes(t)) return WEBSITE_MODIFIERS;
    if (['calculator', 'timer', 'drawing', 'flashcards', 'tool'].includes(t)) return TOOL_MODIFIERS;
    if (/game|clicker|runner|memory|reaction|quiz|soccer/.test(t)) return gameModifiersFor(code);
    if (/website|portfolio|restaurant|shop|sports|blog|landing/.test(t)) return WEBSITE_MODIFIERS;
    return gameModifiersFor(code);
  }, [projectType, code]);

  const sortedProjects = useMemo(() => {
    let list = [...savedProjects];
    if (projectSort !== 'recent') {
      list = list.filter(p => {
        const t = (p.project_type || '').toLowerCase();
        if (projectSort === 'game')    return /game|clicker|runner|memory|reaction/.test(t);
        if (projectSort === 'website') return /website|portfolio|shop|sports|blog|landing/.test(t);
        if (projectSort === 'quiz')    return /quiz/.test(t);
        if (projectSort === 'tool')    return /tool|calculator|timer|drawing|flashcard/.test(t);
        return true;
      });
    }
    list.sort((a, b) => {
      const aFav = favoriteIds.has(a.id);
      const bFav = favoriteIds.has(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
    });
    return list;
  }, [savedProjects, projectSort, favoriteIds]);


  return (
    <>
      <Header />
      <div role="main" className={`bldr-page${nightClass(theme, 'bldr-page--night')}${hasResult ? ' bldr-studio-mode' : ''}`}>
        {paperBurst && (
          <div className="bldr-paper-burst" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => <span key={i} className={`bldr-paper-burst__bit bldr-paper-burst__bit--${i}`} />)}
          </div>
        )}

        {/* The bridge back for a parent arriving from the pricing page. */}
        {studioView1({ parentTrail, setParentTrail })}

        {/* ════════════════════════════════════════
            THE FIRST SCREEN
        ════════════════════════════════════════ */}
        {/* Rounds 68 to 71: a child who had just made an account landed on a
            "STUDIO" pill, a slogan, a green panel, a Pixel card and a section
            sentence, sixty words of instruction at the highest-energy moment
            they will ever have with this product, before a game they could
            tap. The signed-in home already solved this. Same components:
            their name and avatar with the level, then three games running,
            "Pick one and it is yours". A visitor with no account still gets
            the slogan, because they have no other context. */}
        {(!hasResult || showStartOver) && !loading && !user && (
        <section className="bldr-hero">
          <div className="bldr-hero__badge">Studio</div>
          <h1 className="bldr-hero__title">
            Describe it. Build it.<br />
            <span className="bldr-hero__title-accent">Make it yours.</span>
          </h1>
        </section>
        )}
        {studioView2({ character, hasResult, isNewAccountWelcome, loading, openStarter, playerSpriteUri, promptRef, showStartOver, stats, user, welcomeToast })}

        {/* ── Pixel, in person ──────────────────────────────────────────────
            The guidance brain — coachStage, seven state-aware steps — always
            knew what a child should do next. It spoke through a beige text box
            that vanished the moment a project existed, plus a "🧭 Ask Pixel"
            pill: a compass icon asking a seven-year-old to imagine the
            character. Mustafa asked for the character itself: visible,
            animated, telling you what to do next.

            So Pixel stands in the corner, bobbing, holding the current step in
            a speech bubble. Tapping him hides the bubble; tapping him again
            asks. He stays through every stage now — the old worry about "two
            voices disagreeing" was about page-anchored text, and this bubble
            is driven by the same state as the checklist, so the two can never
            disagree about what comes next. */}
        {/* He steps aside while a child is playing or dragging things — the
            browser drag check caught him standing exactly where a finger
            needed to be — twice: first over the game, then over the end of
            the very slider the Controls panel asks a child to drag. So the
            rule is about hands, not screens: playing, dragging elements, or
            using any tool panel means hands are busy, and Pixel steps aside.
            When the hands stop, he is back with the next step. */}
        {/* Before a project exists, Pixel stands in the page rather than over
            it. Walked on 2 September 2026 at 1366x768 and 390x844: the bubble
            is fixed to the bottom right, the starter shelf runs along the
            bottom of the first screen, and on a phone the bubble covered the
            whole second game card including its PLAY button. A guide that
            hides the thing it is pointing at, while saying "tap a game to open
            it", is worse than no guide.

            Once a project exists the floating position is right, because then
            the thing on screen is the child's own project and Pixel should be
            beside it rather than pushing it down. */}
        {/* Rounds 68 to 71: before a project exists, Pixel is one line
            beside the games, not a bordered card with a heading, a paragraph
            and three buttons. The games on the same screen are the
            instruction. An early learner keeps the switch that stops the
            reading aloud, which is the one audio control that matters. */}
        {studioView3({ coachOpen, coachRestTimer, coachStage, code, editModeOn, guideLevel, isPlayMode, setCoachOpen, studioPanel, voiceMode })}
        {studioView4({ coachOpen, coachRestTimer, coachStage, code, editModeOn, guideLevel, isPlayMode, readCoach, setCoachOpen, showCoachTarget, studioPanel, voiceMode })}

        {/* Ambient studio particles. Paused while editing for performance */}
        {hasResult && !editing && (
          <div className="bldr-studio-particles" aria-hidden="true">
            <span className="bldr-studio-particle" />
            <span className="bldr-studio-particle" />
            <span className="bldr-studio-particle" />
            <span className="bldr-studio-particle" />
          </div>
        )}

        {/* ════════════════════════════════════════
            THE SHELVES — eighteen projects that open instantly
        ════════════════════════════════════════ */}
        {/* The coach ring marks the FIRST shelf, not the whole section — a
            halo around one row says "start here"; a halo around the entire
            screen is just a big yellow box. */}
        {studioView5({ coachStage, hasResult, loading, openStarter, showStartOver })}

        {/* ════════════════════════════════════════
            ASK THE AI (empty state, after the shelves)
        ════════════════════════════════════════ */}
        {/* ── Ask the AI for something new ────────────────────────────────
              This used to sit above the shelves, which put the slowest thing in
              the studio first. Pressing one of these sends an idea to the model
              and shows a blank screen for ten to twenty seconds; the shelves
              open in under a second. Children arriving met the slow path,
              waited, and said the site was slow — while twenty finished
              projects sat below the fold, unseen.

              So it comes after. By the time a child reads "or ask for something
              nobody has made yet", they have already had one thing work, and
              waiting twenty seconds for their own idea is a trade they
              understand rather than a blank screen they cannot explain. */}
        {studioView6({ callBuilder, code, error, limitReached, loading, setPrompt })}

        {/* ── How much help, asked later and quieter ────────────────────────
            This used to be the first thing on the screen: three big buttons
            under "How much help do you want?", before a child had seen a single
            thing the studio makes. It is a question with no information behind
            it — nobody knows how much help they need with something they have
            not looked at yet — and it sat between them and anything that
            happens. Children arrived and asked what to do.

            It is a preference, so it is folded away and reachable when someone
            wants it, and the default carries everyone else. */}
        {(!hasResult || showStartOver) && !loading && (
        <details className="bldr-help-level">
          <summary>How much help do you want?</summary>
          <div className="bldr-help-level__options">
            {GUIDE_LEVELS.map(option => (
              <button
                key={option.id}
                type="button"
                className={guideLevel === option.id ? 'is-active' : ''}
                aria-pressed={guideLevel === option.id}
                onClick={() => changeGuideLevel(option.id)}
              >
                <Icon name={option.icon} size={18} />{option.label}
              </button>
            ))}
          </div>
        </details>
        )}

        {/* ════════════════════════════════════════
            INPUT CARD
        ════════════════════════════════════════ */}
        {studioView7({ coachStage, code, editing, handleBuild, handleKeyDown, handleQuickStart, hasResult, loading, prompt, promptRef, setPrompt, showStartOver, stuck })}


        {/* ════════════════════════════════════════
            LOADING STATE
        ════════════════════════════════════════ */}
        {/* ── While a project is being built ────────────────────────────────
            The shelves, the hero and the prompt box used to stay on screen
            during a build, so the thing a child was given to play sat at 1690px
            — below twenty starter cards they had just chosen not to use. The
            empty state and the waiting state are different states, and only one
            of them should be on the screen. */}
        {studioView8({ activeBuildSteps, buildProgress, buildStep, loading, loadingTitle, prompt, waitedSeconds, waitingGame, waitingRef })}

        {/* ════════════════════════════════════════
            ERROR STATE (build)
        ════════════════════════════════════════ */}
        {hasError && (
          <div className="bldr-error-card">
            <div className="bldr-error-card__icon">!</div>
            <div className="bldr-error-card__body">
              <p className="bldr-error-card__title">We couldn't build that yet.</p>
              <p className="bldr-error-card__sub">Try a simpler idea, or rephrase your description.</p>
              <p className="bldr-error-card__detail">{error}</p>
            </div>
            <button className="bldr-action-btn bldr-action-btn--primary bldr-action-btn--sm" onClick={handleBuild}>
              Try again
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════
            MONTHLY AI ALLOWANCE REACHED
        ════════════════════════════════════════ */}
        {studioView9({ code, hasLimit, limitReached, mayBuy, setLimitReached, token })}

        {/* ════════════════════════════════════════
            RESULT SECTION
        ════════════════════════════════════════ */}
        {hasResult && (
          <div className="bldr-result">

            {/* Unsaved warning */}
            {studioView10({ clearEditor, handleSaveProject, setUnsavedWarning, unsavedWarning })}

            {/* Success banner */}
            {/* One object: marquee on top, screen under it, one outline —
                an arcade cabinet, not a stack of cards. The wrapper exists
                because .bldr-result's flex gap was slipping cream between
                the marquee and its own screen. */}
            {studioView11({ awardXP, buildKey, builtPrompt, callBuilder, coachStage, code, conceptsFound, confettiParticles, deviceView, earnsProjectXp, editCount, editError, editModeOn, editRetrySeconds, editing, editingDesc, handleFullscreen, handleSaveProject, handleTogglePlay, hasPersonalized, hasTestedLatest, iframeRef, isPersonalized, isPlayMode, isSaved, isStarter, onTab, previewDoc, previewKeyRef, projectDesc, projectName, saveStatus, setDeviceView, setEditError, setEditingDesc, setProjectDesc, setPrompt, setWorkspaceTab, shelfIdRef, showEditPanel, starterRetry, token, user })}

            {/* ── Right under the game, at the moment of the score ─────────
                The friend button lives far down the page, below the change
                tools, out of sight on a phone. The moment a child has a score
                is the moment they want to show it off, so it is offered here,
                next to the game they just played. */}
            {studioBest > 0 && !isStarter && !editing && (
              <div className="bldr-beat" role="status">
                <span><strong>You scored {studioBest}!</strong> Can a friend beat it?</span>
                <button type="button" onClick={challengeFriend} disabled={friendStatus === 'making'}>
                  {friendStatus === 'making' ? 'Making a link...'
                    : challengeCopied ? 'Link copied. Send it!'
                    : `Challenge a friend to beat ${studioBest}`}
                </button>
              </div>
            )}

            {studioView12({ guestDraftRecovered, handleSaveProject, onTab, user })}

            {/* ── Orientation above, one action inside ───────────────────────
                The old card was two panels in one box: a four-step checklist
                on the left and an action column on the right, eight things to
                press at the moment a child had just watched their game end and
                was asking "what now". On an iPad the right column took the
                width and the heading wrapped one word per line.

                The checklist is orientation, not action. It is a thin strip
                above the card now, with the current step marked. The card is
                one card: the state, one suggestion named from the child's own
                game (the ladder), one button, and a way to see the rest. */}
            {studioView13({ behind, changeHint, code, editModeOn, editRef, editing, handleApplyColors, handleModifier, handleSaveProject, handleTogglePlay, hasPlayedOnce, hasTestedLatest, ideasForThisProject, isPersonalized, isSaved, ladderOffer, moreChanges, openInstantPanel, previewKeyRef, projectType, saveStatus, setLadderOffer, setMoreChanges, setShowEditPanel, setWorkspaceTab, shelfIdRef, toggleEditMode, token, user })}

            {studioView14({ coachStage, editRef, editing, explaining, handleExplain, handlePublish, isPublished, isSaved, onTab, publishStatus, setShowEditPanel, token, user })}

            {studioView15({ coachStage, editRef, editing, handleShare, isPublished, isSaved, onTab, setShowEditPanel, shareStatus, token })}

            {/* ── Pages ────────────────────────────────────────────────
                 One thing at a time. Everything below this bar belongs to
                 whichever page is open; the project preview above it never
                 moves, because it is the point. */}
            {/* The dot is decorative and the hint rides on title. An aria-label
                on the dot became part of the button's accessible name, so the
                Change tab announced itself as "Change something to do here". */}
            {studioView16({ setWorkspaceTab, workspaceTab, workspaceTabs })}

            <p className="bldr-tab-blurb">
              {activeTab?.hint || activeTab?.blurb}
            </p>

            {/* ── Creative Studio Toolbar ─────────────────────────────── */}
            {onTab('change') && (
            <div className="bldr-studio-bar" ref={studioRef}>
              <span className="bldr-studio-bar__label">Studio:</span>
              {STUDIO_TOOLS
                .filter(t => t.id !== 'gameplay' || gameSettings.length > 0)
                .map(tool => (
                  <button
                    key={tool.id}
                    className={`bldr-studio-bar__btn bldr-studio-bar__btn--${tool.id}${studioPanel === tool.id ? ' bldr-studio-bar__btn--active' : ''}`}
                    onClick={() => openStudioTool(tool.id)}
                    disabled={editing}
                  >
                    {tool.label}
                  </button>
                ))}
            </div>
            )}

            {/* Studio contextual panel */}
            {studioView17({ applyColorsInstant, applyEdit, applyInstantChange, code, commitSetting, customAccent, customBg, customPrimary, customText, editing, gameSettings, guideLevel, handleApplyColors, handleRenameProject, handleTogglePlay, instantControls, instantNotice, instantPrefs, mineThemes, onTab, popXp, previewSetting, resetSetting, setCustomAccent, setCustomBg, setCustomPrimary, setCustomText, setInstantNotice, setSettingDrafts, setStudioPanel, setTitleDraft, settingValue, studioPanel, titleDraft })}

            {/* ── Creator Missions ─────────────────────────────── */}
            {studioView18({ editing, handleMissionClick, missionActive, missions, onTab })}

            {/* ── The second stuck moment ──────────────────────────────────
                The build finishes, the game works, and the child has no idea
                what to change. changeIdeasFor(code) reads their own file and
                names three real things in it, and it used to run only behind
                the Change tab, where a child who did not know what to do
                would not go. Three ideas, beside the finished project, every
                time. Not a tab, not a timer, not a pop-up: just there. Tapping
                one moves to Change and sends the exact words. */}
            {/* The answer to "what does it mean by the change it". real
                 things in this child's own project, each with the words to
                 send, so nothing has to be invented. */}
            {studioView19({ editing, handleModifier, ideasForThisProject, onTab })}

            {/* One-click upgrades. Visible immediately after preview */}
            {onTab('change') && (
            <div className="bldr-modifiers">
              <span className="bldr-modifiers__label">
                {/game|clicker|runner|memory|reaction|quiz/.test(projectType) ? 'Power-ups:' : 'Upgrades:'}
              </span>
              {activeModifiers.map(m => (
                <button
                  key={m}
                  className="bldr-modifier-btn"
                  onClick={() => handleModifier(m)}
                  disabled={editing}
                >
                  {editing ? <span className="bldr-spinner bldr-spinner--sm" /> : null}
                  {m}
                </button>
              ))}
            </div>
            )}

            {/* Action bar */}
            {/* Starting over belongs after the thing you might start over
                from. It used to sit above the project — the first full-width
                control a child met on their own game was the one that leaves
                it — and moving it above the shelves instead put it right back
                above the project, because the shelves render higher up. This
                is inside the result, after it. */}
            {studioView20({ builtPrompt, hasResult, setPrompt, setShowStartOver, showStartOver })}

            {studioView21({ aiTitle, allVersions, code, editModeOn, editing, explaining, fetchServerVersions, friendLink, friendStatus, handleCopyPublicLink, handleExplain, handleNewBuild, handlePublish, handleSaveOrGuide, handleSaveProject, handleSendToFriend, handleShare, handleUnpublish, hasTestedLatest, isPersonalized, isPublished, isSaved, isStarter, justPublished, onTab, publicId, publishRefusal, publishStatus, restoringVersion, saveActionLabel, saveStatus, savedProjectId, setEditError, setJustPublished, setShowEditPanel, setShowHistory, shareStatus, showEditPanel, showHistory, studioBest, toggleEditMode, token, user })}

            {onTab('keep') && saveStatus === 'error' && saveError && (
              <p className="bldr-error-inline">{saveError}</p>
            )}

            {/* ── Edit-with-AI panel ─────────────────────────────────────── */}
            {studioView22({ applyEdit, editError, editInstruction, editRef, editRetrySeconds, editStep, editing, handleEditKeyDown, handleUndoEdit, onTab, openStudioTool, previousCode, projectType, promptHistory, setEditError, setEditInstruction, setHasPlayedOnce, setHasTestedLatest, setIsPlayMode, setShowEditPanel, showEditPanel })}

            {/* ── Version History Panel ──────────────────────────────────────── */}
            {studioView23({ activeVersionId, allVersions, handleForkProject, historyLoading, onTab, restoreVersion, restoringVersion, saveVersionToServer, savedProjectId, showHistory })}

            {/* ── Live Element Editor ──────────────────────────────────────────── */}
            {studioView24({ editHistory, editModeOn, onTab, redoHandEdit, undoHandEdit })}

            {onTab('change') && editModeOn && !showElPanel && (
              <div className="bldr-el-hint">
                Click anything in the preview to change it. Drag it to move it.
              </div>
            )}

            {/* ── Tapping the game itself ──────────────────────────────────
                A canvas game is one DOM element. Tapping a falling star selects
                the whole board, so the usual element controls. Bigger, colour,
                spacing. Would offer to restyle a rectangle the child does not
                think of as a thing. What they mean by "change this" is the
                game, so they get the game's own settings instead. */}
            {studioView25({ editModeOn, gameSettings, onTab, openStudioTool, selectedEl, sendBridgeCmd, setShowElPanel, showElPanel })}

            {studioView26({ aiRefineText, applyElStyleChange, applyElTextChange, editModeOn, elAnim, elBgColor, elColor, elPadding, elPanelTab, elText, elementAction, gameSettings, handleAiRefine, onTab, patchError, patchLoading, selectedEl, sendBridgeCmd, setAiRefineText, setElAnim, setElBgColor, setElColor, setElPadding, setElPanelTab, setElText, setShowElPanel, showElPanel })}

            {/* ── What you made, before the file you made it in ──────────────
                This list used to sit underneath the editor. The editor holds
                the child's whole project — two hundred lines beginning
                <!doctype html>, then a <meta viewport>, then sixty lines of CSS
                — so the page ran to four thousand pixels and the answer to
                "what did I actually make" was five screens down.

                It is the best thing on this tab. Every row is something found
                in the child's own file, with the count, the line number and
                their own line. It goes first. */}
            {/* ── The code, first ────────────────────────────────────────
                This tab is called "The code" and for a while it did not show
                any code when there was nothing else to show. The editor block
                had been pasted INSIDE the concept list's header, so both the
                concepts and the code were rendered by one condition:
                conceptsFound.length > 0. A project the concept reader found
                nothing in produced a completely blank tab. A person told us
                exactly that: "when he presses on learn the screen is empty".
                It is its own block now. */}
            {onTab('learn') && code && (
              <CodePanel
                code={code}
                onCodeChange={next => {
                  if (next === codeRef.current) return;
                  setEditHistory(prev => rememberEdit(prev, codeRef.current, 'Typed in the code'));
                  setCode(next);
                  setIsSaved(false);
                  setSaveStatus(null);
                  trackPersonalizationOnce();
                }}
                errors={runErrors}
                safety={safety}
                onRestore={restoreLastWorking}
                guideLevel={guideLevel}
                liveDoc={previewDoc}
                arriveHere={arriveAtCodeRef.current}
                onArrived={() => { arriveAtCodeRef.current = false; }}
                isGame={(projectType || '').toLowerCase() === 'game'}
                onPlay={() => {
                  setWorkspaceTab('play');
                  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
                  iframeRef.current?.scrollIntoView?.({ block: 'center', behavior: still ? 'auto' : 'smooth' });
                }}
              />
            )}

            {/* ── What you made, before the file you made it in ──────────────
                Every row is something found in the child's own file, with the
                count, the line number and their own line. Read out of the code,
                never out of the prompt: see codeConcepts.js. */}
            {studioView27({ conceptsFound, onTab, token })}

            {/* Nothing matched, which is not the same as nothing to say. The
                tab must never be empty: a person who taps "The code" and sees
                white space learns that the button is broken. */}
            {onTab('learn') && code && conceptsFound.length === 0 && (
              <div className="bldr-lessons-used">
                <div className="bldr-lessons-used__header">
                  <span className="bldr-lessons-used__title">The code is above</span>
                  <span className="bldr-lessons-used__sub">
                    Nothing in this project lines up with a lesson yet. Change something
                    in the code and it will show up here.{' '}
                    <Link to="/lessons" onClick={() => void trackEvent('learn_the_code_behind', null, token)}>
                      Start the lessons instead
                    </Link>
                  </span>
                </div>
              </div>
            )}

            {/* Explanation */}
            {explainError && <p className="bldr-error-inline">{explainError}</p>}
            {onTab('learn') && explanation && (
              <div className="bldr-explanation">
                <div className="bldr-explanation__label">What this project does</div>
                <p className="bldr-explanation__text">{explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            MOBILE STICKY PLAY BAR
        ════════════════════════════════════════ */}
        {studioView28({ editModeOn, editing, gameSettings, handleSaveOrGuide, handleTogglePlay, hasResult, isPlayMode, isSaved, openStudioTool, saveStatus, setEditError, setShowEditPanel, setWorkspaceTab, toggleEditMode, user })}

        {/* ════════════════════════════════════════
            MY SAVED PROJECTS
        ════════════════════════════════════════ */}
        {studioView29({ favoriteIds, handleDeleteProject, handleLoadProject, handlePublishSavedProject, handleShareSavedProject, projectCardAction, projectOpenError, projectOpeningId, projectSort, projectsLoading, savedProjects, setProjectSort, sortedProjects, toggleFavorite, user })}

        {/* ════════════════════════════════════════
            FIXED DESKTOP CREATOR TOOLBAR
        ════════════════════════════════════════ */}
        {studioView30({ editing, gameSettings, hasResult, loading, openStudioTool, studioPanel })}

        {/* ── Notices: one stack, one corner ────────────────────────────
            The XP pop and the companion tip were two fixed elements pinned
            to the same bottom-right corner, and on a phone one sat on top of
            the other ("Save this before editing more." covering the word
            "Click"). The stacking rule: transient notices live in this one
            column at the top right, newest at the bottom, each below the
            last; they never cover the play bar or Pixel, whose corners are
            theirs (Pixel bottom right, the chest bottom left). */}
        {studioView31({ companionTip, companionVisible, setCompanionVisible, studioPanel, tipBlocked, toastsRef, xpPopup })}

        {/* ── Name it (message 68) ─────────────────────────────────────── */}
        {studioView32({ handleSaveProject, naming, namingRef, projectName, setNaming })}

        {/* ── Wow moment overlay ────────────────────────────────── */}
        {studioView33({ setShowWow, showWow, wowType })}

        {/* ── Three starters, running ────────────────────────────────────
            A pale marketing card sat here ("A guided place to build, change,
            and understand code", four feature pills), shown to a signed-in
            child who was already in the studio. Rounds 66 and 67: delete
            it, and put the live starter previews there instead. A child in
            the studio does not need to be told what the studio is; a game
            actually moving tells them what they can have. */}
        {!code && !loading && !user && (
        <section className="bldr-live" aria-labelledby="bldr-live-title">
          <h2 className="bldr-live-title" id="bldr-live-title">These three are running now. Pick one and it is yours.</h2>
          <ul className="bldr-live__row">
            {HOME_PICKS.map(game => (
              <li key={game.id}>
                <button type="button" className="bldr-live__card" onClick={() => openStarter(starterProjectById(game.id))}>
                  <LiveFrame className="bldr-live__frame" code={game.code} title={`${game.label}, running`} />
                  <span className="bldr-live__label"><Icon name="play" size={12} /> {game.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        )}

      </div>
    </>
  );
}
