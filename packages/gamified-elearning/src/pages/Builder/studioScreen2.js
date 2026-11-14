/* eslint-disable no-useless-escape -- fallback project templates intentionally preserve escaped HTML/JS */
// Part 2 of the studio's screen. Each function here is a piece of what Builder() draws, moved out
// word for word. It is handed, as one object, exactly the names it used there. Not a component:
// Builder() calls it while drawing, so nothing about how the page updates has changed.
// See Builder.js for why the studio is in parts.
import { BACKGROUNDS, CORNERS, FONTS, TEXT_SIZES, optionsForGuideLevel, readProjectHeading } from './instantStyle';
import ChallengeCard from './ChallengeCard';
import { EFFECT_UPGRADES, FIRST_CHANGE_THEMES, PRESET_PALETTES, SETTING_COLOURS, STUDIO_TOOLS, TEXT_UPGRADES } from './studioKit1';
import Icon from '../../components/Icon/Icon';
import { Link } from 'react-router-dom';
import { colourSettings } from './paint';
import { hasPalette, whoAmI } from '../../utils/chests';
import { trackEvent } from '../../utils/trackEvent';

export function studioView13(studio) {
  const { behind, changeHint, code, editModeOn, editRef, editing, handleApplyColors, handleModifier, handleSaveProject, handleTogglePlay, hasPlayedOnce, hasTestedLatest, ideasForThisProject, isPersonalized, isSaved, ladderOffer, moreChanges, openInstantPanel, previewKeyRef, projectType, saveStatus, setLadderOffer, setMoreChanges, setShowEditPanel, setWorkspaceTab, shelfIdRef, toggleEditMode, token, user } = studio;
  return (
    !isSaved && (
              <>
                <ol className="bldr-steps" aria-label="Project steps">
                  <li className={hasPlayedOnce ? 'is-done' : 'is-current'}><button type="button" onClick={() => setWorkspaceTab('play')}>Play everything</button></li>
                  <li className={isPersonalized ? 'is-done' : hasPlayedOnce ? 'is-current' : ''}><button type="button" onClick={() => setWorkspaceTab('change')}>Change one thing</button></li>
                  <li className={isPersonalized && hasTestedLatest ? 'is-done' : isPersonalized ? 'is-current' : ''}><button type="button" onClick={() => setWorkspaceTab('play')}>Play it again</button></li>
                  <li className={isPersonalized && hasTestedLatest ? 'is-current' : ''}><button type="button" onClick={() => setWorkspaceTab('keep')}>Save your work</button></li>
                </ol>

                <section className="bldr-next" aria-labelledby="bldr-next-step-title">
                  <h3 id="bldr-next-step-title" className="bldr-next__title">
                    {!hasPlayedOnce
                      ? 'Play it first.'
                      : !isPersonalized
                        ? 'You played it. Now make it yours.'
                        : !hasTestedLatest
                          ? 'You changed it. Play it again.'
                          : 'It is yours. Save it.'}
                  </h3>

                  {/* What is behind the thing they changed, once they have. */}
                  {behind && (
                    <p className="bldr-change-hint bldr-change-hint--behind">
                      <Icon name="search" size={18} />
                      <span>{behind.sentence}</span>
                      <Link
                        to={`/lesson/${behind.lessonId}`}
                        className="bldr-change-hint__go"
                        onClick={() => void trackEvent('builder_look_inside', `lesson-${behind.lessonId}`, token)}
                      >
                        {behind.lessonLabel}
                      </Link>
                      {behind.rest && (
                        <button type="button" className="bldr-change-hint__rest" onClick={() => setWorkspaceTab('learn')}>
                          {behind.rest}
                        </button>
                      )}
                    </p>
                  )}

                  {/* Before anything is changed, one line points at something
                      real in their own project and invites them to change it.
                      The browser checks (first-five-minutes, complaints #6)
                      hold this to the file: the quoted thing must exist. */}
                  {!behind && changeHint && (!ladderOffer || !hasPlayedOnce) && (
                    <p className="bldr-change-hint">
                      <Icon name="hand" size={18} />
                      <span>{changeHint}</span>
                      <button
                        type="button"
                        className="bldr-change-hint__go"
                        onClick={() => { if (!editModeOn) toggleEditMode(); }}
                      >
                        {editModeOn ? 'Tap it now' : 'Let me try'}
                      </button>
                    </p>
                  )}

                  {!hasPlayedOnce && (
                    <div className="bldr-next__actions">
                      <button className="bldr-activation-card__primary" onClick={handleTogglePlay} data-codeit-coach="current"><Icon name="play" size={18} /> Play it now</button>
                    </div>
                  )}

                  {hasPlayedOnce && !isPersonalized && (
                    <>
                      {/* One suggestion, named in their own game. */}
                      <ChallengeCard
                        code={code}
                        projectKey={shelfIdRef.current || previewKeyRef.current || projectType}
                        onOffer={setLadderOffer}
                      />
                      <div className="bldr-next__actions">
                        <button
                          className="bldr-activation-card__primary"
                          onClick={openInstantPanel}
                          data-codeit-coach="current"
                          disabled={editing}
                        >
                          <Icon name="hand" size={18} /> Show me where
                        </button>
                        <button
                          type="button"
                          className="bldr-next__more"
                          aria-expanded={moreChanges}
                          onClick={() => setMoreChanges(v => !v)}
                        >
                          {moreChanges ? 'Fewer options' : 'Change something else'}
                        </button>
                      </div>

                      {/* Palettes: one row, no shouting label. The cheapest
                          win, and a child who does one does another. */}
                      <div className="bldr-next__palettes" role="group" aria-label="Colours">
                        <span className="bldr-next__palettes-label">Colours:</span>
                        {FIRST_CHANGE_THEMES.map(theme => (
                          <button
                            key={theme.name}
                            className="bldr-activation-theme"
                            type="button"
                            aria-label={`Apply ${theme.name} theme`}
                            onClick={() => handleApplyColors(theme.vars, theme.name)}
                            disabled={editing}
                          >
                            <span className="bldr-activation-theme__swatches" aria-hidden="true">
                              {theme.swatches.map(color => <span key={color} style={{ background: color }} />)}
                            </span>
                            <span>{theme.name}</span>
                          </button>
                        ))}
                      </div>

                      {moreChanges && (
                        <div className="bldr-next__rest">
                          {ideasForThisProject.length > 0 && (
                            <ul className="bldr-ideas__list">
                              {ideasForThisProject.slice(0, 3).map(idea => (
                                <li key={idea.id}>
                                  <button
                                    type="button"
                                    className="bldr-idea"
                                    onClick={() => { setWorkspaceTab('change'); handleModifier(idea.prompt); }}
                                  >
                                    <span className="bldr-idea__label">{idea.label}</span>
                                    <span className="bldr-idea__why">{idea.why}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="bldr-next__actions">
                            <button
                              className="bldr-activation-card__secondary"
                              type="button"
                              onClick={() => { setShowEditPanel(true); setTimeout(() => editRef.current?.focus(), 0); }}
                              disabled={editing}
                            >
                              <Icon name="chat" size={18} /> Describe a change in words
                            </button>
                            <button className="bldr-activation-card__secondary" type="button" onClick={() => setWorkspaceTab('change')}>
                              <Icon name="palette" size={18} /> Open the Change tab
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {isPersonalized && !hasTestedLatest && (
                    <div className="bldr-next__actions">
                      <button className="bldr-activation-card__primary" onClick={handleTogglePlay} data-codeit-coach="current"><Icon name="play" size={18} /> Play my changes</button>
                    </div>
                  )}

                  {isPersonalized && hasTestedLatest && (
                    <div className="bldr-next__actions">
                      <button
                        className="bldr-activation-card__primary"
                        onClick={handleSaveProject}
                        data-codeit-coach="current"
                        disabled={saveStatus === 'saving' || editing}
                      >
                        <Icon name="save" size={18} /> {saveStatus === 'saving' ? 'Saving…' : user ? 'Save my project' : 'Keep my project'}
                      </button>
                    </div>
                  )}
                </section>
              </>
            )
  );
}

export function studioView14(studio) {
  const { coachStage, editRef, editing, explaining, handleExplain, handlePublish, isPublished, isSaved, onTab, publishStatus, setShowEditPanel, token, user } = studio;
  return (
    onTab('keep') && isSaved && !isPublished && (
              <section className="bldr-activation-card bldr-activation-card--finish" aria-labelledby="bldr-finish-step-title">
                <div className="bldr-activation-card__copy">
                  <span className="bldr-activation-card__kicker">Quality check complete</span>
                  <h3 id="bldr-finish-step-title">
                    {user?.managedProfile
                      ? 'Great work. Show your grown-up or teacher.'
                      : 'Now your project is ready to publish.'}
                  </h3>
                  <p>
                    {user?.managedProfile
                      ? 'You played it, improved it, tested it, and saved it. Your family-private project is ready for review.'
                      : 'You played it, made it yours, tested the change, and saved it. Publishing creates a link other people can open.'}
                  </p>
                </div>
                <div className="bldr-activation-card__actions">
                  {user?.managedProfile ? (
                    <button
                      className="bldr-activation-card__primary"
                      onClick={() => {
                        void trackEvent('activation_next_step', 'learn', token);
                        handleExplain();
                      }}
                      data-codeit-coach={coachStage.target === 'learn' ? 'current' : undefined}
                      disabled={explaining || editing}
                    >
                      {explaining ? 'Opening explanation…' : 'Learn how it works'}
                    </button>
                  ) : (
                    <button
                      className="bldr-activation-card__primary"
                      onClick={() => {
                        void trackEvent('activation_next_step', 'publish', token);
                        handlePublish();
                      }}
                      data-codeit-coach={coachStage.target === 'publish' ? 'current' : undefined}
                      disabled={editing || publishStatus === 'publishing'}
                    >
                      {publishStatus === 'publishing' ? 'Publishing…' : 'Publish and get a link'}
                    </button>
                  )}
                  <button
                    className="bldr-activation-card__secondary"
                    onClick={() => {
                      void trackEvent('activation_next_step', 'improve', token);
                      setShowEditPanel(true);
                      setTimeout(() => editRef.current?.focus(), 0);
                    }}
                    disabled={editing}
                  >
                    Keep improving
                  </button>
                </div>
              </section>
            )
  );
}

export function studioView15(studio) {
  const { coachStage, editRef, editing, handleShare, isPublished, isSaved, onTab, setShowEditPanel, shareStatus, token } = studio;
  return (
    onTab('keep') && isSaved && isPublished && (
              <section className="bldr-activation-card bldr-activation-card--live" aria-labelledby="bldr-live-step-title">
                <div className="bldr-activation-card__copy">
                  <span className="bldr-activation-card__kicker">Your project is live</span>
                  <h3 id="bldr-live-step-title">Invite someone to play it.</h3>
                  <p>The link opens your project without an account. Anyone who wants to build can remix a separate copy.</p>
                </div>
                <div className="bldr-activation-card__actions">
                  <button
                    className="bldr-activation-card__primary"
                    onClick={() => {
                      void trackEvent('activation_next_step', 'share', token);
                      handleShare();
                    }}
                    data-codeit-coach={coachStage.target === 'share' ? 'current' : undefined}
                    disabled={editing}
                  >
                    {shareStatus === 'shared' ? 'Shared!'
                      : shareStatus === 'copied' ? 'Link copied!'
                      : 'Share your project'}
                  </button>
                  <button
                    className="bldr-activation-card__secondary"
                    onClick={() => {
                      void trackEvent('activation_next_step', 'improve', token);
                      setShowEditPanel(true);
                      setTimeout(() => editRef.current?.focus(), 0);
                    }}
                    disabled={editing}
                  >
                    Improve it again
                  </button>
                </div>
              </section>
            )
  );
}

export function studioView16(studio) {
  const { setWorkspaceTab, workspaceTab, workspaceTabs } = studio;
  return (
    <nav className="bldr-tabs" aria-label="Studio pages">
              {workspaceTabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  className={`bldr-tab${workspaceTab === tab.id ? ' bldr-tab--active' : ''}`}
                  onClick={() => setWorkspaceTab(tab.id)}
                  aria-current={workspaceTab === tab.id ? 'page' : undefined}
                  title={tab.hint || tab.blurb}
                >
                  <span className="bldr-tab__icon"><Icon name={tab.icon} size={18} /></span>
                  <span className="bldr-tab__label">{tab.label}</span>
                  {tab.attention && workspaceTab !== tab.id && (
                    <span className="bldr-tab__dot" aria-hidden="true" />
                  )}
                </button>
              ))}
            </nav>
  );
}

export function studioView17(studio) {
  const { applyColorsInstant, applyEdit, applyInstantChange, code, commitSetting, customAccent, customBg, customPrimary, customText, editing, gameSettings, guideLevel, handleApplyColors, handleRenameProject, handleTogglePlay, instantControls, instantNotice, instantPrefs, mineThemes, onTab, popXp, previewSetting, resetSetting, setCustomAccent, setCustomBg, setCustomPrimary, setCustomText, setInstantNotice, setSettingDrafts, setStudioPanel, setTitleDraft, settingValue, studioPanel, titleDraft } = studio;
  return (
    onTab('change') && studioPanel && (
              <div className="bldr-studio-panel">
                <div className="bldr-studio-panel__header">
                  <span className="bldr-studio-panel__title">
                    {STUDIO_TOOLS.find(t => t.id === studioPanel)?.label}
                  </span>
                  <button className="bldr-studio-panel__close" onClick={() => setStudioPanel(null)}>×</button>
                </div>

                {studioPanel === 'mine' && (
                  <div className="bldr-studio-panel__body bldr-mine" data-guide-level={guideLevel}>
                    <p className="bldr-mine__intro">
                      <Icon name="sparkle" size={22} className="bldr-mine__intro-icon" />
                      {guideLevel === 'early'
                        ? 'Tap a picture to change your project. It changes right away!'
                        : 'Every change here happens straight away. No waiting, no internet needed.'}
                    </p>

                    {instantControls.includes('theme') && (
                      <fieldset className="bldr-mine__group">
                        <legend className="bldr-mine__legend"><Icon name="palette" size={20} /> Colours</legend>
                        <div className="bldr-mine__options bldr-mine__options--theme">
                          {mineThemes.map(theme => (
                            <button
                              key={theme.name}
                              type="button"
                              className="bldr-mine__option"
                              aria-label={`Apply ${theme.name} colours`}
                              disabled={editing}
                              onClick={() => {
                                const said = handleApplyColors(theme.vars, theme.name);
                                if (!said) setInstantNotice(`${theme.name} colours applied. Play it again to test your change.`);
                                popXp(0, 'Made it yours');
                              }}
                            >
                              <span className="bldr-mine__swatches" aria-hidden="true">
                                {theme.swatches.map(color => <span key={color} style={{ background: color }} />)}
                              </span>
                              <span className="bldr-mine__option-label">{theme.name}</span>
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    )}

                    {instantControls.includes('textSize') && (
                      <fieldset className="bldr-mine__group">
                        <legend className="bldr-mine__legend"><Icon name="text" size={20} /> Text size</legend>
                        <div className="bldr-mine__options">
                          {optionsForGuideLevel(TEXT_SIZES, guideLevel).map(option => (
                            <button
                              key={option.id}
                              type="button"
                              className={`bldr-mine__option${instantPrefs.textSize === option.id ? ' bldr-mine__option--active' : ''}`}
                              aria-label={`Text size: ${option.label}`}
                              aria-pressed={instantPrefs.textSize === option.id}
                              disabled={editing}
                              onClick={() => applyInstantChange(
                                { textSize: option.id },
                                `Text size: ${option.label}`,
                                `Text is now ${option.label.toLowerCase()}. Play it again to test your change.`
                              )}
                            >
                              <span className="bldr-mine__preview" aria-hidden="true" style={{ fontSize: `${option.scale}rem` }}>Aa</span>
                              <span className="bldr-mine__option-label">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    )}

                    {instantControls.includes('font') && (
                      <fieldset className="bldr-mine__group">
                        <legend className="bldr-mine__legend"><Icon name="pen" size={20} /> Letter style</legend>
                        <div className="bldr-mine__options">
                          {optionsForGuideLevel(FONTS, guideLevel).map(option => (
                            <button
                              key={option.id}
                              type="button"
                              className={`bldr-mine__option${instantPrefs.font === option.id ? ' bldr-mine__option--active' : ''}`}
                              aria-label={`Letter style: ${option.label}`}
                              aria-pressed={instantPrefs.font === option.id}
                              disabled={editing}
                              onClick={() => applyInstantChange(
                                { font: option.id },
                                `Letter style: ${option.label}`,
                                `Letters are now ${option.label.toLowerCase()}. Play it again to test your change.`
                              )}
                            >
                              <span className="bldr-mine__preview" aria-hidden="true" style={{ fontFamily: option.stack || 'inherit' }}>Abc</span>
                              <span className="bldr-mine__option-label">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    )}

                    {instantControls.includes('background') && (
                      <fieldset className="bldr-mine__group">
                        <legend className="bldr-mine__legend"><Icon name="image" size={20} /> Background</legend>
                        <div className="bldr-mine__options">
                          {optionsForGuideLevel(BACKGROUNDS, guideLevel).map(option => (
                            <button
                              key={option.id}
                              type="button"
                              className={`bldr-mine__option${instantPrefs.background === option.id ? ' bldr-mine__option--active' : ''}`}
                              aria-label={`Background: ${option.label}`}
                              aria-pressed={instantPrefs.background === option.id}
                              disabled={editing}
                              onClick={() => applyInstantChange(
                                { background: option.id },
                                `Background: ${option.label}`,
                                `Background is now ${option.label.toLowerCase()}. Play it again to test your change.`
                              )}
                            >
                              <span
                                className="bldr-mine__preview bldr-mine__preview--swatch"
                                aria-hidden="true"
                                style={{ backgroundImage: option.swatch, backgroundSize: option.swatchSize || 'auto' }}
                              />
                              <span className="bldr-mine__option-label">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    )}

                    {instantControls.includes('corners') && (
                      <fieldset className="bldr-mine__group">
                        <legend className="bldr-mine__legend"><span aria-hidden="true">⭐</span> Corners</legend>
                        <div className="bldr-mine__options">
                          {CORNERS.map(option => (
                            <button
                              key={option.id}
                              type="button"
                              className={`bldr-mine__option${instantPrefs.corners === option.id ? ' bldr-mine__option--active' : ''}`}
                              aria-label={`Corners: ${option.label}`}
                              aria-pressed={instantPrefs.corners === option.id}
                              disabled={editing}
                              onClick={() => applyInstantChange(
                                { corners: option.id },
                                `Corners: ${option.label}`,
                                `Corners are now ${option.label.toLowerCase()}. Play it again to test your change.`
                              )}
                            >
                              <span
                                className="bldr-mine__preview bldr-mine__preview--corner"
                                aria-hidden="true"
                                style={{ borderRadius: option.radius || '6px' }}
                              />
                              <span className="bldr-mine__option-label">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    )}

                    {instantControls.includes('title') && (
                      <fieldset className="bldr-mine__group">
                        <legend className="bldr-mine__legend"><Icon name="tag" size={20} /> Project name</legend>
                        <div className="bldr-mine__rename">
                          <label className="bldr-mine__rename-label" htmlFor="bldr-title-input">
                            {guideLevel === 'early' ? 'What is your project called?' : 'Give your project its own name'}
                          </label>
                          <input
                            id="bldr-title-input"
                            className="bldr-mine__rename-input"
                            type="text"
                            maxLength={80}
                            value={titleDraft}
                            placeholder="My awesome project"
                            onChange={e => setTitleDraft(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleRenameProject(); } }}
                          />
                          <button
                            type="button"
                            className="bldr-studio-panel__apply-btn"
                            disabled={editing || !titleDraft.trim() || titleDraft.trim() === readProjectHeading(code)}
                            onClick={handleRenameProject}
                          >
                            Use this name
                          </button>
                        </div>
                      </fieldset>
                    )}

                    {instantNotice && (
                      <p className="bldr-mine__notice" role="status" aria-live="polite">
                        {instantNotice}
                        <button
                          type="button"
                          className="bldr-mine__notice-btn"
                          onClick={() => { setStudioPanel(null); handleTogglePlay(); }}
                        >
                          <Icon name="play" size={12} /> Play my changes
                        </button>
                      </p>
                    )}
                  </div>
                )}

                {studioPanel === 'colors' && (
                  <div className="bldr-studio-panel__body">
                    <p className="bldr-studio-panel__hint">Pick any colour you like. It changes straight away.</p>
                    <div className="bldr-color-pickers">
                      {[
                        { label: 'Background', val: customBg,      set: setCustomBg,      key: '--bg' },
                        { label: 'Primary',    val: customPrimary,  set: setCustomPrimary, key: '--primary' },
                        { label: 'Accent',     val: customAccent,   set: setCustomAccent,  key: '--accent' },
                        { label: 'Text',       val: customText,     set: setCustomText,    key: '--text' },
                      ].map(({ label, val, set, key }) => (
                        <label key={key} className="bldr-color-picker-row">
                          <span className="bldr-color-picker-label">{label}</span>
                          <input
                            type="color"
                            className="bldr-color-picker-input"
                            value={val}
                            onChange={e => { set(e.target.value); applyColorsInstant({ [key]: e.target.value }); }}
                          />
                          <span className="bldr-color-picker-hex">{val}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      className="bldr-studio-panel__apply-btn"
                      disabled={editing}
                      onClick={() => {
                        handleApplyColors({ '--bg': customBg, '--primary': customPrimary, '--accent': customAccent, '--text': customText }, 'Your colours');
                        popXp(0, 'Colour changed');
                        setStudioPanel(null);
                      }}
                    >
                      Apply colours
                    </button>
                    <p className="bldr-studio-panel__hint" style={{ marginTop: '0.75rem' }}>Or apply a full preset theme:</p>
                    {PRESET_PALETTES.map(palette => (
                      <button
                        key={palette.name}
                        className={`bldr-palette-row${palette.unlock && !hasPalette(localStorage, whoAmI(), palette.unlock) ? ' is-locked' : ''}`}
                        disabled={editing || (palette.unlock && !hasPalette(localStorage, whoAmI(), palette.unlock))}
                        title={palette.unlock && !hasPalette(localStorage, whoAmI(), palette.unlock) ? palette.unlockHint : undefined}
                        onClick={() => {
                          if (!colourSettings(code).length) applyColorsInstant(palette.vars);
                          setCustomBg(palette.vars['--bg'] || customBg);
                          setCustomPrimary(palette.vars['--primary'] || customPrimary);
                          setCustomAccent(palette.vars['--accent'] || customAccent);
                          setCustomText(palette.vars['--text'] || customText);
                          handleApplyColors(palette.vars, palette.name);
                          popXp(0, 'Colour changed');
                          setStudioPanel(null);
                        }}
                      >
                        <div className="bldr-palette-swatches">
                          {palette.swatches.map(c => (
                            <span key={c} className="bldr-palette-swatch" style={{ background: c }} />
                          ))}
                        </div>
                        <span className="bldr-palette-name">
                          {palette.name}
                          {palette.unlock && !hasPalette(localStorage, whoAmI(), palette.unlock) && (
                            <span className="bldr-palette-lock"> {palette.unlockHint}</span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {studioPanel === 'text' && (
                  <div className="bldr-studio-panel__body">
                    <p className="bldr-studio-panel__hint">Pick a text style upgrade</p>
                    {TEXT_UPGRADES.map(opt => (
                      <button
                        key={opt}
                        className="bldr-studio-panel__option"
                        disabled={editing}
                        onClick={() => {
                          applyEdit(opt + '. Keep all layout, colors, and functionality unchanged.');
                          popXp(0, 'Text changed');
                          setStudioPanel(null);
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {studioPanel === 'effects' && (
                  <div className="bldr-studio-panel__body">
                    <p className="bldr-studio-panel__hint">Add a visual effect to your project</p>
                    {EFFECT_UPGRADES.map(fx => (
                      <button
                        key={fx}
                        className="bldr-studio-panel__option"
                        disabled={editing}
                        onClick={() => {
                          applyEdit(fx + '. Keep all existing functionality and content unchanged.');
                          popXp(0, 'Effect added');
                          setStudioPanel(null);
                        }}
                      >
                        {fx}
                      </button>
                    ))}
                  </div>
                )}

                {studioPanel === 'gameplay' && (
                  <div className="bldr-studio-panel__body bldr-controls">
                    <p className="bldr-studio-panel__hint">
                      These are the real settings inside your game. Move one and watch.
                    </p>

                    {gameSettings.map(setting => {
                      const value = settingValue(setting);
                      const changed = value !== setting.value;
                      return (
                        <div className="bldr-control" key={setting.name}>
                          <div className="bldr-control__header">
                            <label className="bldr-control__label" htmlFor={`ctl-${setting.name}`}>
                              {setting.label}
                            </label>
                            {/* The child's own variable name, shown on purpose: it is the
                                word they will meet again in the code tab and in Prove It. */}
                            <code className="bldr-control__var">{setting.name}</code>
                            <span className="bldr-control__val">
                              {setting.type === 'colour'
                                ? <span className="bldr-control__chip" style={{ background: value }} />
                                : String(value)}
                            </span>
                          </div>

                          {setting.type === 'number' && (
                            <input
                              id={`ctl-${setting.name}`}
                              type="range"
                              className="bldr-studio-range"
                              min={setting.min}
                              max={setting.max}
                              step={setting.step}
                              value={value}
                              onChange={e => previewSetting(setting, Number(e.target.value))}
                              onPointerUp={e => commitSetting(setting, Number(e.currentTarget.value))}
                              onKeyUp={e => commitSetting(setting, Number(e.currentTarget.value))}
                              onBlur={e => commitSetting(setting, Number(e.currentTarget.value))}
                            />
                          )}

                          {setting.type === 'colour' && (
                            <div className="bldr-control__colours">
                              {SETTING_COLOURS.map(c => (
                                <button
                                  key={c}
                                  type="button"
                                  className={`bldr-control__swatch${String(value).toLowerCase() === c.toLowerCase() ? ' bldr-control__swatch--on' : ''}`}
                                  style={{ background: c }}
                                  aria-label={`Use ${c}`}
                                  onClick={() => { previewSetting(setting, c); commitSetting(setting, c); }}
                                />
                              ))}
                              <input
                                id={`ctl-${setting.name}`}
                                type="color"
                                className="bldr-control__picker"
                                aria-label={`${setting.label}: pick any colour`}
                                value={/^#[0-9a-f]{6}$/i.test(String(value)) ? value : '#ffffff'}
                                onChange={e => previewSetting(setting, e.target.value)}
                                onBlur={e => commitSetting(setting, e.target.value)}
                              />
                            </div>
                          )}

                          {setting.type === 'text' && (
                            <input
                              id={`ctl-${setting.name}`}
                              type="text"
                              className="bldr-control__text"
                              value={value}
                              maxLength={40}
                              onChange={e => setSettingDrafts(d => ({ ...d, [setting.name]: e.target.value }))}
                              onBlur={e => commitSetting(setting, e.target.value)}
                            />
                          )}

                          {setting.type === 'boolean' && (
                            <button
                              id={`ctl-${setting.name}`}
                              type="button"
                              className={`bldr-control__toggle${value ? ' bldr-control__toggle--on' : ''}`}
                              onClick={() => { previewSetting(setting, !value); commitSetting(setting, !value); }}
                            >
                              {value ? 'On' : 'Off'}
                            </button>
                          )}

                          <div className="bldr-control__foot">
                            {setting.help && <span className="bldr-control__help">{setting.help}</span>}
                            {changed && (
                              <button
                                type="button"
                                className="bldr-control__reset"
                                onClick={() => resetSetting(setting)}
                              >
                                Put it back to {String(setting.value)}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )
  );
}
