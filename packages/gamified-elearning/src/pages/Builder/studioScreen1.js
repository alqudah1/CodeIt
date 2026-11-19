/* eslint-disable no-useless-escape -- fallback project templates intentionally preserve escaped HTML/JS */
// Part 1 of the studio's screen. Each function here is a piece of what Builder() draws, moved out
// word for word. It is handed, as one object, exactly the names it used there. Not a component:
// Builder() calls it while drawing, so nothing about how the page updates has changed.
// See Builder.js for why the studio is in parts.
import { API_BASE_URL } from '../../config/api';
import { HERO_BUILDS, HERO_STICKERS, QUICK_STARTS, SHELF_STICKERS } from './studioKit1';
import { HOME_PICKS } from './starterGames';
import Icon from '../../components/Icon/Icon';
import { LevelCard } from '../Home/MemberHome';
import { Link } from 'react-router-dom';
import LiveCardArt from '../../components/LiveCardArt/LiveCardArt';
import ProveItPanel from './ProveItPanel';
import { SHELVES, starterProjectById } from './starterProjects';
import { STARTER_TEMPLATES, firstOfNextMonth, friendlyWait } from './studioKit2';
import YourShelf from '../Home/YourShelf';
import { conceptSummary } from './codeConcepts';
import { hasUnderstood, recordUnderstanding } from '../../utils/understanding';
import { injectPlayerSprite } from '../../utils/avatarSprite';
import { setVoiceState, stopSpeaking } from '../../utils/voice';
import { trackEvent } from '../../utils/trackEvent';
import { writtenShare } from './buildStream';

export function studioView1(studio) {
  const { parentTrail, setParentTrail } = studio;
  return (
    parentTrail && (
          <aside className="bldr-parent-trail" aria-label="For the grown-up trying this out">
            <span>
              For the grown-up: this is exactly what your child uses. Seen enough?
            </span>
            <Link
              to="/pricing#family-pilot"
              onClick={() => void trackEvent('parent_cta_click', 'builder-trial-return')}
            >
              The family pilot is free →
            </Link>
            <button
              type="button"
              aria-label="Dismiss this note"
              onClick={() => {
                setParentTrail(false);
                try { sessionStorage.setItem('codeit_parent_trail_dismissed', '1'); } catch (_) {}
              }}
            >
              ✕
            </button>
          </aside>
        )
  );
}

export function studioView2(studio) {
  const { character, hasResult, isNewAccountWelcome, loading, openStarter, playerSpriteUri, promptRef, showStartOver, stats, user, welcomeToast } = studio;
  return (
    (!hasResult || showStartOver) && !loading && user && (
        <section className="bldr-arrive studio-home--member" aria-labelledby="bldr-arrive-title">
          {/* "Your account is ready" is a success message, so it is a toast
              that fades, not a permanent green panel. In the flow, above the
              name, so it covers nothing; it fades and folds away. */}
          {welcomeToast && (
            <aside className="bldr-account-ready" role="status">
              <strong>Your account is ready.</strong>
              <span>Your first saved project will stay in this account.</span>
            </aside>
          )}
          <h1 id="bldr-arrive-title" className="member__hello">
            {isNewAccountWelcome ? 'Welcome' : 'Welcome back'}, {user.name || 'Builder'}.
          </h1>
          <div className="member__row">
            <LevelCard name={user.name || 'Builder'} character={character} totalXP={stats?.totalXP} />
            <YourShelf
              projects={[]}
              starters={HOME_PICKS}
              prepare={(html) => injectPlayerSprite(html, playerSpriteUri)}
              signedIn
              onPick={(game) => openStarter(starterProjectById(game.id))}
            />
          </div>
          <button
            type="button"
            className="studio-hero__textlink bldr-arrive__own"
            onClick={() => {
              promptRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
              setTimeout(() => promptRef.current?.focus(), 300);
            }}
          >
            Or type your own idea
          </button>
        </section>
        )
  );
}

