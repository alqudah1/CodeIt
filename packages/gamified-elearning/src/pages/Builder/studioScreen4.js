/* eslint-disable no-useless-escape -- fallback project templates intentionally preserve escaped HTML/JS */
// Part 4 of the studio's screen. Each function here is a piece of what Builder() draws, moved out
// word for word. It is handed, as one object, exactly the names it used there. Not a component:
// Builder() calls it while drawing, so nothing about how the page updates has changed.
// See Builder.js for why the studio is in parts.
import { CONFETTI_COLORS, timeAgo } from './studioKit2';
import Icon from '../../components/Icon/Icon';
import { STUDIO_TOOLS, getProjectGradient } from './studioKit1';
import { displayTitle } from '../../utils/displayTitle';

export function studioView29(studio) {
  const { favoriteIds, handleDeleteProject, handleLoadProject, handlePublishSavedProject, handleShareSavedProject, projectCardAction, projectOpenError, projectOpeningId, projectSort, projectsLoading, savedProjects, setProjectSort, sortedProjects, toggleFavorite, user } = studio;
  return (
    user && (
          <section id="my-creations" className="bldr-projects" aria-label="My saved projects">
            <div className="bldr-projects__header">
              <h2 className="bldr-projects__title">My projects</h2>
              {savedProjects.length > 0 && (
                <span className="bldr-projects__count">{savedProjects.length}</span>
              )}
            </div>

            {savedProjects.length > 1 && (
              <div className="bldr-projects__sort">
                {[
                  { id: 'recent',  label: 'All' },
                  { id: 'game',    label: 'Games' },
                  { id: 'website', label: 'Websites' },
                  { id: 'quiz',    label: 'Quizzes' },
                  { id: 'tool',    label: 'Tools' },
                ].map(s => (
                  <button
                    key={s.id}
                    className={`bldr-sort-btn${projectSort === s.id ? ' bldr-sort-btn--active' : ''}`}
                    onClick={() => setProjectSort(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {projectsLoading && (
              <div className="bldr-projects__loading">
                <span className="bldr-spinner" />
                <span>Loading your projects...</span>
              </div>
            )}


            {!projectsLoading && savedProjects.length === 0 && (
              <div className="bldr-projects__loading">
                <span>Your first saved project will appear here. Start above, then save it when you are ready.</span>
              </div>
            )}
            {!projectsLoading && savedProjects.length > 0 && (
              <div className="bldr-projects__grid">
            {projectOpenError && (
              <p className="bldr-error-inline" role="alert">{projectOpenError}</p>
            )}
                {sortedProjects.map(project => (
                  <div key={project.id} className={`bldr-project-card${favoriteIds.has(project.id) ? ' bldr-project-card--fav' : ''}`}>
                    <div
                      className="bldr-project-card__thumb"
                      style={{ background: getProjectGradient(project.project_type) }}
                    >
                      <span className="bldr-project-card__thumb-initials">
                        {project.title.replace(/^(a |an |the )/i, '').slice(0, 2).toUpperCase()}
                      </span>
                      <button
                        className={`bldr-fav-btn${favoriteIds.has(project.id) ? ' bldr-fav-btn--on' : ''}`}
                        onClick={e => { e.stopPropagation(); toggleFavorite(project.id); }}
                        title={favoriteIds.has(project.id) ? 'Remove from favorites' : 'Mark as favorite'}
                        aria-label="Favorite"
                      >
                        {favoriteIds.has(project.id) ? '★' : '☆'}
                      </button>
                    </div>
                    <div className="bldr-project-card__body">
                      <div className="bldr-project-card__type">{project.project_type}</div>
                      <div className="bldr-project-card__name">{project.title}</div>
                      <div className="bldr-project-card__prompt">{project.prompt}</div>
                      <div className="bldr-project-card__date">Updated {timeAgo(project.updated_at || project.created_at)}</div>
                      {Boolean(project.is_public) && project.public_id && (
                        <div className="bldr-project-card__plays">
                          <Icon name="play" size={11} />{' '}
                          {Number(project.view_count) > 0
                            ? `${project.view_count} ${Number(project.view_count) === 1 ? 'play' : 'plays'}`
                            : 'No plays yet. Share your link'}
                          {Number(project.remix_count) > 0 && (
                            <span> · ⤴ {project.remix_count} remixed</span>
                          )}
                        </div>
                      )}
                      <div className={`bldr-project-card__visibility ${
                        project.is_public && project.public_id
                          ? 'bldr-project-card__visibility--live'
                          : 'bldr-project-card__visibility--private'
                      }`}>
                        <span>
                          {project.is_public && project.public_id
                            ? 'Live'
                            : user?.managedProfile ? 'Family private' : 'Private'}
                        </span>
                        <small>
                          {project.is_public && project.public_id
                            ? 'Anyone with the link can play'
                            : user?.managedProfile
                              ? 'Only your family account can open it'
                              : 'Publish when ready · unpublish anytime'}
                        </small>
                      </div>
                    </div>
                    <div className="bldr-project-card__actions">
                      <button
                        className="bldr-project-card__btn bldr-project-card__btn--load"
                        onClick={() => handleLoadProject(project)}
                        disabled={projectOpeningId !== null}
                        aria-busy={projectOpeningId === project.id}
                      >
                        {projectOpeningId === project.id ? 'Opening...' : 'Continue'}
                      </button>
                      {!user?.managedProfile && (
                        <button
                          className={`bldr-project-card__btn ${
                            project.is_public && project.public_id
                              ? 'bldr-project-card__btn--share'
                              : 'bldr-project-card__btn--publish'
                          }`}
                          onClick={() => (
                            project.is_public && project.public_id
                              ? handleShareSavedProject(project)
                              : handlePublishSavedProject(project)
                          )}
                          aria-label={`${
                            project.is_public && project.public_id ? 'Share' : 'Publish'
                          } ${project.title}`}
                          disabled={
                            projectOpeningId !== null
                            || ['publishing', 'sharing'].includes(projectCardAction.status)
                          }
                        >
                          {projectCardAction.id === project.id && projectCardAction.status === 'publishing'
                            ? 'Publishing…'
                            : projectCardAction.id === project.id && projectCardAction.status === 'sharing'
                              ? 'Sharing…'
                              : projectCardAction.id === project.id && projectCardAction.status === 'published'
                                ? 'Published!'
                                : projectCardAction.id === project.id && projectCardAction.status === 'shared'
                                  ? 'Shared!'
                                  : projectCardAction.id === project.id && projectCardAction.status === 'copied'
                                    ? 'Link copied!'
                                    : projectCardAction.id === project.id && projectCardAction.status === 'error'
                                      ? 'Try again'
                                      : project.is_public && project.public_id ? 'Share' : 'Publish'}
                        </button>
                      )}
                      <button
                        className="bldr-project-card__btn bldr-project-card__btn--delete"
                        onClick={() => handleDeleteProject(project.id)}
                        aria-label={`Delete ${project.title}`}
                        disabled={projectOpeningId !== null}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )
  );
}

export function studioView30(studio) {
  const { editing, gameSettings, hasResult, loading, openStudioTool, studioPanel } = studio;
  return (
    hasResult && !loading && (
          <div className="bldr-creator-toolbar">
            {STUDIO_TOOLS
              .filter(t => t.id !== 'gameplay' || gameSettings.length > 0)
              .map(tool => (
                <button
                  key={tool.id}
                  className={`bldr-creator-tool bldr-creator-tool--${tool.id}${studioPanel === tool.id ? ' bldr-creator-tool--active' : ''}`}
                  // This toolbar is fixed to the side of the window and shows on
                  // every page of the studio, but the panel it opens only renders
                  // on Change. Pressing a tool from Play used to set some state
                  // and show nothing — the desktop twin of the dead end the
                  // mobile Edit button had.
                  onClick={() => openStudioTool(tool.id)}
                  disabled={editing}
                  title={tool.desc || tool.label}
                >
                  <span className="bldr-creator-tool__dot" />
                  <span className="bldr-creator-tool__label">{tool.label}</span>
                </button>
              ))}
          </div>
        )
  );
}

export function studioView31(studio) {
  const { companionTip, companionVisible, setCompanionVisible, studioPanel, tipBlocked, toastsRef, xpPopup } = studio;
  return (
    <div className="bldr-toasts" aria-live="polite" ref={toastsRef}>
          {xpPopup && (
            <div key={xpPopup.id} className="bldr-xp-popup" role="status">
              {xpPopup.amount > 0 ? `+${xpPopup.amount} XP${xpPopup.reason ? `. ${xpPopup.reason}` : ''}` : xpPopup.reason}
            </div>
          )}
          {companionVisible && companionTip && !studioPanel && !tipBlocked && (
            <div className="bldr-companion">
              <div className="bldr-companion__bubble">
                <p className="bldr-companion__text">{companionTip}</p>
                <button
                  className="bldr-companion__close"
                  onClick={() => setCompanionVisible(false)}
                  aria-label="Dismiss tip"
                >×</button>
              </div>
            </div>
          )}
        </div>
  );
}

export function studioView32(studio) {
  const { handleSaveProject, naming, namingRef, projectName, setNaming } = studio;
  return (
    naming && (
          <div className="bldr-name" role="dialog" aria-modal="true" aria-labelledby="bldr-name-title">
            <form
              className="bldr-name__card"
              onSubmit={(e) => {
                e.preventDefault();
                const chosen = (naming.value || '').trim().slice(0, 60);
                setNaming(null);
                handleSaveProject({ name: chosen || displayTitle(projectName || 'My project') });
              }}
            >
              <p className="bldr-name__kicker">Almost saved</p>
              <h2 id="bldr-name-title">What is it called?</h2>
              <label className="bldr-name__label" htmlFor="bldr-name-input">Give it a name. Short is good.</label>
              <input
                id="bldr-name-input"
                ref={namingRef}
                className="bldr-name__input"
                type="text"
                maxLength={60}
                value={naming.value}
                onChange={(e) => setNaming({ value: e.target.value })}
                autoComplete="off"
              />
              <div className="bldr-name__actions">
                <button type="submit" className="bldr-name__save">Save it</button>
                <button type="button" className="bldr-name__cancel" onClick={() => setNaming(null)}>Not yet</button>
              </div>
            </form>
          </div>
        )
  );
}

export function studioView33(studio) {
  const { setShowWow, showWow, wowType } = studio;
  return (
    showWow && (
          <div className="bldr-wow-overlay" onClick={() => setShowWow(false)}>
            <div className="bldr-wow-confetti" aria-hidden="true">
              {Array.from({ length: 24 }, (_, i) => (
                <span
                  key={i}
                  className="bldr-wow-particle"
                  style={{
                    left: `${(i * 41 + 7) % 100}%`,
                    animationDelay: `${(i * 0.13) % 1.5}s`,
                    animationDuration: `${1.2 + (i % 5) * 0.28}s`,
                    background: CONFETTI_COLORS[i % 5],
                    width:  `${6 + (i % 4) * 3}px`,
                    height: `${6 + (i % 3) * 3}px`,
                    borderRadius: i % 3 === 0 ? '50%' : '2px',
                  }}
                />
              ))}
            </div>
            <div className="bldr-wow-content">
              <div className="bldr-wow-title">
                {/quiz/.test(wowType)
                  ? 'YOU BUILT A REAL QUIZ'
                  : /game|clicker|runner|memory|reaction/.test(wowType)
                  ? 'YOU BUILT A REAL GAME'
                  : /website|portfolio|restaurant|shop|sports|blog|landing/.test(wowType)
                  ? 'YOU BUILT A REAL WEBSITE'
                  : 'YOU BUILT SOMETHING REAL'}
              </div>
              <p className="bldr-wow-sub">Tap anywhere to continue</p>
            </div>
          </div>
        )
  );
}
