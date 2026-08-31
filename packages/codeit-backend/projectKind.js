'use strict';

// ── One answer to "what kind of project is this?" ───────────────────────────
//
// project_type is free text: designEngine emits single words, but the column
// has held 'interactive-website' in production, and nothing bounds what a
// future model reply puts there. Classification of that text used to be
// copied in four places — designEngine, analyticsEvents, routes/builder, and
// api/share.js — and three had drifted apart, so an interactive-website was
// 'other' to analytics and wore the game card on WhatsApp.
//
// api/share.js fixed itself by reading the words instead of matching the
// whole string. This module is that same idea for the backend, in one place:
// split on anything that is not a letter, then look for the tokens. Quiz
// wins over site so a "quiz website" counts the quiz; anything unrecognised
// is 'other', never a guess.
//
// (api/share.js keeps its own tiny copy on purpose: it is a Vercel function
// bundled with includeFiles and deliberately imports nothing from here.)

const QUIZ_WORDS = /\b(quiz|quizzes|trivia)\b/;
const SITE_WORDS = /\b(website|site|webpage|page|portfolio|restaurant|shop|store|sports|blog|landing|homepage|resume|business)\b/;
const TOOL_WORDS = /\b(tool|calculator|timer|stopwatch|clock|drawing|paint|flashcards?|converter|simulator|simulation)\b/;
const GAME_WORDS = /\b(game|clicker|runner|memory|reaction|soccer|platformer|dodge|dodger|racing|racer|typing|tower|maze|survival|puzzle|basketball|cooking|snake|catch|catcher|shooter|jumper|arcade|adventure)\b/;

/** 'game' | 'quiz' | 'website' | 'tool' | 'other' — from free-text project_type. */
function projectKind(value) {
  const tokens = String(value || '').toLowerCase().replace(/[^a-z]+/g, ' ').trim();
  if (!tokens) return 'other';
  if (QUIZ_WORDS.test(tokens)) return 'quiz';
  if (SITE_WORDS.test(tokens)) return 'website';
  if (TOOL_WORDS.test(tokens)) return 'tool';
  if (GAME_WORDS.test(tokens)) return 'game';
  return 'other';
}

module.exports = { projectKind };