export function studioView3(studio) {
  const { coachOpen, coachRestTimer, coachStage, code, editModeOn, guideLevel, isPlayMode, setCoachOpen, studioPanel, voiceMode } = studio;
  return (
    !isPlayMode && !editModeOn && !studioPanel && !code && (
        <aside className={`pixel-guide pixel-guide--line${coachOpen ? '' : ' pixel-guide--resting'}`}>
          <button
            type="button"
            className="pixel-guide__pal"
            onClick={() => { clearTimeout(coachRestTimer.current); setCoachOpen(open => !open); }}
            aria-label={coachOpen ? 'Put Pixel to rest' : 'Ask Pixel what to do next'}
          >
            <img src="/brand/pixel-guide.png" alt="" />
          </button>
          {coachOpen && (
            <div className={`pixel-guide__line pixel-guide__bubble--${guideLevel}`} role="status" aria-live="polite">
              <strong className="pixel-guide__title">{coachStage.title}</strong>
              {/* Silent until asked. Once an early learner has asked, every
                  step is read and the one control is the switch that stops
                  it; before that, or muted, the button asks. */}
              {guideLevel === 'early' && (voiceMode === 'asked' ? (
                <button
                  type="button"
                  className="pixel-guide__quiet"
                  aria-pressed={false}
                  onClick={() => { setVoiceState('muted'); stopSpeaking(); }}
                  aria-label="Stop Pixel reading out loud"
                >
                  <Icon name="speaker" size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  className="pixel-guide__read"
                  onClick={() => setVoiceState('asked')}
                  aria-label="Let Pixel read steps out loud"
                >
                  <Icon name="speaker" size={18} /> Read to me
                </button>
              ))}
            </div>
          )}
        </aside>
        )
  );
}

export function studioView4(studio) {
  const { coachOpen, coachRestTimer, coachStage, code, editModeOn, guideLevel, isPlayMode, readCoach, setCoachOpen, showCoachTarget, studioPanel, voiceMode } = studio;
  return (
    !isPlayMode && !editModeOn && !studioPanel && code && (
        <aside className={`pixel-guide${coachOpen ? '' : ' pixel-guide--resting'}`}>
          {coachOpen && (
            <div className={`pixel-guide__bubble pixel-guide__bubble--${guideLevel}`} role="status" aria-live="polite">
              <span className="pixel-guide__step">Pixel · Step {coachStage.number}</span>
              <strong className="pixel-guide__title"><Icon name={coachStage.icon} size={20} /> {coachStage.title}</strong>
              <p className="pixel-guide__detail">{coachStage.detail}</p>
              <div className="pixel-guide__actions">
                <button type="button" className="pixel-guide__show" onClick={showCoachTarget}><Icon name="hand" size={18} /> Show me</button>
                <button
                  type="button"
                  className="pixel-guide__read"
                  onClick={() => {
                    // A "Big help" learner asking once is read every step
                    // from then on; the state change does the reading.
                    if (guideLevel === 'early' && voiceMode !== 'asked') { setVoiceState('asked'); return; }
                    readCoach(`${coachStage.title}. ${coachStage.detail}`);
                  }}
                  aria-label={guideLevel === 'early' && voiceMode !== 'asked' ? 'Let Pixel read steps out loud' : 'Read this step to me'}
                >
                  <Icon name="speaker" size={18} /> Read to me
                </button>
                {guideLevel === 'early' && voiceMode === 'asked' && (
                  <button
                    type="button"
                    className="pixel-guide__quiet"
                    aria-pressed={false}
                    onClick={() => { setVoiceState('muted'); stopSpeaking(); }}
                    aria-label="Stop Pixel reading out loud"
                  >
                    <Icon name="speaker" size={18} />
                  </button>
                )}
              </div>
            </div>
          )}
          <button
            type="button"
            className="pixel-guide__pal"
            onClick={() => { clearTimeout(coachRestTimer.current); setCoachOpen(open => !open); }}
            aria-label={coachOpen ? 'Put Pixel to rest' : 'Ask Pixel what to do next'}
          >
            <img src="/brand/pixel-guide.png" alt="" />
            {!coachOpen && <span className="pixel-guide__hint" aria-hidden="true">?</span>}
          </button>
        </aside>
        )
  );
}

