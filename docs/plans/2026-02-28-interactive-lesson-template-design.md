# Interactive Lesson Template — Design Document
**Date:** 2026-02-28
**Status:** Approved
**Branch:** feature/home-leaderboard-lessons-gating-glass

---

## Problem

Lessons 2–10 are static single-page scrollers with one code editor at the bottom. Only Lesson 1 has rich interactive content. There is no consistent lesson → quiz → puzzle progression flow. The target is a 25–30 min session: lesson (12–15 min) + quiz (5–7 min) + puzzle (6–8 min).

---

## Goals

1. One reusable `InteractiveLessonTemplate` component used by all 10 lessons
2. Each lesson defined as JSON data (3 blocks × lesson = 30 data blocks total)
3. Block 1 → 2 → 3 gate: run code successfully to advance
4. Lesson complete → DB persisted → Quiz unlocked
5. Quiz results screen → "Go to Puzzle" button
6. Zero regressions on Home, Auth, Quiz, Puzzles, Leaderboard

---

## Approach: Approach A — Template + JSON Data File

No new dependencies. No DB schema changes. Pure React + existing backend.

---

## Architecture

### New Files
```
src/data/lessonContent.js                         ← all 10 lessons' blocks (JSON)
src/components/InteractiveLessonTemplate/
  InteractiveLessonTemplate.js                    ← data-driven lesson renderer
  InteractiveLessonTemplate.css                   ← glass UI, 4 brand colors
```

### Modified Files
```
src/App.js                                        ← all /lesson/:id → InteractiveLessonTemplate
src/pages/Lessons/index.js                        ← export template
src/pages/Quizzes/Quiz.js                         ← add "Go to Puzzle" button on results screen
```

### Preserved (unchanged)
- Home, Auth, Quizzes (logic), Games, Leaderboard, Header, LessonMap
- All existing CSS class names in use by other pages
- All backend routes and DB schema

---

## Data Model

### `lessonContent.js` — lesson schema
```js
{
  id: Number,               // 1-10
  title: String,            // "Hello Python! 🐍"
  subtitle: String,         // short tagline
  estimatedMinutes: Number, // 15
  blocks: [
    {
      id: String,           // "1-1"
      title: String,        // "What is Python?"
      story: String,        // 1-2 sentence kid-friendly explanation
      interactionType: "drag-drop" | "fill-blank" | "predict-output",
      prompt: String,       // instruction shown above interaction
      // drag-drop fields:
      pieces: String[],     // tokens to arrange
      correctOrder: String[], // expected order
      // fill-blank fields:
      codeTemplate: String, // code with ___ placeholder
      options: String[],    // choices to fill blank
      correctOption: String,
      // predict-output fields:
      codeSnippet: String,  // read-only code shown
      options: String[],    // what does this print?
      correctOption: String,
      // shared:
      starterCode: String,  // pre-filled in PythonEditor
      expectedKeywords: String[], // lowercase; all must appear in output
      hints: String[],      // max 2 hints
    }
  ]
}
```

### Block Progress State (localStorage key: `lesson_N_blocks`)
```js
{
  blocks: {
    "N-1": { interactionPassed: Boolean, runPassed: Boolean },
    "N-2": { interactionPassed: Boolean, runPassed: Boolean },
    "N-3": { interactionPassed: Boolean, runPassed: Boolean },
  },
  lessonComplete: Boolean
}
```

### Unlock Rule
- Block 1: always unlocked
- Block N (N > 1): unlocked when block N-1 `runPassed === true`
- Lesson complete: all 3 blocks have `runPassed === true`

### Output Validation
Keywords match: output.toLowerCase() must contain ALL expectedKeywords[i].toLowerCase()

---

## Component Design: InteractiveLessonTemplate

### Props
```
lessonId: Number   (from URL param /lesson/:id)
```

### Render layout (per block)
```
[Header sticky]
[Progress dots: ●──●──○  Block 2/3]
[Glass card]
  [Story panel]  [🔊 Read aloud button]
  [Interaction widget]
    └─ drag-drop / fill-blank / predict-output
    └─ Hint button (up to 2 hints)
    └─ ✅ "Interaction passed!" on success
  [Code Runner (PythonEditor)]
    └─ starter code pre-filled
    └─ ▶ Run Code button
    └─ Output panel
    └─ ✅ "Great! Keywords matched!" on pass
[Next Block → button] (disabled until runPassed)
```

### On Block 3 runPassed:
1. `POST /api/lessons/:id/complete` (idempotent — marks DB, awards XP once)
2. Show celebration panel with confetti + "+XP earned!"
3. Button: "Take the Quiz →" → navigate to `/quiz/N` with `{source:'lesson', lessonId:N}`

### Motivational banner:
- Show "Almost there! One last challenge 🔥" when block 3 becomes unlocked

### Glass UI tokens (CSS custom properties)
```css
--color-primary: #667eea;   /* purple-blue */
--color-accent:  #4ecca3;   /* teal-green  */
--color-warm:    #ffd166;   /* amber        */
--color-danger:  #ff6b9d;   /* pink-red     */

.il-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.12);
}

.il-btn {
  border-radius: 12px;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.3);
  transition: transform 120ms, box-shadow 120ms;
}
```

---

## Quiz.js Changes

- On the results (`done`) screen, add a single new button after the existing retry/back buttons:
  ```jsx
  <button className="qz-btn-puzzle" onClick={() => navigate(`/game/${quizId}`)}>
    🎮 Play Puzzle {quizId}
  </button>
  ```
- One new CSS class `.qz-btn-puzzle` styled consistently with existing `.qz-btn-retry`
- No other quiz logic changes

---

## Puzzle Completion → Next Lesson

- The puzzle app is external (different origin, proxied). Completion events cannot be intercepted.
- Strategy: The "Play Puzzle N" button click in Quiz results marks the puzzle as "visited" (optimistic)
  by calling `POST /api/puzzles/:id/complete` at click time.
- This is the same pattern used for lesson completion (call complete on "Go to Quiz" click).
- Next lesson unlock: the LessonMap already uses `completedLessons` from `/api/lessons/progress`.
  Lesson N+1 becomes available when lesson N is completed (lesson completion already happens on block 3).
  So the chain is: Block 3 done → lesson complete → Quiz unlocked (by DB state) → Puzzle launched.

---

## Implementation Order

1. `src/data/lessonContent.js` — all 10 lessons' content
2. `InteractiveLessonTemplate.js` + `InteractiveLessonTemplate.css`
3. Update `App.js` routes
4. Update `Lessons/index.js` exports
5. Update `Quiz.js` (add puzzle button)
6. Build + deploy + verify

---

## Verification Checklist

- [ ] /lesson/1 … /lesson/10 all render with 3 blocks
- [ ] Block 1 is immediately available; blocks 2–3 locked
- [ ] Running wrong code shows hint, does not pass
- [ ] Running code with expected keywords unlocks next block
- [ ] Block 3 pass: DB call fires, lesson marked complete
- [ ] LessonMap shows lesson as completed after
- [ ] /quiz/N shows "Go to Puzzle N" button on results screen
- [ ] No regressions on Home, Login, Register, Leaderboard, Games
