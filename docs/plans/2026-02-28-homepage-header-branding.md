# Homepage + Header Brand Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the CodeIt brand palette (#FF8A3D, #4CC9F0, #FFD166, #1F2A44, bg #FFF7ED) to the homepage and header via CSS-only changes with zero JS edits.

**Architecture:** Surgical CSS edits to 4 files only (index.css, Home.css, Header.css, LeaderboardPreview.css). Background switches from dark rainbow gradient to #FFF7ED warm cream. All text switches from white to #1F2A44. Glass panels become light-bg-appropriate (higher opacity, brand-tinted borders). Feature cards remap to brand-only color gradients.

**Tech Stack:** CSS (no preprocessor), React CRA frontend, deployed via Apache at codeitlearn.com.

---

## Color Map Reference

| Old value | New value | Purpose |
|---|---|---|
| rainbow gradient | `#FFF7ED` | Page background |
| `#fff` (text) | `#1F2A44` | All body/heading text |
| `rgba(255,255,255,0.15-0.18)` | `rgba(255,255,255,0.65)` | Glass card fill |
| `#f093fb → #7209b7` | — | Removed entirely |
| `#ff9a3c, #ff6f91, #a78bfa, #06d6a0, #667eea, #764ba2` | brand only | Feature card gradients |
| `#ffd166` (yellow accent text) | `#FF8A3D` | Stat percentage colour |
| `#ff7a59, #f25f4c` | `#FF8A3D` | Logo / hover / active |
| `#041638` | `#1F2A44` | Text colour |
| `rgba(255,183,3,0.3)` | `rgba(255,138,61,0.18)` | Panel border |

## Brand Palette Cheatsheet
```
--primary:    #FF8A3D   (orange  — CTAs, accents, logo, active links)
--secondary:  #4CC9F0   (blue    — secondary buttons, quiz/puzzle card)
--accent:     #FFD166   (yellow  — rewards, badge bg, gradient partner)
--text:       #1F2A44   (navy    — all body text, headings)
--bg:         #FFF7ED   (cream   — page background)
--glass:      rgba(255,255,255,0.65)  (card fills on light bg)
```

---

### Task 1: Update `index.css` — unified glass-btn system

**Files:** Modify `packages/gamified-elearning/src/index.css`

**Step 1: Rewrite the `.glass-btn` block**

Replace with:
```css
.glass-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4em;
  background: rgba(255, 255, 255, 0.65);
  border: 1.5px solid rgba(255, 138, 61, 0.22);
  border-radius: 14px;
  padding: 0.75rem 1.4rem;
  font-family: 'Arvo', serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1F2A44;
  cursor: pointer;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 6px 20px rgba(31, 42, 68, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  text-decoration: none;
}
.glass-btn:hover {
  background: rgba(255, 255, 255, 0.85);
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(31, 42, 68, 0.14);
}
.glass-btn:active {
  transform: translateY(0);
  box-shadow: 0 4px 12px rgba(31, 42, 68, 0.1);
}
.glass-btn:focus-visible {
  outline: 2.5px solid #FF8A3D;
  outline-offset: 3px;
}
.glass-btn--primary {
  background: linear-gradient(120deg, #FF8A3D, #FFD166);
  border-color: rgba(255, 138, 61, 0.35);
  color: #1F2A44;
  box-shadow: 0 8px 24px rgba(255, 138, 61, 0.3);
}
.glass-btn--primary:hover {
  background: linear-gradient(120deg, #ff7a2e, #ffc84e);
  box-shadow: 0 14px 32px rgba(255, 138, 61, 0.4);
}
.glass-btn--sm {
  padding: 0.42rem 0.95rem;
  font-size: 0.85rem;
  border-radius: 10px;
}
.glass-btn--pill { border-radius: 999px; }
.glass-btn:disabled,
.glass-btn[aria-disabled="true"] {
  opacity: 0.48;
  cursor: not-allowed;
  transform: none;
  pointer-events: none;
}
```

**Step 2: Verify** — File saved, no syntax errors. Check matching braces.

---

### Task 2: Update `Home.css` — light background + brand colors

**Files:** Modify `packages/gamified-elearning/src/pages/Home/Home.css`