export function studioView5(studio) {
  const { coachStage, hasResult, loading, openStarter, showStartOver } = studio;
  return (
    (!hasResult || showStartOver) && !loading && (
        <section className="bldr-shelves" aria-label="Projects you can open right now">
          {/* "Tap one. It opens straight away, and then you can change
              anything in it." lived here, which is what the coach card two
              inches above already says, in the same words. */}
          {SHELVES.map((shelf, shelfIdx) => (
            <div className="bldr-shelf" key={shelf.kind}>
              <div className="bldr-shelf__head">
                {(() => { const Art = SHELF_STICKERS[shelf.kind]; return Art ? <Art size={40} /> : null; })()}
                <h2 className="bldr-shelf__title">{shelf.title}</h2>
              </div>
              <ul className="bldr-shelf__row">
                {shelf.items.map(item => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="bldr-shelf__card"
                      onClick={() => openStarter(item)}
                      data-codeit-coach={
                        coachStage.target === 'pick' && shelfIdx === 0 && shelf.items.indexOf(item) === 0
                          ? 'current' : undefined
                      }
                    >
                      <span className={`bldr-shelf__marquee bldr-shelf__marquee--${shelf.items.indexOf(item) % 4}`} aria-hidden="true">
                        <LiveCardArt
                          code={item.code}
                          title={`${item.label}, running`}
                          placeholder={<span className="bldr-shelf__emoji"><Icon name={item.icon} size={58} strokeWidth={1.4} /></span>}
                        />
                      </span>
                      <span className="bldr-shelf__meta">
                        <span className="bldr-shelf__label">{item.label}</span>
                        <span className="bldr-shelf__blurb">{item.blurb}</span>
                        <span className="bldr-shelf__play" aria-hidden="true"><Icon name="play" size={11} strokeWidth={3} /> PLAY</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        )
  );
}

export function studioView6(studio) {
  const { callBuilder, code, error, limitReached, loading, setPrompt } = studio;
  return (
    !code && !loading && !error && !limitReached && (
          <div className="bldr-hero-picks">
            <p className="bldr-hero-picks__label">Or ask for something nobody has made yet</p>
            <div className="bldr-hero-picks__grid">
              {HERO_BUILDS.map(hb => (
                <button
                  key={hb.id}
                  className={`bldr-hero-pick bldr-hero-pick--${hb.id}`}
                  onClick={() => { setPrompt(hb.prompt); callBuilder(hb.prompt); }}
                >
                  {(() => { const Art = HERO_STICKERS[hb.id]; return Art ? <Art size={46} /> : null; })()}
                  <span className="bldr-hero-pick__title">{hb.title}</span>
                  <span className="bldr-hero-pick__sub">{hb.sub}</span>
                  <span className="bldr-hero-pick__cta">Build now</span>
                </button>
              ))}
            </div>
          </div>
        )
  );
}

export function studioView7(studio) {
  const { coachStage, code, editing, handleBuild, handleKeyDown, handleQuickStart, hasResult, loading, prompt, promptRef, setPrompt, showStartOver, stuck } = studio;
  return (
    (!hasResult || showStartOver) && !loading && (
        <div className="bldr-input-card">
          <div className="bldr-textarea-wrap">
            <textarea
              ref={promptRef}
              className="bldr-textarea"
              placeholder="Describe what you want to build..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              disabled={loading || editing}
            />
            <div className="bldr-textarea-hint">Ctrl+Enter to build</div>
          </div>
          {stuck === 'never' && !code && (
            <p className="bldr-stuck" data-testid="stuck-never">Not sure? Tap one of the games above and change it after.</p>
          )}
          {stuck === 'abandoned' && (
            <p className="bldr-stuck" data-testid="stuck-abandoned">Keep it short. “A game where a cat catches falling stars” is enough.</p>
          )}
          {code && !loading && (
            <div className="bldr-quickstarts">
              <span className="bldr-quickstarts__label">Try another idea:</span>
              {['Game', 'Website', 'Tool'].map(cat => (
                <div key={cat} className="bldr-quickstarts__group">
                  <span className="bldr-quickstarts__group-label">{cat}s</span>
                  <div className="bldr-quickstarts__chips">
                    {QUICK_STARTS.filter(qs => qs.category === cat).map(qs => (
                      <button key={qs.label} className="bldr-chip" onClick={() => handleQuickStart(qs)}>
                        {qs.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            className="bldr-build-btn"
            data-codeit-coach={coachStage.target === 'build' ? 'current' : undefined}
            onClick={handleBuild}
            disabled={!prompt.trim() || loading || editing}
          >
            {loading
              ? <><span className="bldr-spinner bldr-spinner--btn" />Building...</>
              : hasResult ? 'Rebuild from scratch' : 'Build my project'}
          </button>
          <p className="bldr-privacy-hint">
            Keep personal details private. Leave out your full name, email, school, address and passwords.
          </p>
        </div>
        )
  );
}

export function studioView8(studio) {
  const { activeBuildSteps, buildProgress, buildStep, loading, loadingTitle, prompt, waitedSeconds, waitingGame, waitingRef } = studio;
  return (
    loading && (
          <>
            {/* ── Play a real one while yours is written ────────────────────
                This was below the progress card, so the first thing a waiting
                child saw was a bar telling them to wait. And it played one of
                five generic demo templates while twenty finished projects sat
                unused in the same folder.

                Now it is first, and it is the real starter closest to what they
                typed — browser-tested at two sizes on every build, unlike the
                templates it replaces. */}
            <div className="bldr-loading-preview-wrap" ref={waitingRef}>
              <div className="bldr-loading-preview__say">
                <strong>Play this while I build yours.</strong>
                <span>{waitingGame ? waitingGame.label : 'One moment'}</span>
                {/* At the top, where a child playing the waiting game can see
                    it: the steps below finish in about a minute, and a whole
                    project can take three. */}
                {waitedSeconds >= 15 && (
                  <p className="bldr-loading__slow" role="status">
                    {waitedSeconds < 100
                      ? 'Still writing yours. A project made from your own words can take up to three minutes.'
                      : 'Still writing. If it is not ready by three minutes, you get something to start from and a button to try again.'}
                  </p>
                )}
                {/* On a phone the code panel is below the waiting game, so the
                    count that says it is really happening is up here too. */}
                {buildProgress && buildProgress.lines > 0 && (
                  <a className="bldr-loading__peek" href="#bldr-writing" onClick={(e) => { e.preventDefault(); document.getElementById('bldr-writing')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>
                    Yours: {buildProgress.lines} {buildProgress.lines === 1 ? 'line' : 'lines'} of code written. Watch it
                  </a>
                )}
              </div>
              <div className="bldr-loading-preview__iframe-wrap">
                <iframe
                  className="bldr-iframe"
                  srcDoc={waitingGame ? waitingGame.code : STARTER_TEMPLATES.game}
                  sandbox="allow-scripts allow-forms"
                  title="Play this while your project is built"
                />
              </div>
            </div>
            <div className="bldr-loading">
              <div className="bldr-loading__header">
                <span className="bldr-spinner" />
                <span className="bldr-loading__title">{loadingTitle}</span>
              </div>
              <p className="bldr-loading__idea">"{prompt}"</p>

              {/* The real thing, once the server streams it: the last lines of
                  the child's own code as it is written. Until the first words
                  arrive (or if the connection does not stream) the steps show. */}
              {buildProgress && buildProgress.lines > 0 ? (
                <div className="bldr-loading__writing" id="bldr-writing">
                  <p className="bldr-loading__writing-label">
                    {buildProgress.attempt > 1 ? 'Second try, on a stronger model. ' : ''}
                    Your code, being written: <b>{buildProgress.lines}</b> {buildProgress.lines === 1 ? 'line' : 'lines'} so far
                  </p>
                  <pre className="bldr-loading__code" aria-hidden="true"><code>{buildProgress.tail}</code><span className="bldr-loading__caret" /></pre>
                </div>
              ) : (
              <div className="bldr-loading__steps">
                {activeBuildSteps.map((step, i) => (
                  <div
                    key={i}
                    className={`bldr-loading__step ${
                      buildStep > i ? 'is-done' : buildStep === i ? 'is-active' : 'is-pending'
                    }`}
                  >
                    <span className="bldr-loading__step-icon" aria-hidden="true">
                      {buildStep > i ? '✓' : buildStep === i ? '' : '○'}
                      {buildStep === i && <span className="bldr-loading__step-spinner" />}
                    </span>
                    <span className="bldr-loading__step-text">{step}</span>
                  </div>
                ))}
              </div>
              )}

              <div className="bldr-loading__bar-wrap">
                <div
                  className="bldr-loading__bar"
                  style={{ width: `${buildProgress && buildProgress.chars > 0 ? writtenShare(buildProgress.chars) : Math.min(((buildStep) / activeBuildSteps.length) * 100 + 8, 92)}%` }}
                />
              </div>
            </div>

          </>
        )
  );
}

export function studioView9(studio) {
  const { code, hasLimit, limitReached, mayBuy, setLimitReached, token } = studio;
  return (
    hasLimit && (
          <div className="bldr-limit-card" role="status">
            {/* The Parent page promises "Nothing is sold to your child... Plans
                are for grown-ups, on a page children do not see", and the
                header only offers Plus to an adult account. This card showed
                "See CodeIt Plus" to whoever hit the limit, which is usually
                the child. A child is told what still works and when the
                builds come back; a grown-up is shown the plan. */}
            <div className="bldr-limit-card__body">
              <p className="bldr-limit-card__title">That is this month's free studio builds used up.</p>
              <p className="bldr-limit-card__sub">
                {mayBuy
                  ? (limitReached || 'Every lesson, puzzle and project stays open, and you can keep changing anything you have already built.')
                  : `Quick games on Build do not count, so make as many as you like. You can still change every game you have made and do every lesson. New studio builds come back on ${firstOfNextMonth()}.`}
              </p>
            </div>
            <div className="bldr-limit-card__actions">
              {mayBuy ? (
                <Link
                  className="bldr-action-btn bldr-action-btn--primary bldr-action-btn--sm"
                  to="/pricing#codeit-plus"
                  onClick={() => void trackEvent('upgrade_click', 'build-limit', token)}
                >
                  See CodeIt Plus
                </Link>
              ) : (
                <Link className="bldr-action-btn bldr-action-btn--primary bldr-action-btn--sm" to="/build">
                  Make a quick game
                </Link>
              )}
              <button
                type="button"
                className="bldr-action-btn bldr-action-btn--sm"
                onClick={() => setLimitReached('')}
              >
                {code ? 'Keep editing' : 'Keep looking around'}
              </button>
            </div>
          </div>
        )
  );
}

export function studioView10(studio) {
  const { clearEditor, handleSaveProject, setUnsavedWarning, unsavedWarning } = studio;
  return (
    unsavedWarning && (
              <div className="bldr-unsaved-warning">
                <span className="bldr-unsaved-warning__text">
                  Start a new project? Save this one first if you want to keep it.
                </span>
                <div className="bldr-unsaved-warning__actions">
                  <button className="bldr-action-btn bldr-action-btn--save bldr-action-btn--sm" onClick={handleSaveProject}>
                    Save first
                  </button>
                  <button className="bldr-action-btn bldr-action-btn--sm" onClick={clearEditor}>
                    Start a new one anyway
                  </button>
                  <button className="bldr-action-btn bldr-action-btn--sm" onClick={() => setUnsavedWarning(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )
  );
}

export function studioView11(studio) {
  const { awardXP, buildKey, builtPrompt, callBuilder, coachStage, code, conceptsFound, confettiParticles, deviceView, earnsProjectXp, editCount, editError, editModeOn, editRetrySeconds, editing, editingDesc, handleFullscreen, handleSaveProject, handleTogglePlay, hasPersonalized, hasTestedLatest, iframeRef, isPersonalized, isPlayMode, isSaved, isStarter, onTab, previewDoc, previewKeyRef, projectDesc, projectName, saveStatus, setDeviceView, setEditError, setEditingDesc, setProjectDesc, setPrompt, setWorkspaceTab, shelfIdRef, showEditPanel, starterRetry, token, user } = studio;
  return (
    <div className="bldr-cabinet" key={buildKey}>
            <div className="bldr-success-banner">
              <div className="bldr-success-banner__check-wrap">
                <div className="bldr-success-banner__check" aria-hidden="true">✓</div>
                <div className="bldr-confetti-burst" aria-hidden="true">
                  {confettiParticles.map(p => (
                    <span
                      key={p.id}
                      className={`bldr-confetti-dot${p.isCircle ? ' bldr-confetti-dot--circle' : ''}`}
                      style={{ '--angle': `${p.angle}deg`, '--dist': `${p.dist}px`, background: p.color, animationDelay: `${p.delay}s` }}
                    />
                  ))}
                </div>
              </div>
              {/* Said out loud, in the child's words, because the alternative
                  is letting them work it out for themselves. A build that
                  quietly hands back a template teaches a nine-year-old that
                  the site does not listen, and that lesson is not recoverable
                  by a nicer button somewhere else. */}
              <div className="bldr-success-banner__copy">
                {/* One row: the name, then the honest state as a small sticker.
                    The escalation still earns itself — ready → personalized by
                    you → 3 edits applied; "You built this!" stays dead.

                    Two lines went. "by <name>. Made with CodeIt" was the brand
                    introducing itself to the person who just opened their own
                    project — attribution belongs on the share page, where the
                    strangers are. And builtSummary restated what the child is
                    looking at. Between them and the shelf below, the game
                    started a full card lower than it needed to. */}
                <h2 className="bldr-success-banner__name">{isStarter ? 'A starter to change' : projectName}</h2>
                <span className="bldr-success-banner__label">
                  {isStarter
                    ? 'Not your idea yet'
                    : editCount > 0
                      ? `${editCount} edit${editCount > 1 ? 's' : ''} applied`
                      : hasPersonalized ? 'Personalized by you' : 'Ready for your first change'}
                </span>
                {isSaved && <span className="bldr-success-banner__saved">Saved</span>}
              </div>
              {isStarter && starterRetry?.rest && (
                <div className="bldr-starter-notice" role="status">
                  <strong>Pixel has built all the new ideas it can for today.</strong>
                  <p>
                    This is a starter you can play and change yourself.
                    {' '}Pixel can build your idea in about {starterRetry.rest} hour{starterRetry.rest === 1 ? '' : 's'}.
                  </p>
                </div>
              )}
              {isStarter && !starterRetry?.rest && (
                <div className="bldr-starter-notice" role="status">
                  <strong>
                    {starterRetry?.attempts === 1
                      ? 'Your idea took longer to build than the time I had.'
                      : 'I tried your idea twice and could not build it.'}
                  </strong>
                  <p>
                    {starterRetry?.escalates
                      ? 'This is a starter you can change instead. Or try again: the next go starts on the bigger model and gets more time.'
                      : 'This is a starter you can change instead. Or try again: the next go gets more time, and a shorter idea often helps.'}
                  </p>
                  <button
                    type="button"
                    className="bldr-starter-notice__retry"
                    onClick={() => { if (builtPrompt) { setPrompt(builtPrompt); callBuilder(builtPrompt, { escalate: true }); } }}
                  >
                    {starterRetry?.escalates ? 'Try again on the bigger model' : 'Try again with more time'}
                  </button>
                </div>
              )}
              <div className="bldr-success-banner__deck">
                {/* The controls that lived on their own empty shelf below.
                    A marquee with the knobs on it is an arcade cabinet; a
                    white bar with three buttons lost on it was furniture. */}
                <details className="bldr-device-sizes">
                  <summary title="Check it at another size">Size</summary>
                  <div className="bldr-device-sizes__options">
                    {[
                      { id: 'desktop', label: 'Desktop' },
                      { id: 'tablet',  label: 'Tablet'  },
                      { id: 'mobile',  label: 'Mobile'  },
                    ].map(d => (
                      <button
                        key={d.id}
                        className={`bldr-device-btn${deviceView === d.id ? ' bldr-device-btn--active' : ''}`}
                        onClick={() => setDeviceView(d.id)}
                        title={`Preview as ${d.label}`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </details>
                <button
                  className="bldr-browser__fullscreen-btn"
                  onClick={handleFullscreen}
                  title="Open in full screen tab"
                >
                  Full screen
                </button>
                <button
                  className="bldr-browser__play-btn"
                  onClick={handleTogglePlay}
                  data-codeit-coach={coachStage.target === 'play' ? 'current' : undefined}
                  title={isPlayMode ? 'Compact view' : 'Expand to play mode'}
                >
                  {isPlayMode ? 'Compact' : 'Play'}
                </button>
              </div>

              {/* ── The door to the lesson behind what they just made ────────
                  The whole idea of the product is that a child learns the code
                  under their own project. That was true inside a tab called
                  "The code", which is a thing you have to know to look for.
                  This says it in words, on the banner, at the moment the
                  project appears, and it only appears when the tab it opens
                  has something in it. */}
              {conceptsFound.length > 0 && (
                <button
                  type="button"
                  className="bldr-success-banner__save bldr-success-banner__behind"
                  onClick={() => {
                    setWorkspaceTab('learn');
                    void trackEvent('learn_the_code_behind', null, token);
                  }}
                >
                  <span>Learn the code behind it</span>
                  <small>{conceptSummary(conceptsFound)}</small>
                </button>
              )}

              {!isSaved && isPersonalized && hasTestedLatest && (
                <button
                  type="button"
                  className="bldr-success-banner__save"
                  onClick={handleSaveProject}
                  disabled={saveStatus === 'saving' || editing}
                  aria-label="Save this project now"
                >
                  <span>{saveStatus === 'saving' ? 'Saving…' : user ? 'Save now' : 'Keep it free'}</span>
                  <small>
                    {user
                      ? earnsProjectXp ? 'Keep it + earn 25 XP' : 'Keep it in your account'
                      : 'Use it on another device'}
                  </small>
                </button>
              )}
            </div>

            {/* The "keep it in a free account" nudge lives on Keep. It is true
                and useful, but it was sitting between a child and the game they
                had just made, and nobody wants to read about browser storage
                before they have played the thing.

                The recovery message is different and stays on Play: a child
                coming back to find their project waiting needs to be told so at
                the moment they arrive, not on a page they might not open. */}
            {/* The recovery notice moved below the cabinet: it was rendering
                between the marquee and the screen, wedging a card into the
                middle of the one object on the page. */}

            {/* The understanding check. On Keep, because "is this mine?" is the
                question you ask when you are about to keep something. And
                because a parent's reason to pay is made here, not on Play. */}
            {onTab('keep') && code && (
              <ProveItPanel
                code={code}
                projectTitle={projectName}
                isStarter={isStarter}
                alreadyProved={hasUnderstood(localStorage, shelfIdRef.current)}
                onProved={({ skills, questionIds }) => {
                  const projectId = shelfIdRef.current || previewKeyRef.current;
                  recordUnderstanding(localStorage, {
                    projectId,
                    projectTitle: projectName,
                    skills,
                  });
                  // Signed in, the evidence also goes to the account, where it
                  // survives a wiped browser and reaches a parent's phone. The
                  // server writes the sentences from the ids; localStorage
                  // stays the offline learner's copy.
                  if (token && Array.isArray(questionIds) && questionIds.length) {
                    void fetch(`${API_BASE_URL}/api/understanding`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ projectKey: projectId, projectTitle: projectName, questionIds }),
                    })
                      .then((res) => (res.ok ? res.json() : null))
                      // The server pays for what was NEW in this record, and
                      // only that. It is the largest single award in the
                      // product, on purpose: see xpTotals.js on the backend.
                      .then((data) => { if (data?.xpEarned > 0) awardXP(data.xpEarned); })
                      .catch(() => { /* the local record still exists */ });
                  }
                  void trackEvent('project_explained', String(skills.length), token);
                }}
              />
            )}

            {/* Project description. Inline editable. On Keep, because writing
                a description is something you do when you are keeping a thing,
                not the first thing you meet after making it. */}
            {onTab('keep') && (
            <div className="bldr-project-desc">
              {editingDesc ? (
                <textarea
                  className="bldr-project-desc__input"
                  value={projectDesc}
                  onChange={e => setProjectDesc(e.target.value)}
                  onBlur={() => setEditingDesc(false)}
                  placeholder="Add a description of your project..."
                  rows={2}
                  autoFocus
                />
              ) : (
                <p
                  className={`bldr-project-desc__text${projectDesc ? '' : ' bldr-project-desc__text--empty'}`}
                  onClick={() => setEditingDesc(true)}
                  title="Click to add a description"
                >
                  {projectDesc || 'Add a description...'}
                </p>
              )}
            </div>
            )}

            {/* "Playable project" and "Game controls ready" used to sit here,
                thirty-one pixels above a game the child was about to play. They
                describe the project to somebody who cannot see it, and the child
                can. Removed. */}

            {/* The device bar is gone: its three controls live on the marquee
                above, so the cabinet is one object — title strip, knobs,
                screen — instead of three stacked cards. */}
            {/* Live interactive iframe preview */}
            <div className={`bldr-browser bldr-browser--${deviceView}${isPlayMode ? ' bldr-browser--play' : ''}`}>
              {/* ── The pretend browser window is gone ──────────────────────
                  It drew three traffic-light dots and an address bar reading
                  "CodeIt Studio: <name>" above every project. Fifty-five pixels
                  of decoration, on top of a forty-eight pixel device bar, on top
                  of a hundred-and-nineteen pixel banner — and the game itself
                  started 553px down a 800px screen, below the fold on a phone.
                  A child opened their game and had to scroll to find it.

                  Measured, the child's project was 33% of the page. Everything
                  else was CodeIt talking. The dots and the fake URL said nothing
                  a child needs; only Play and Full screen did, and they moved up
                  into the one strip that remains. */}
              {editing && (
                <div className="bldr-browser__applying" role="status">
                  <span className="bldr-browser__bar-spinner" />Applying changes...
                </div>
              )}
              {/* A change asked for from the side buttons failed, and the
                  only place that said so was the edit panel, which those
                  buttons never open. On 28 October a child waited fifty
                  seconds and then saw nothing at all. It is said here, where
                  "Applying changes..." just was. */}
              {!editing && editError && !showEditPanel && (
                <div className="bldr-browser__applying bldr-browser__applying--failed" role="alert">
                  <span>
                    {editError === 'AI_LIMIT'
                      ? `Pixel needs a short break. Try again in ${friendlyWait(editRetrySeconds)}. Your project was not changed.`
                      : editError}
                  </span>
                  <button type="button" onClick={() => setEditError('')}>OK</button>
                </div>
              )}
              {/* sandbox="allow-scripts allow-forms allow-pointer-lock". enables JS, forms, and pointer lock for games */}
              <iframe
                ref={iframeRef}
                srcDoc={previewDoc}
                className={`bldr-iframe${editing ? ' bldr-iframe--updating' : ''}${isPlayMode ? ' bldr-iframe--play' : ''}${editModeOn ? ' bldr-iframe--editmode' : ''}`}
                title="Project preview"
                sandbox="allow-scripts allow-forms allow-pointer-lock"
              />
            </div>
            </div>
  );
}

export function studioView12(studio) {
  const { guestDraftRecovered, handleSaveProject, onTab, user } = studio;
  return (
    !user && (onTab('keep') || (guestDraftRecovered && onTab('play'))) && (
              <aside id="guest-project-recovery" className={`bldr-guest-backup${guestDraftRecovered ? ' is-recovered' : ''}`} aria-label="Guest project recovery">
                {/* This card carried a 23-word storage lecture — "It stays
                    only on this device for up to 7 days. Keep it in a free
                    account to use it on another device." — the single
                    wordiest thing on any first screen, written for a lawyer
                    and shown to a seven-year-old. Same facts, twelve short
                    words, and the button says the rest. */}
                <div>
                  <strong>
                    {guestDraftRecovered
                      ? 'Welcome back! Your game is still here.'
                      : 'Saved in this browser.'}
                  </strong>
                  <span>
                    Only on this computer, for 7 days.
                  </span>
                </div>
                <button type="button" onClick={handleSaveProject}>
                  Keep it forever, free
                </button>
              </aside>
            )
  );
}
