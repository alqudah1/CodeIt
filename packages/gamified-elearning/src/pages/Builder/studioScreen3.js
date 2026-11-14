/* eslint-disable no-useless-escape -- fallback project templates intentionally preserve escaped HTML/JS */
// Part 3 of the studio's screen. Each function here is a piece of what Builder() draws, moved out
// word for word. It is handed, as one object, exactly the names it used there. Not a component:
// Builder() calls it while drawing, so nothing about how the page updates has changed.
// See Builder.js for why the studio is in parts.
import { EDIT_STEPS, friendlyWait, getEasyEditIdeas, rgbToHex, timeAgo } from './studioKit2';
import Icon from '../../components/Icon/Icon';
import { Link } from 'react-router-dom';
import { MISSIONS_ENABLED } from './studioKit1';
import { conceptSummary } from './codeConcepts';
import { canRedo as historyCanRedo, canUndo as historyCanUndo, undoLabel as historyUndoLabel } from './editHistory';
import { trackEvent } from '../../utils/trackEvent';

export function studioView18(studio) {
  const { editing, handleMissionClick, missionActive, missions, onTab } = studio;
  return (
    MISSIONS_ENABLED && onTab('play') && missions.length > 0 && (
              <div className="bldr-missions">
                <span className="bldr-missions__label">Upgrade missions</span>
                <div className="bldr-missions__row">
                  {missions.map(m => (
                    <button
                      key={m}
                      className={`bldr-mission-btn${missionActive === m ? ' bldr-mission-btn--active' : ''}`}
                      onClick={() => handleMissionClick(m)}
                      disabled={editing || !!missionActive}
                    >
                      {missionActive === m
                        ? <><span className="bldr-spinner bldr-spinner--sm" />Upgrading your project...</>
                        : m}
                    </button>
                  ))}
                </div>
              </div>
            )
  );
}