**Key changes:**
1. `.homepage` background: `#FFF7ED` (remove rainbow gradient)
2. `.homepage::before` radials: use brand-tinted glows instead of vibrant colours
3. `.glass-card`: higher opacity fill, brand-tinted border, dark text
4. `.btn-glass*`: remap to brand colours (`#FF8A3D`, `#4CC9F0`)
5. Hero: light glass panel, dark headings/sub
6. `.hp-eyebrow`: `#FF8A3D`
7. `.hp-h1`: `#1F2A44`; `.hp-h1-accent`: gradient with brand colours
8. `.hp-stat__fill` / `.hp-prog-fill`: remap to brand gradients (no pink/purple)
9. Feature cards — remap 4 cards to brand-only:
   - Lessons: `#FF8A3D → #FFD166`
   - Quizzes: `#4CC9F0 → #FF8A3D`
   - Puzzles: `#4CC9F0 → #FFD166`
   - Character Lab: `#FFD166 → #FF8A3D`
10. `.hp-continue`, `.hp-prog-card`: light glass, dark text
11. Overrides for `.hp-lower__right .lb-prev*`: simplify (light bg, no `!important` overrides needed since leaderboard panel already has white bg)

Full replacement CSS provided in Task 2 implementation step.

---

### Task 3: Update `Header.css` — brand colour alignment

**Files:** Modify `packages/gamified-elearning/src/pages/Header/Header.css`

**Key changes:**
1. Logo text: `#FF8A3D` (was `#f25f4c`)
2. Nav link default: `#1F2A44` (was `#041638`)
3. Nav link hover/active: `#FF8A3D` (was `#ff7a59`)
4. Underline gradient: `#FF8A3D, #FFD166`
5. Nav link bg on hover: `rgba(255,138,61,0.08)`
6. Leaderboard trigger: `#FFD166` tinted bg, `#1F2A44` text
7. CTA button: `#FF8A3D → #FFD166` gradient
8. Logout: `#FF8A3D`
9. Burger bars: `#1F2A44`
10. Focus: `#FF8A3D` outline

---

### Task 4: Update `LeaderboardPreview.css` — brand alignment

**Files:** Modify `packages/gamified-elearning/src/components/LeaderboardPreview.css`

**Note:** User listed `Leaderboard.css` but `LeaderboardPreview` appears on home page and header dropdown — these are the styles that actually need updating for the home redesign. `Leaderboard.css` (full page) is lower priority.

**Key changes:**
1. `.lb-prev-h2` / `.lb-prev-tagline`: `#1F2A44` (was `#041638`, similar but standardise)
2. `.lb-prev-all-btn`: `#FF8A3D → #FFD166` gradient (was `rgba(255,159,28)` off-brand)
3. `.lb-prev-login-link`: `#FF8A3D` (was `#ff7a59`)
4. `.lb-prev-spinner`: `#FF8A3D` (was `#ff9f1c`)
5. `.lb-prev-xp strong`: `#FF8A3D` (was `#c87800`)
6. `.lb-prev-state` text: `#1F2A44` (was `#0b3d66`)
7. Remove the `!important` overrides from `Home.css` for `.hp-lower__right .lb-prev*` (they were needed for dark bg, no longer required)

---

### Task 5: Also update `Leaderboard.css` — brand background

**Files:** Modify `packages/gamified-elearning/src/pages/Leaderboard/Leaderboard.css`

**Key changes:**
1. `.lb-page` background: `#FFF7ED` or subtle brand gradient (was `#fff5a5 → #9bf6ff`)
2. `.lb-page::before` radials: brand colours
3. Text colours: `#1F2A44` (was `#041638`)
4. XP label: `#FF8A3D` (was `#ff9f1c`)
5. Spinner: `#FF8A3D`

---

### Task 6: Build + deploy

```bash
/home/bitnami/deploy-frontend.sh
```

Expected: build succeeds, files copied to htdocs.

---

### Task 7: Verify

Visit https://codeitlearn.com and confirm:
- [ ] Background is warm cream (#FFF7ED), NOT rainbow
- [ ] All text is readable dark navy (#1F2A44)
- [ ] Header: CodeIt logo is orange (#FF8A3D), nav links are dark navy with orange hover
- [ ] Buttons have glass style with orange gradient for primary CTA
- [ ] Feature cards show orange, blue, blue+yellow, yellow-orange — NO purple, pink, teal
- [ ] Leaderboard panel on home page matches brand colours
- [ ] No JS files changed (verify: `git diff --name-only | grep -v '\.css'` shows nothing)