export function studioView19(studio) {
  const { editing, handleModifier, ideasForThisProject, onTab } = studio;
  return (
    onTab('change') && ideasForThisProject.length > 0 && (
              <div className="bldr-ideas">
                <p className="bldr-ideas__label">Not sure what to change? Try one of these.</p>
                <ul className="bldr-ideas__list">
                  {ideasForThisProject.map(idea => (
                    <li key={idea.id}>
                      <button
                        type="button"
                        className="bldr-idea"
                        onClick={() => handleModifier(idea.prompt)}
                        disabled={editing}
                      >
                        <span className="bldr-idea__label">{idea.label}</span>
                        <span className="bldr-idea__why">{idea.why}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
  );
}

export function studioView20(studio) {
  const { builtPrompt, hasResult, setPrompt, setShowStartOver, showStartOver } = studio;
  return (
    hasResult && (
              <button
                type="button"
                className="bldr-startover"
                onClick={() => setShowStartOver(open => {
                  const opening = !open;
                  // Opening this box used to leave the last idea in the
                  // textarea, so a child typing their second idea sent
                  // "a game where a cat jumps over boxesa website about my
                  // dog Rex" as one prompt without ever seeing it happen.
                  // Closing it puts their idea back, because changing your
                  // mind about starting over should not cost you your words.
                  setPrompt(opening ? '' : builtPrompt);
                  return opening;
                })}
                aria-expanded={showStartOver}
              >
                {showStartOver ? 'Back to my project' : '+ Make something else'}
              </button>
            )
  );
}

export function studioView21(studio) {
  const { aiTitle, allVersions, code, editModeOn, editing, explaining, fetchServerVersions, friendLink, friendStatus, handleCopyPublicLink, handleExplain, handleNewBuild, handlePublish, handleSaveOrGuide, handleSaveProject, handleSendToFriend, handleShare, handleUnpublish, hasTestedLatest, isPersonalized, isPublished, isSaved, isStarter, justPublished, onTab, publicId, publishRefusal, publishStatus, restoringVersion, saveActionLabel, saveStatus, savedProjectId, setEditError, setJustPublished, setShowEditPanel, setShowHistory, shareStatus, showEditPanel, showHistory, studioBest, toggleEditMode, token, user } = studio;
  return (
    <div className="bldr-result__footer">
              {onTab('learn') && <button
                className="bldr-action-btn bldr-action-btn--explain-primary"
                onClick={handleExplain}
                disabled={explaining || editing}
              >
                {explaining
                  ? <><span className="bldr-spinner bldr-spinner--sm" />Explaining...</>
                  : 'How does this work?'}
              </button>}

              {/* ── IT'S LIVE ─────────────────────────────────────────────
                  The one moment worth a fuss. The link is shown in full and
                  said out loud as what it is — a page on the real internet
                  that anyone can open — because that sentence is the whole
                  reason a child wanted to publish. "Send it to someone" uses
                  the device share sheet where one exists, and every friend
                  who opens it lands on the share page where Pixel makes them
                  the offer. The card stays until the child closes it: pride
                  does not expire after three seconds. */}
              {onTab('keep') && isPublished && justPublished && (
                <div className="bldr-live-card" role="status">
                  <div className="bldr-live-card__burst" aria-hidden="true">
                    <i /><i /><i /><i /><i /><i /><i /><i />
                  </div>
                  <img className="bldr-live-card__pixel" src="/brand/pixel-guide.png" alt="" />
                  <div className="bldr-live-card__copy">
                    <span className="bldr-live-card__kicker">IT'S LIVE!</span>
                    <strong className="bldr-live-card__title">
                      {aiTitle || 'Your project'} is on the internet now.
                    </strong>
                    <p className="bldr-live-card__line">
                      Anyone you send this link to can play it right now, no app, no account.
                    </p>
                    <code className="bldr-live-card__url">codeitlearn.com/project/{publicId}</code>
                    <div className="bldr-live-card__actions">
                      <button
                        type="button"
                        className="bldr-action-btn bldr-action-btn--primary"
                        onClick={() => { handleShare(); void trackEvent('publish_celebrate_share', null, token); }}
                      >
                        {shareStatus === 'shared' ? 'Sent!' : shareStatus === 'copied' ? 'Link copied!' : 'Send it to someone'}
                      </button>
                      <button
                        type="button"
                        className="bldr-action-btn"
                        onClick={() => setJustPublished(false)}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {onTab('keep') && (isPublished ? (
                <div className="bldr-share-group">
                  <button
                    className="bldr-action-btn bldr-action-btn--publish"
                    onClick={handleShare}
                    disabled={editing}
                  >
                    {shareStatus === 'shared' ? 'Shared!'
                      : shareStatus === 'copied' ? 'Link copied!'
                      : 'Share project'}
                  </button>
                  <button
                    className="bldr-action-btn bldr-action-btn--published"
                    onClick={handleCopyPublicLink}
                    disabled={editing}
                    title={`https://codeitlearn.com/project/${publicId}`}
                  >
                    {publishStatus === 'copied' ? 'Link copied!'
                      : publishStatus === 'error' ? 'Copy failed'
                      : 'Copy link'}
                  </button>
                  <button
                    className="bldr-action-btn bldr-action-btn--unpublish"
                    onClick={handleUnpublish}
                    disabled={editing}
                    title="Make project private"
                  >
                    Unpublish
                  </button>
                </div>
              ) : (
                <button
                  className="bldr-action-btn bldr-action-btn--publish"
                  onClick={handlePublish}
                  disabled={editing || publishStatus === 'publishing' || user?.managedProfile || !isSaved || !isPersonalized || !hasTestedLatest}
                  title={user?.managedProfile ? 'Parent-managed learner projects stay private' : 'Get a public link anyone can open'}
                >
                  {publishStatus === 'publishing'
                    ? <><span className="bldr-spinner bldr-spinner--sm" />Publishing...</>
                    : publishStatus === 'refused' ? 'Kept private'
                    : publishStatus === 'error' ? 'Try again'
                    : user?.managedProfile ? 'Private profile' : 'Share'}
                </button>
              ))}

              {/* ── Send it to a friend ──────────────────────────────────
                  Available the moment something exists, with no account, no
                  save and no publish in front of it. Publishing is still
                  there and still does more: it puts the project in Explore,
                  counts plays, and lets other children remix it. This is the
                  smaller thing a child actually asked for. */}
              {code && !isStarter && !isPublished && (
                <div className="bldr-friend">
                  <button
                    className="bldr-action-btn bldr-action-btn--friend"
                    onClick={handleSendToFriend}
                    disabled={editing || friendStatus === 'making'}
                  >
                    {friendStatus === 'making'
                      ? <><span className="bldr-spinner bldr-spinner--sm" />Making a link...</>
                      : friendStatus === 'error' ? 'Try again'
                      : friendStatus === 'ready' ? 'Link copied. Send it!'
                      : studioBest > 0 ? `Challenge a friend to beat ${studioBest}`
                      : 'Send it to a friend'}
                  </button>
                  {friendLink && (
                    <p className="bldr-friend__link" role="status">
                      <span className="bldr-friend__url">{friendLink}</span>
                      <span className="bldr-friend__note">
                        Anyone with this link can play it. It is not listed anywhere and it does not
                        need an account.
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* The reason, in the server's own words, and it stays put. It
                  used to vanish after three seconds — long enough to be seen
                  and not long enough to be read by a seven-year-old. */}
              {publishRefusal && (
                <p className="bldr-publish-note" role="status">
                  <Icon name="lock" size={18} />
                  <span>
                    {publishRefusal.message}
                    {publishRefusal.code === 'PLAN_UPGRADE_REQUIRED' && (
                      <>{' '}<Link
                        to="/pricing#codeit-plus"
                        onClick={() => void trackEvent('upgrade_click', 'publish-refused', token)}
                      >See CodeIt Plus</Link></>
                    )}
                  </span>
                </p>
              )}

              {onTab('change') && <button
                className={`bldr-action-btn bldr-action-btn--edit${showEditPanel ? ' bldr-action-btn--edit-active' : ''}`}
                onClick={() => { setShowEditPanel(p => !p); setEditError(''); if (editModeOn) toggleEditMode(); }}
                disabled={editing}
              >
                {/* This said "Change my project" too, which is the exact
                    label on the activation card's primary button four screens
                    up. One name, two different panels: that one opens the
                    colour and font controls, this one opens the box where you
                    ask for a change in words. The emoji in front of the other
                    one was all that told them apart, and emoji are on their
                    way out of this interface. */}
                {showEditPanel ? 'Close changes' : 'Ask for a change'}
              </button>}

              {onTab('change') && <button
                className={`bldr-action-btn bldr-action-btn--livedit${editModeOn ? ' bldr-action-btn--livedit-active' : ''}`}
                onClick={toggleEditMode}
                disabled={editing}
                title={editModeOn ? 'Stop changing things. Your changes are kept' : 'Tap anything in your project to change its words, colour or size'}
              >
                {/* "Edit elements" meant nothing to the children who asked
                    how to edit. This says what happens. */}
                {editModeOn ? 'Stop changing things' : 'Tap things to change them'}
              </button>}

              {onTab('keep') && <button
                className={`bldr-action-btn bldr-action-btn--history${showHistory ? ' bldr-action-btn--history-active' : ''}`}
                onClick={() => {
                  const next = !showHistory;
                  setShowHistory(next);
                  if (next) { setShowEditPanel(false); if (savedProjectId) fetchServerVersions(savedProjectId); }
                }}
                disabled={editing || restoringVersion}
              >
                History{allVersions.length > 0 ? ` (${allVersions.length})` : ''}
              </button>}

              {onTab('keep') && (user ? (
                <button
                  className={`bldr-action-btn bldr-action-btn--save${saveStatus === 'saved' ? ' bldr-action-btn--saved' : ''}`}
                  onClick={handleSaveOrGuide}
                  disabled={saveStatus === 'saving' || isSaved || editing}
                  title={saveActionLabel}
                >
                  {saveStatus === 'saving' && <><span className="bldr-spinner bldr-spinner--sm" />Saving...</>}
                  {saveStatus === 'saved'  && 'Saved!'}
                  {saveStatus === 'error'  && 'Try again'}
                  {!saveStatus && (isSaved ? 'Saved' : saveActionLabel)}
                </button>
              ) : (
                <button className="bldr-action-btn bldr-action-btn--login-hint" onClick={handleSaveProject} disabled={!isPersonalized || !hasTestedLatest}>
                  Log in to save
                </button>
              ))}

              <button className="bldr-action-btn bldr-action-btn--new" onClick={handleNewBuild} disabled={editing}>
                New project
              </button>
            </div>
  );
}

export function studioView22(studio) {
  const { applyEdit, editError, editInstruction, editRef, editRetrySeconds, editStep, editing, handleEditKeyDown, handleUndoEdit, onTab, openStudioTool, previousCode, projectType, promptHistory, setEditError, setEditInstruction, setHasPlayedOnce, setHasTestedLatest, setIsPlayMode, setShowEditPanel, showEditPanel } = studio;
  return (
    onTab('change') && showEditPanel && (
              <div className="bldr-edit-panel">
                <div className="bldr-edit-panel__header">
                  <span className="bldr-edit-panel__title">What should we change?</span>
                  {promptHistory.length > 0 && (
                    <span className="bldr-edit-panel__badge">We remember {promptHistory.length} change{promptHistory.length > 1 ? 's' : ''}</span>
                  )}
                </div>

                <div className="bldr-edit-panel__guide" role="group" aria-label="How to change your project">
                  <span><b>1</b> Pick an idea</span>
                  <span><b>2</b> Press the orange button</span>
                  <span><b>3</b> Play it again</span>
                </div>

                <div className="bldr-edit-panel__ideas" aria-label="Easy change ideas">
                  {getEasyEditIdeas(projectType).map(idea => (
                    <button
                      key={idea.label}
                      type="button"
                      className="bldr-edit-panel__idea"
                      onClick={() => { setEditInstruction(idea.instruction); setEditError(''); }}
                      disabled={editing}
                    >
                      {/* These are icon names. Printed as text, the button read
                          "palette Change the colours" (28 October, live). */}
                      <Icon name={idea.icon} size={18} />{idea.label}
                    </button>
                  ))}
                </div>

                <div className="bldr-edit-panel__input-wrap">
                  <label className="bldr-edit-panel__label" htmlFor="codeit-change-box">Or type your own idea</label>
                  <textarea
                    id="codeit-change-box"
                    ref={editRef}
                    className="bldr-edit-panel__textarea"
                    placeholder="Example: Make the game blue and add stars"
                    value={editInstruction}
                    onChange={e => setEditInstruction(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    rows={3}
                    disabled={editing}
                  />
                  <div className="bldr-textarea-hint">Tell CodeIt one change at a time</div>
                </div>

                {editError === 'AI_LIMIT' && (
                  <div className="bldr-edit-panel__pause" role="status">
                    <Icon name="wand" size={22} className="bldr-edit-panel__pause-icon" />
                    <div>
                      <p className="bldr-edit-panel__pause-title">Your project is safe!</p>
                      <p>Pixel needs a break. Try it again in <strong>{friendlyWait(editRetrySeconds)}</strong>.</p>
                      <p>You can keep playing or change the colours while you wait.</p>
                    </div>
                    <div className="bldr-edit-panel__pause-actions">
                      <button type="button" onClick={() => { setIsPlayMode(true); setHasPlayedOnce(true); setHasTestedLatest(true); setShowEditPanel(false); }}>▶ Play my project</button>
                      <button type="button" onClick={() => { openStudioTool('colors'); setShowEditPanel(false); }}><Icon name="palette" size={18} /> Change colours</button>
                    </div>
                  </div>
                )}

                {editError && editError !== 'AI_LIMIT' && (
                  <div className="bldr-edit-panel__error-block">
                    <p className="bldr-edit-panel__error-main">
                      We could not make that change.{previousCode ? ' Your project is still safe.' : ''}
                    </p>
                    <p className="bldr-edit-panel__error-detail">{editError}</p>
                    {previousCode && (
                      <button className="bldr-edit-panel__restore-btn" onClick={handleUndoEdit} disabled={editing}>
                        Restore last working version
                      </button>
                    )}
                  </div>
                )}

                <div className="bldr-edit-panel__actions">
                  <button
                    className="bldr-edit-panel__apply-btn"
                    onClick={() => applyEdit(editInstruction)}
                    disabled={!editInstruction.trim() || editing || editRetrySeconds > 0}
                  >
                    {editing
                      ? <><span className="bldr-spinner bldr-spinner--btn" />{EDIT_STEPS[editStep] || 'Applying...'}...</>
                      : editRetrySeconds > 0
                        ? `Wait ${friendlyWait(editRetrySeconds)}`
                        : 'Make my change'}
                  </button>

                  {previousCode && !editError && (
                    <button className="bldr-edit-panel__undo-btn" onClick={handleUndoEdit} disabled={editing}>
                      Undo last change
                    </button>
                  )}
                </div>
              </div>
            )
  );
}

export function studioView23(studio) {
  const { activeVersionId, allVersions, handleForkProject, historyLoading, onTab, restoreVersion, restoringVersion, saveVersionToServer, savedProjectId, showHistory } = studio;
  return (
    onTab('keep') && showHistory && (
              <div className="bldr-history-panel">
                <div className="bldr-history-panel__header">
                  <span className="bldr-history-panel__title">Version History</span>
                  <div className="bldr-history-panel__header-actions">
                    {savedProjectId && (
                      <button
                        className="bldr-history-save-btn"
                        onClick={() => saveVersionToServer('Manual save')}
                        disabled={historyLoading}
                      >
                        Save snapshot
                      </button>
                    )}
                    {savedProjectId && (
                      <button
                        className="bldr-history-fork-btn"
                        onClick={handleForkProject}
                        title="Duplicate this project"
                      >
                        Duplicate
                      </button>
                    )}
                    {historyLoading && <span className="bldr-spinner bldr-spinner--sm" />}
                  </div>
                </div>

                {allVersions.length === 0 ? (
                  <p className="bldr-history-empty">
                    Versions are auto-saved after each build and edit. Nothing yet.
                  </p>
                ) : (
                  <div className="bldr-history-list">
                    {allVersions.map((version) => {
                      const isCurrent = version.id === activeVersionId;
                      return (
                        <div
                          key={version.id}
                          className={`bldr-version-card${isCurrent ? ' bldr-version-card--current' : ''}`}
                        >
                          <div
                            className="bldr-version-card__swatch"
                            style={{ background: `linear-gradient(135deg, ${version.primary} 0%, ${version.accent} 100%)` }}
                          />
                          <div className="bldr-version-card__body">
                            <div className="bldr-version-card__row">
                              <span className="bldr-version-card__label">{version.label}</span>
                              {isCurrent && (
                                <span className="bldr-version-card__badge">Current</span>
                              )}
                              {!version.isLocal && (
                                <span className="bldr-version-card__badge bldr-version-card__badge--saved">Saved</span>
                              )}
                            </div>
                            <div className="bldr-version-card__meta">
                              {version.title && (
                                <span className="bldr-version-card__name">{version.title}</span>
                              )}
                              <span className="bldr-version-card__time">{timeAgo(version.createdAt)}</span>
                            </div>
                          </div>
                          {!isCurrent && (
                            <button
                              className="bldr-version-card__restore-btn"
                              onClick={() => restoreVersion(version)}
                              disabled={restoringVersion}
                            >
                              {restoringVersion
                                ? <span className="bldr-spinner bldr-spinner--sm" />
                                : 'Restore'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )
  );
}

export function studioView24(studio) {
  const { editHistory, editModeOn, onTab, redoHandEdit, undoHandEdit } = studio;
  return (
    onTab('change') && editModeOn && (historyCanUndo(editHistory) || historyCanRedo(editHistory)) && (
              <div className="bldr-hand-undo">
                <button
                  className="bldr-hand-undo__btn"
                  onClick={undoHandEdit}
                  disabled={!historyCanUndo(editHistory)}
                  title={historyUndoLabel(editHistory) ? `Undo: ${historyUndoLabel(editHistory)}` : 'Nothing to undo'}
                >
                  ↩ Undo{historyUndoLabel(editHistory) ? `. ${historyUndoLabel(editHistory)}` : ''}
                </button>
                <button
                  className="bldr-hand-undo__btn bldr-hand-undo__btn--quiet"
                  onClick={redoHandEdit}
                  disabled={!historyCanRedo(editHistory)}
                  title="Redo"
                >
                  ↪ Redo
                </button>
              </div>
            )
  );
}

export function studioView25(studio) {
  const { editModeOn, gameSettings, onTab, openStudioTool, selectedEl, sendBridgeCmd, setShowElPanel, showElPanel } = studio;
  return (
    onTab('change') && editModeOn && showElPanel && selectedEl
              && selectedEl.tag === 'CANVAS' && gameSettings.length > 0 && (
              <div className="bldr-el-panel bldr-el-panel--game">
                <div className="bldr-el-panel__header">
                  <span className="bldr-el-panel__title">Your game</span>
                  <button
                    className="bldr-el-panel__close"
                    onClick={() => { setShowElPanel(false); sendBridgeCmd('DESELECT'); }}
                  >
                    ×
                  </button>
                </div>
                <p className="bldr-el-panel__hint">
                  These are the settings inside this game. Move one and watch it change.
                </p>
                <button
                  type="button"
                  className="bldr-el-panel__jump"
                  onClick={() => { openStudioTool('gameplay'); setShowElPanel(false); sendBridgeCmd('DESELECT'); }}
                >
                  Open the controls
                </button>
              </div>
            )
  );
}

export function studioView26(studio) {
  const { aiRefineText, applyElStyleChange, applyElTextChange, editModeOn, elAnim, elBgColor, elColor, elPadding, elPanelTab, elText, elementAction, gameSettings, handleAiRefine, onTab, patchError, patchLoading, selectedEl, sendBridgeCmd, setAiRefineText, setElAnim, setElBgColor, setElColor, setElPadding, setElPanelTab, setElText, setShowElPanel, showElPanel } = studio;
  return (
    onTab('change') && editModeOn && showElPanel && selectedEl
              && !(selectedEl.tag === 'CANVAS' && gameSettings.length > 0) && (
              <div className="bldr-el-panel">
                <div className="bldr-el-panel__header">
                  <span className="bldr-el-panel__title">
                    Editing &lt;{selectedEl.tag}&gt;
                  </span>
                  <button
                    className="bldr-el-panel__close"
                    onClick={() => { setShowElPanel(false); sendBridgeCmd('DESELECT'); }}
                  >
                    ×
                  </button>
                </div>

                <div className="bldr-el-verbs" role="group" aria-label="Change this element">
                  <button
                    className="bldr-el-verb"
                    onClick={() => elementAction('RESIZE', 'Made it bigger', { factor: 1.25 })}
                    title="Make it bigger"
                  >
                    <span aria-hidden="true">＋</span> Bigger
                  </button>
                  <button
                    className="bldr-el-verb"
                    onClick={() => elementAction('RESIZE', 'Made it smaller', { factor: 0.8 })}
                    title="Make it smaller"
                  >
                    <span aria-hidden="true">－</span> Smaller
                  </button>
                  <button
                    className="bldr-el-verb"
                    onClick={() => elementAction('DUPLICATE', 'Made another one')}
                    title="Make another one just like it"
                  >
                    <span aria-hidden="true">⧉</span> Copy
                  </button>
                  <button
                    className="bldr-el-verb bldr-el-verb--danger"
                    onClick={() => elementAction('DELETE', 'Deleted it')}
                    title="Remove it. You can undo this"
                  >
                    <Icon name="trash" size={16} /> Delete
                  </button>
                </div>

                <div className="bldr-el-panel__tabs">
                  {selectedEl.isText && (
                    <button
                      className={`bldr-el-tab${elPanelTab === 'text' ? ' bldr-el-tab--active' : ''}`}
                      onClick={() => setElPanelTab('text')}
                    >Text</button>
                  )}
                  <button
                    className={`bldr-el-tab${elPanelTab === 'colors' ? ' bldr-el-tab--active' : ''}`}
                    onClick={() => setElPanelTab('colors')}
                  >Colours</button>
                  <button
                    className={`bldr-el-tab${elPanelTab === 'spacing' ? ' bldr-el-tab--active' : ''}`}
                    onClick={() => setElPanelTab('spacing')}
                  >Spacing</button>
                  <button
                    className={`bldr-el-tab${elPanelTab === 'animation' ? ' bldr-el-tab--active' : ''}`}
                    onClick={() => setElPanelTab('animation')}
                  >Animation</button>
                  <button
                    className={`bldr-el-tab${elPanelTab === 'ai' ? ' bldr-el-tab--active' : ''}`}
                    onClick={() => setElPanelTab('ai')}
                  >Prompt</button>
                </div>

                <div className="bldr-el-panel__body">
                  {elPanelTab === 'text' && selectedEl.isText && (
                    <div className="bldr-el-field">
                      <label className="bldr-el-label">Text content</label>
                      <textarea
                        className="bldr-el-textarea"
                        value={elText}
                        onChange={e => setElText(e.target.value)}
                        rows={3}
                      />
                      <button className="bldr-el-apply-btn" onClick={applyElTextChange}>
                        Apply text
                      </button>
                    </div>
                  )}

                  {elPanelTab === 'colors' && (
                    <div className="bldr-el-field-group">
                      <div className="bldr-el-field">
                        <label className="bldr-el-label">Text color</label>
                        <div className="bldr-el-color-row">
                          <input
                            type="color"
                            className="bldr-el-color-input"
                            aria-label="Text color"
                            value={rgbToHex(elColor)}
                            onChange={e => { setElColor(e.target.value); applyElStyleChange({ color: e.target.value }); }}
                          />
                          <span className="bldr-el-color-val">{elColor}</span>
                        </div>
                      </div>
                      <div className="bldr-el-field">
                        <label className="bldr-el-label">Background color</label>
                        <div className="bldr-el-color-row">
                          <input
                            type="color"
                            className="bldr-el-color-input"
                            aria-label="Background color"
                            value={rgbToHex(elBgColor)}
                            onChange={e => { setElBgColor(e.target.value); applyElStyleChange({ backgroundColor: e.target.value }); }}
                          />
                          <span className="bldr-el-color-val">{elBgColor}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {elPanelTab === 'spacing' && (
                    <div className="bldr-el-field">
                      <label className="bldr-el-label">Padding: {elPadding}px</label>
                      <input
                        type="range"
                        className="bldr-el-range"
                        aria-label="Padding"
                        min={0}
                        max={80}
                        value={elPadding}
                        onChange={e => {
                          setElPadding(e.target.value);
                          applyElStyleChange({ padding: e.target.value + 'px' });
                        }}
                      />
                      <label className="bldr-el-label" style={{ marginTop: 12 }}>Font size: {selectedEl.styles?.fs || '16px'}</label>
                      <input
                        type="range"
                        className="bldr-el-range"
                        aria-label="Font size"
                        min={10}
                        max={72}
                        defaultValue={parseInt(selectedEl.styles?.fs) || 16}
                        onChange={e => applyElStyleChange({ fontSize: e.target.value + 'px' })}
                      />
                    </div>
                  )}

                  {elPanelTab === 'animation' && (
                    <div className="bldr-el-field">
                      <label className="bldr-el-label">Animation preset</label>
                      <div className="bldr-el-anim-grid">
                        {[
                          { label: 'None',   value: '' },
                          { label: 'Pulse',  value: 'pulse 1s infinite' },
                          { label: 'Bounce', value: 'bounce 0.6s infinite' },
                          { label: 'Shake',  value: 'shake 0.5s infinite' },
                          { label: 'Float',  value: 'float 3s ease-in-out infinite' },
                          { label: 'Glow',   value: 'glow 2s infinite' },
                        ].map(a => (
                          <button
                            key={a.value}
                            className={`bldr-el-anim-btn${elAnim === a.value ? ' bldr-el-anim-btn--active' : ''}`}
                            onClick={() => {
                              setElAnim(a.value);
                              applyElStyleChange({ animation: a.value || 'none' });
                            }}
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {elPanelTab === 'ai' && (
                    <div className="bldr-el-field">
                      <label className="bldr-el-label">Describe the change for this element</label>
                      <textarea
                        className="bldr-el-textarea"
                        value={aiRefineText}
                        onChange={e => setAiRefineText(e.target.value)}
                        placeholder="e.g. make this button bigger, add an emoji, change the wording"
                        rows={3}
                        disabled={patchLoading}
                      />
                      {patchError && <p className="bldr-el-error">{patchError}</p>}
                      <button
                        className="bldr-el-apply-btn"
                        onClick={handleAiRefine}
                        disabled={!aiRefineText.trim() || patchLoading}
                      >
                        {patchLoading
                          ? <><span className="bldr-spinner bldr-spinner--sm" />Refining...</>
                          : 'Apply described change'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
  );
}

export function studioView27(studio) {
  const { conceptsFound, onTab, token } = studio;
  return (
    onTab('learn') && conceptsFound.length > 0 && (
              <div className="bldr-lessons-used">
                <div className="bldr-lessons-used__header">
                  <span className="bldr-lessons-used__title">What you used in this project</span>
                  <span className="bldr-lessons-used__sub">
                    {conceptSummary(conceptsFound)} Tap any one to learn it properly.
                  </span>
                </div>
                <div className="bldr-concept-list">
                  {conceptsFound.map(concept => (
                    <div key={concept.id} className="bldr-concept">
                      <div className="bldr-concept__head">
                        <span className="bldr-concept__name">{concept.label}</span>
                        {concept.count > 1 && (
                          <span className="bldr-concept__count">{concept.count} times</span>
                        )}
                      </div>
                      <p className="bldr-concept__what">{concept.what}</p>

                      {/* Their line, not an example. This is the whole point:
                          a child can go and look at it. */}
                      <div className="bldr-concept__proof">
                        <span className="bldr-concept__line">Line {concept.line}</span>
                        <code className="bldr-concept__code">{concept.snippet}</code>
                      </div>

                      <p className="bldr-concept__note">{concept.note}</p>
                      <Link
                        to={`/lesson/${concept.lessonId}`}
                        className="bldr-lesson-chip__learn"
                        onClick={() => void trackEvent('learn_the_code_behind', null, token)}
                      >
                        Learn {concept.lessonTitle}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )
  );
}

export function studioView28(studio) {
  const { editModeOn, editing, gameSettings, handleSaveOrGuide, handleTogglePlay, hasResult, isPlayMode, isSaved, openStudioTool, saveStatus, setEditError, setShowEditPanel, setWorkspaceTab, toggleEditMode, user } = studio;
  return (
    hasResult && (
          <div className="bldr-mobile-play-bar">
            <button
              className="bldr-mobile-play-bar__btn bldr-mobile-play-bar__btn--play"
              onClick={handleTogglePlay}
            >
              {isPlayMode ? 'Compact' : 'Play'}
            </button>
            <button
              className="bldr-mobile-play-bar__btn bldr-mobile-play-bar__btn--edit"
              onClick={() => {
                // Everything this button opens lives on the Change tab. Without
                // this line, tapping Edit from Play or Keep flipped some state
                // and showed the child nothing — the commonest kind of dead end
                // on a phone, and completely silent.
                setWorkspaceTab('change');
                if (gameSettings.length > 0) {
                  // A game with real settings: go straight to the controls
                  // rather than to a text box asking them to describe a change.
                  openStudioTool('gameplay');
                  setShowEditPanel(false);
                } else {
                  setShowEditPanel(p => !p);
                }
                setEditError('');
                if (editModeOn) toggleEditMode();
              }}
              disabled={editing}
            >
              {gameSettings.length > 0 ? 'Controls' : 'Edit'}
            </button>
            <button
              className="bldr-mobile-play-bar__btn bldr-mobile-play-bar__btn--save"
              onClick={handleSaveOrGuide}
              disabled={saveStatus === 'saving' || isSaved || editing}
              aria-label={user ? 'Save project' : 'Save project to a free account'}
            >
              {isSaved ? 'Saved' : 'Save'}
            </button>
          </div>
        )
  );
}
