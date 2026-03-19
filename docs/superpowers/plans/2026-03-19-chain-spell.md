# Chain Spell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, typographic word-chain game where each accepted word must start with the last letter of the previous one, rendered as a horizontal DOM chain with SVG connector paths on a dark background.

**Architecture:** DOM `<div>` word nodes inside a `position: relative` chain field, absolutely positioned and shifted left via individual `transform: translateX`. An SVG overlay (no viewBox, CSS-pixel coordinate space) draws cubic bezier connectors between adjacent words after each entry animation's `transitionend`. `performance.now()` drives the countdown timer; `AudioContext` (unlocked on first gesture) synthesises all sounds.

**Tech Stack:** Vanilla JS, HTML, CSS, SVG, Web Audio API. No dependencies. Developed in `chain-spell/index.html` + `chain-spell/style.css` + `chain-spell/script.js`, bundled into `chain-spell/game.html` at the end.

**Spec:** `docs/superpowers/specs/2026-03-19-chain-spell-design.md`

---

## File Map

| File | Responsibility |
|---|---|
| `chain-spell/index.html` | Three-zone structure (top-bar, chain-field with SVG overlay, input-zone) — markup only |
| `chain-spell/style.css` | Layout, palette, typography, CSS transitions, animations, timer bar, overlays |
| `chain-spell/script.js` | All game logic: dictionary, state machine, input, word nodes, SVG paths, timer, scoring, levels, audio, shatter |
| `chain-spell/game.html` | Final bundle — CSS + JS inlined — generated in last task |

> **No automated test runner.** Each task's verification is a manual browser check. Open `chain-spell/index.html` directly in Chrome (no server needed). Verification criteria are listed explicitly per step.

---

## Task 1: Project Scaffold

**Files:**
- Create: `chain-spell/index.html`
- Create: `chain-spell/style.css`
- Create: `chain-spell/script.js`

- [ ] **Step 1: Create `chain-spell/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chain Spell</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- Top bar -->
  <div id="top-bar">
    <div id="score-wrap">
      <div id="score">0</div>
      <div id="best">BEST: 0</div>
    </div>
    <div id="level-badge">LVL 1</div>
    <div id="timer-track">
      <div id="timer-bar"></div>
    </div>
  </div>

  <!-- Chain field -->
  <div id="chain-field">
    <div id="title-display">CHAIN SPELL</div>
    <svg id="connector-svg" aria-hidden="true"></svg>
  </div>

  <!-- Input zone -->
  <div id="input-zone">
    <input id="word-input" type="text" autocomplete="off" autocorrect="off"
           autocapitalize="off" spellcheck="false" placeholder="type any word…">
    <div id="input-label">type any word to begin</div>
  </div>

  <script src="script.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `chain-spell/style.css`** (placeholder — full styles added in Task 3)

```css
/* Chain Spell styles */
```

- [ ] **Step 3: Create `chain-spell/script.js`** with the skeleton structure

```js
// ─── 1. Constants & config ────────────────────────────────────────────────────
const WORDS_PER_LEVEL     = 5;
const BASE_TIMER_MS       = 15000;
const MIN_TIMER_MS        = 5000;
const TIMER_STEP_MS       = 500;   // ceiling tightens by this each level
const BONUS_MS_PER_CHAR   = 500;   // bonus ms per character in accepted word
const SCORE_PER_CHAR      = 10;
const NODE_GAP            = 32;    // px gap between word nodes
const NODE_ANCHOR         = 0.65;  // newest word left position as fraction of container width
const PRUNE_MARGIN        = 300;   // px past left edge before node is pruned

// ─── 2. Dictionary (populated in Task 2) ─────────────────────────────────────
const WORDS = new Set(/* populated in Task 2 */[]);

// ─── 3. State ─────────────────────────────────────────────────────────────────
const STATE = { IDLE: 'idle', PLAYING: 'playing', LEVELUP: 'levelup', OVER: 'over' };

const defaultState = () => ({
  state:          STATE.IDLE,
  chain:          [],           // [{ word, el, translateX }]
  usedWords:      new Set(),
  requiredLetter: '',           // '' = no constraint (first word)
  score:          0,
  displayScore:   0,
  level:          1,
  wordsThisLevel: 0,
  timerEnd:       0,
  timerDuration:  0,
  lastPulseSecond:0,
  levelUpPausedAt:0,
  shatterNodes:   [],           // { el, vx, vy, vr, elapsed }
});

let game = defaultState();

// ─── 4. AudioContext setup (Task 13) ─────────────────────────────────────────

// ─── 5. Game state machine (Tasks 6, 11, 12, 14) ─────────────────────────────

// ─── 6. Input handler (Task 5) ───────────────────────────────────────────────

// ─── 7. Game update logic (Tasks 11–12, 14, 16) ──────────────────────────────

// ─── 8. Render logic (Tasks 7–10) ────────────────────────────────────────────

// ─── 9. Game loop ─────────────────────────────────────────────────────────────
let lastTime = 0;
function loop(ts) {
  const dt = Math.min(ts - lastTime, 100) / 1000;
  lastTime = ts;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function update(dt) { /* filled in later */ }
function render()   { /* filled in later */ }

// ─── 10. Init ─────────────────────────────────────────────────────────────────
requestAnimationFrame(loop);
```

- [ ] **Step 4: Verify** — Open `chain-spell/index.html` in Chrome. Page loads without console errors. Three blank zones visible. No content yet beyond structure.

- [ ] **Step 5: Commit**

```bash
git add chain-spell/
git commit -m "feat(chain-spell): scaffold index.html, style.css, script.js"
```

---

## Task 2: Dictionary

**Files:**
- Modify: `chain-spell/script.js` (populate `WORDS` Set)

The dictionary needs ~20,000 common English words. Use the ENABLE (Enhanced North American Benchmark LExicon) word list, or any public-domain common English word list. Filter to words of 3–12 lowercase letters only.

- [ ] **Step 1: Obtain a word list**

Search for "ENABLE word list" or "SCOWL word list small" — both are public domain. Download the plain-text file (one word per line). Save it locally as `words-raw.txt` (do not commit this file).

- [ ] **Step 2: Filter and format with Node.js**

Run this one-liner from the `chain-spell/` directory to produce a JS array literal:

```bash
node -e "
const fs = require('fs');
const words = fs.readFileSync('words-raw.txt', 'utf8')
  .split('\n')
  .map(w => w.trim().toLowerCase())
  .filter(w => /^[a-z]{3,12}$/.test(w));
const unique = [...new Set(words)].sort();
console.log('// ' + unique.length + ' words');
fs.writeFileSync('words-out.js', 'const WORDS = new Set(' + JSON.stringify(unique) + ');\n');
" && wc -l words-out.js
```

This outputs `words-out.js`. If the list is larger than ~25k words, trim it (shorter is fine for gameplay; the chain game relies on common words).

- [ ] **Step 3: Inline into `script.js`**

Copy the `new Set([...])` array from `words-out.js` and replace the placeholder in `script.js`:

```js
const WORDS = new Set(["aardvark","abandon","ability", /* ...all words... */ ,"zoom"]);
```

Delete `words-raw.txt` and `words-out.js` — do not commit them.

- [ ] **Step 4: Verify** — Open `chain-spell/index.html`. Open the console and run:

```js
WORDS.has('hello')   // true
WORDS.has('zzzzz')   // false
WORDS.size           // ~15000–25000
```

- [ ] **Step 5: Commit**

```bash
git add chain-spell/script.js
git commit -m "feat(chain-spell): inline ~20k word dictionary as Set"
```

---

## Task 3: Base Layout & Styles

**Files:**
- Modify: `chain-spell/style.css`

- [ ] **Step 1: Write base styles**

```css
/* ── Reset & root ────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:       #0d0d0f;
  --text:     #f5f5f5;
  --accent:   hsl(210, 90%, 65%);
  --error:    hsl(0, 80%, 60%);
  --dupe:     hsl(40, 90%, 60%);
  --muted:    rgba(245, 245, 245, 0.35);
  --fade-far: rgba(245, 245, 245, 0.20);
  --font:     system-ui, -apple-system, sans-serif;
}

html, body {
  width: 100%; height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  overflow: hidden;
  user-select: none;
}

body {
  display: flex;
  flex-direction: column;
}

/* ── Top bar ─────────────────────────────────────────────────────── */
#top-bar {
  flex: 0 0 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  gap: 16px;
}

#score-wrap { display: flex; flex-direction: column; min-width: 80px; }
#score      { font-size: 1.6rem; font-weight: 700; line-height: 1; }
#best       { font-size: 0.7rem; color: var(--muted); margin-top: 2px; }

#level-badge {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--accent);
}

#timer-track {
  flex: 0 0 160px;
  height: 4px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  overflow: hidden;
}

#timer-bar {
  height: 100%;
  width: 100%;
  background: var(--text);
  transform-origin: left center;
  transform: scaleX(1);
  transition: background 0.3s;
  border-radius: 2px;
}

/* ── Chain field ─────────────────────────────────────────────────── */
#chain-field {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
}

#connector-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* ── Input zone ──────────────────────────────────────────────────── */
#input-zone {
  flex: 0 0 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 24px 16px;
}

#word-input {
  background: transparent;
  border: none;
  border-bottom: 2px solid rgba(255,255,255,0.2);
  color: var(--text);
  font-family: var(--font);
  font-size: 1.8rem;
  font-weight: 700;
  text-align: center;
  width: 100%;
  max-width: 480px;
  outline: none;
  transition: border-color 0.15s;
  text-transform: lowercase;
}

#word-input:focus { border-color: rgba(255,255,255,0.5); }

#input-label {
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  color: var(--muted);
  text-transform: uppercase;
}
```

- [ ] **Step 2: Verify** — Reload. Top bar, chain field (tall middle area), and input zone are visible. Input is focusable and styled. No layout overflow.

- [ ] **Step 3: Commit**

```bash
git add chain-spell/style.css
git commit -m "feat(chain-spell): base layout and color palette"
```

---

## Task 4: Idle Screen

**Files:**
- Modify: `chain-spell/style.css`
- Modify: `chain-spell/script.js`

- [ ] **Step 1: Style the title and idle state**

Add to `style.css`:

```css
/* ── Title (IDLE) ────────────────────────────────────────────────── */
#title-display {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  font-size: clamp(2rem, 6vw, 4rem);
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--accent);
  animation: pulse-title 2.4s ease-in-out infinite;
  pointer-events: none;
  z-index: 1;
}

@keyframes pulse-title {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1;   }
}

/* Hide timer bar in IDLE */
body.idle #timer-track { visibility: hidden; }
body.idle #top-bar     { opacity: 0.4; }
body.idle #level-badge { display: none; }
```

- [ ] **Step 2: Apply idle class on page load in `script.js`**

Add to the `Init` section at the bottom:

```js
// Apply initial state class and focus input
document.body.classList.add('idle');
document.getElementById('word-input').focus();
```

- [ ] **Step 3: Verify** — Reload. "CHAIN SPELL" pulses in blue in the center. Timer bar is hidden. Top bar is dimmed. Input is focused and ready to type.

- [ ] **Step 4: Commit**

```bash
git add chain-spell/style.css chain-spell/script.js
git commit -m "feat(chain-spell): idle screen with pulsing title"
```

---

## Task 5: Word Input, Validation & Input Feedback

**Files:**
- Modify: `chain-spell/script.js`
- Modify: `chain-spell/style.css`

- [ ] **Step 1: Add input feedback CSS**

Add to `style.css`:

```css
/* ── Input feedback ──────────────────────────────────────────────── */
#word-input.flash-valid   { border-color: var(--accent); }
#word-input.flash-invalid { border-color: var(--error);  }
#word-input.flash-dupe    { border-color: var(--dupe);   }

@keyframes shake {
  0%,100% { transform: translateX(0); }
  20%     { transform: translateX(-8px); }
  40%     { transform: translateX(8px); }
  60%     { transform: translateX(-5px); }
  80%     { transform: translateX(5px); }
}

#word-input.shake { animation: shake 0.22s ease; }
```

- [ ] **Step 2: Add validation and feedback functions to `script.js`** (place in section 6)

```js
const inputEl = document.getElementById('word-input');
const labelEl = document.getElementById('input-label');

function validateWord(raw) {
  const word = raw.trim().toLowerCase();
  if (!word) return { ok: false, reason: null };
  if (!WORDS.has(word))            return { ok: false, reason: 'invalid' };
  if (game.requiredLetter && word[0] !== game.requiredLetter)
                                   return { ok: false, reason: 'invalid' };
  if (game.usedWords.has(word))    return { ok: false, reason: 'dupe' };
  return { ok: true, word };
}

function flashInput(type) {
  // type: 'valid' | 'invalid' | 'dupe'
  inputEl.classList.remove('flash-valid', 'flash-invalid', 'flash-dupe', 'shake');
  void inputEl.offsetWidth; // force reflow to restart animation
  inputEl.classList.add(`flash-${type}`);
  if (type !== 'valid') inputEl.classList.add('shake');
  setTimeout(() => {
    inputEl.classList.remove(`flash-${type}`, 'shake');
  }, 350);
}

function updateInputLabel() {
  if (game.state === STATE.IDLE) {
    labelEl.textContent = 'type any word to begin';
  } else if (game.state === STATE.PLAYING && game.requiredLetter) {
    labelEl.textContent = `next word must start with  ${game.requiredLetter.toUpperCase()}`;
  } else {
    labelEl.textContent = '';
  }
}

function handleEnter() {
  if (game.state === STATE.OVER || game.state === STATE.LEVELUP) return;
  const { ok, word, reason } = validateWord(inputEl.value);
  if (!ok) {
    if (reason) flashInput(reason === 'dupe' ? 'dupe' : 'invalid');
    return;
  }
  inputEl.value = '';
  flashInput('valid');
  acceptWord(word);
}

inputEl.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleEnter();
});
```

- [ ] **Step 3: Stub `acceptWord`** (to be fleshed out in Task 6, but needed now to avoid errors)

```js
function acceptWord(word) {
  // Stub — full implementation in Task 6
  console.log('accepted:', word);
  game.usedWords.add(word);
  game.requiredLetter = word[word.length - 1];
  updateInputLabel();
}
```

- [ ] **Step 4: Verify** — Reload. Type "xyz" and press Enter → red shake. Type "hello" and press Enter → logged to console, label updates to "next word must start with O". Type "hello" again → amber shake (duplicate). Type "old" → logged, label updates to "D".

- [ ] **Step 5: Commit**

```bash
git add chain-spell/style.css chain-spell/script.js
git commit -m "feat(chain-spell): word validation, input feedback shake and flash"
```

---

## Task 6: startGame, STATE.PLAYING & First Word Handling

**Files:**
- Modify: `chain-spell/script.js`
- Modify: `chain-spell/style.css`

- [ ] **Step 1: Add playing-state CSS**

Add to `style.css`:

```css
/* ── Playing state ───────────────────────────────────────────────── */
body.playing #title-display { display: none; }
body.playing #top-bar       { opacity: 1; }
body.playing #level-badge   { display: block; }
body.playing #timer-track   { visibility: visible; }
```

- [ ] **Step 2: Add `setState` and `startGame` to section 5**

```js
const scoreEl     = document.getElementById('score');
const bestEl      = document.getElementById('best');
const levelEl     = document.getElementById('level-badge');
const timerBarEl  = document.getElementById('timer-bar');
const chainField  = document.getElementById('chain-field');
const svgOverlay  = document.getElementById('connector-svg');

function setState(next) {
  game.state = next;
  document.body.className = next; // sets CSS class for state-based display
}

function timerCeiling(level) {
  return Math.max(MIN_TIMER_MS, BASE_TIMER_MS - (level - 1) * TIMER_STEP_MS);
}

function startGame() {
  game = defaultState();
  game.score = 0;
  // Load best score
  const saved = JSON.parse(localStorage.getItem('chain-spell') || '{}');
  game.best = saved.best || 0;
  bestEl.textContent = `BEST: ${game.best}`;
  scoreEl.textContent = '0';
  levelEl.textContent = 'LVL 1';
  // Clear DOM
  chainField.querySelectorAll('.word-node').forEach(el => el.remove());
  svgOverlay.innerHTML = '';
  // Idle until first word
  setState(STATE.IDLE);
  updateInputLabel();
  inputEl.disabled = false;
  inputEl.focus();
}
```

- [ ] **Step 3: Update `acceptWord` to start the timer on the first word**

Replace the stub from Task 5 with:

```js
function acceptWord(word) {
  // First word: start the game
  if (game.state === STATE.IDLE) {
    setState(STATE.PLAYING);
    const ceiling = timerCeiling(game.level);
    game.timerDuration = ceiling;
    game.timerEnd = performance.now() + ceiling;
    game.lastPulseSecond = 3;
  } else {
    // Subsequent words: reset timer + bonus (unless level-up fires below)
    const ceiling = timerCeiling(game.level);
    const bonus   = word.length * BONUS_MS_PER_CHAR;
    game.timerDuration = ceiling;
    game.timerEnd = performance.now() + ceiling + bonus;
  }

  // Record word
  game.usedWords.add(word);
  game.requiredLetter = word[word.length - 1];
  game.chain.push({ word, el: null, translateX: 0 });

  // Score
  game.score += word.length * SCORE_PER_CHAR;

  // Level up check (bonus time is NOT applied if levelling up — startLevel() resets the timer)
  game.wordsThisLevel++;
  if (game.wordsThisLevel >= WORDS_PER_LEVEL) {
    game.wordsThisLevel = 0;
    game.level++;
    // Correct timer: hard reset to new ceiling (overrides bonus set above)
    const newCeiling = timerCeiling(game.level);
    game.timerDuration = newCeiling;
    game.timerEnd = performance.now() + newCeiling;
    // Level-up overlay fired in Task 11
  }

  addWordNode(word);        // Task 7
  updateInputLabel();
}
```

- [ ] **Step 4: Call `startGame()` in Init**

Replace the placeholder init with:

```js
startGame();
```

- [ ] **Step 5: Verify** — Reload. Type "hello" → "CHAIN SPELL" title disappears, top bar becomes opaque, `LVL 1` badge appears. Timer bar (still rendering as 1.0 scaleX, implementation in Task 8) is visible. Type "old" → console log, label updates. No errors.

- [ ] **Step 6: Commit**

```bash
git add chain-spell/style.css chain-spell/script.js
git commit -m "feat(chain-spell): startGame, STATE transitions, first-word timer start"
```

---

## Task 7: Word Node Creation & Rendering

**Files:**
- Modify: `chain-spell/script.js`
- Modify: `chain-spell/style.css`

- [ ] **Step 1: Add word node styles**

Add to `style.css`:

```css
/* ── Word nodes ──────────────────────────────────────────────────── */
.word-node {
  position: absolute;
  top: 50%;
  transform-style: preserve-3d;
  white-space: nowrap;
  font-size: clamp(1.4rem, 3.5vw, 2.2rem);
  font-weight: 400;
  color: var(--text);
  pointer-events: none;
  transition: transform 0.2s ease-out, opacity 0.2s ease-out;
  will-change: transform, opacity;
}

.word-node.newest { font-weight: 700; }

.word-node .letter-link { color: var(--accent); }
```

- [ ] **Step 2: Add `addWordNode` function** (place in section 8)

```js
let nodeIdCounter = 0;

function addWordNode(word) {
  // Prune old nodes first (Task 10 will flesh out pruneNodes)
  pruneNodes();

  const entry = game.chain[game.chain.length - 1];
  const containerW = chainField.offsetWidth;
  const anchorLeft = containerW * NODE_ANCHOR;

  // Shift existing nodes left by estimated width of new word
  // We measure after inserting, then correct — start with entry animation offset
  const ENTRY_OFFSET = 120; // px slide-in offset

  // Create node element
  const el = document.createElement('div');
  el.className = 'word-node newest';
  el.dataset.id = nodeIdCounter++;
  el.style.left = `${anchorLeft + ENTRY_OFFSET}px`;
  el.style.top  = '50%';
  el.style.transform = `translateX(0) translateY(-50%)`;
  el.style.opacity = '0';

  // Wrap letters in spans; first and last get .letter-link
  el.innerHTML = word.split('').map((ch, i) => {
    const isFirst = i === 0;
    const isLast  = i === word.length - 1;
    const cls = (isFirst || isLast) ? ' class="letter-link"' : '';
    return `<span${cls}>${ch}</span>`;
  }).join('');

  chainField.appendChild(el);
  entry.el = el;

  // Demote previous newest node
  const prev = game.chain[game.chain.length - 2];
  if (prev && prev.el) {
    prev.el.classList.remove('newest');
    // Update previous node: its last-letter link colour persists via .letter-link
  }

  // Measure actual width, then shift all older nodes left
  requestAnimationFrame(() => {
    const nodeW = el.offsetWidth;
    const shift = nodeW + NODE_GAP;

    // Shift all nodes except the new one
    game.chain.slice(0, -1).forEach((entry, idx) => {
      if (!entry.el) return;
      entry.translateX -= shift;
      entry.el.style.transform = `translateX(${entry.translateX}px) translateY(-50%)`;
      // Opacity fade: full on [n-1], fading toward 0.2 on older
      const age = game.chain.length - 1 - idx;
      const opacity = age <= 1 ? 1 : Math.max(0.2, 1 - (age - 1) * 0.27);
      entry.el.style.opacity = String(opacity);
    });

    // Anchor new node and animate it in
    entry.translateX = 0;
    el.style.left    = `${anchorLeft}px`;
    el.style.transform = `translateX(${ENTRY_OFFSET}px) translateY(-50%)`;
    el.style.opacity   = '0';

    // Force reflow then trigger transition
    void el.offsetWidth;
    el.style.transform = `translateX(0) translateY(-50%)`;
    el.style.opacity   = '1';

    // Draw connector after entry animation settles (Task 9)
    el.addEventListener('transitionend', function onSettle(e) {
      if (e.propertyName !== 'transform' || e.target !== el) return;
      el.removeEventListener('transitionend', onSettle);
      drawConnector(prev, entry);
    });
  });
}
```

- [ ] **Step 3: Add a stub for functions referenced above**

```js
function pruneNodes() { /* Task 10 */ }
function drawConnector(prev, curr) { /* Task 9 */ }
```

- [ ] **Step 4: Verify** — Reload. Type "hello" → a large word node "hello" appears near the right of the chain field, first and last letters are blue. Type "old" → "hello" slides left, "old" slides in from the right. "old" is bold, "hello" is regular weight and slightly faded. No console errors.

- [ ] **Step 5: Commit**

```bash
git add chain-spell/style.css chain-spell/script.js
git commit -m "feat(chain-spell): word node DOM creation, entry animation, opacity fade"
```

---

## Task 8: Timer Bar Rendering

**Files:**
- Modify: `chain-spell/script.js`

- [ ] **Step 1: Implement `render` function** (replace the empty stub in section 9)

```js
function render() {
  // Timer bar
  if (game.state === STATE.PLAYING) {
    const remaining = game.timerEnd - performance.now();
    const fill      = Math.max(0, Math.min(1, remaining / game.timerDuration));
    timerBarEl.style.transform = `scaleX(${fill})`;

    // Color shift: white → amber → red
    if (fill > 0.5) {
      timerBarEl.style.background = 'var(--text)';
    } else if (fill > 0.25) {
      timerBarEl.style.background = `hsl(40, 90%, ${50 + fill * 40}%)`;
    } else {
      timerBarEl.style.background = 'var(--error)';
    }
  }

  // Score lerp
  if (game.displayScore !== game.score) {
    game.displayScore += (game.score - game.displayScore) * 0.15;
    if (Math.abs(game.score - game.displayScore) < 1) game.displayScore = game.score;
    scoreEl.textContent = Math.floor(game.displayScore);
  }
}
```

- [ ] **Step 2: Verify** — After the first word is typed, the timer bar drains from right to left, turning amber then red. Score display updates immediately when a word is accepted.

- [ ] **Step 3: Commit**

```bash
git add chain-spell/script.js
git commit -m "feat(chain-spell): timer bar render with color shift, score lerp"
```

---

## Task 9: SVG Connector Paths

**Files:**
- Modify: `chain-spell/script.js`

- [ ] **Step 1: Implement `drawConnector`**

```js
function drawConnector(prev, curr) {
  if (!prev || !prev.el || !curr || !curr.el) return;

  // Find the last-letter span of prev and first-letter span of curr
  const prevSpans = prev.el.querySelectorAll('span');
  const currSpans = curr.el.querySelectorAll('span');
  const fromSpan  = prevSpans[prevSpans.length - 1];
  const toSpan    = currSpans[0];
  if (!fromSpan || !toSpan) return;

  // Convert viewport coords to SVG (overlay) local coords
  const svgRect  = svgOverlay.getBoundingClientRect();
  const fromRect = fromSpan.getBoundingClientRect();
  const toRect   = toSpan.getBoundingClientRect();

  const x1 = fromRect.right  - svgRect.left;
  const y1 = fromRect.top + fromRect.height / 2 - svgRect.top;
  const x2 = toRect.left     - svgRect.left;
  const y2 = toRect.top  + toRect.height  / 2 - svgRect.top;

  // Cubic bezier curving upward
  const cpY = Math.min(y1, y2) - 20;
  const d   = `M ${x1} ${y1} C ${x1} ${cpY}, ${x2} ${cpY}, ${x2} ${y2}`;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  path.setAttribute('stroke', 'hsl(210, 90%, 65%)');
  path.setAttribute('stroke-width', '1.5');
  path.setAttribute('fill', 'none');
  path.setAttribute('opacity', '0.4');

  // data-pair: "prevId-currId" for pruning lookup
  path.dataset.pair = `${prev.el.dataset.id}-${curr.el.dataset.id}`;

  svgOverlay.appendChild(path);
}
```

- [ ] **Step 2: Verify** — Type two or three words. A faint blue curved line connects the last letter of one word to the first letter of the next. Connector appears after the slide-in animation completes, not before.

- [ ] **Step 3: Commit**

```bash
git add chain-spell/script.js
git commit -m "feat(chain-spell): SVG bezier connector paths between word nodes"
```

---

## Task 10: Node Pruning

**Files:**
- Modify: `chain-spell/script.js`

- [ ] **Step 1: Implement `pruneNodes`**

```js
function pruneNodes() {
  const containerRect = chainField.getBoundingClientRect();
  // Never prune the most recent two entries (connector for [n-2, n-1] may not be drawn yet)
  const pruneUpTo = game.chain.length - 2;

  for (let i = 0; i < pruneUpTo; i++) {
    const entry = game.chain[i];
    if (!entry.el) continue;
    const nodeRect = entry.el.getBoundingClientRect();
    if (nodeRect.right < containerRect.left - PRUNE_MARGIN) {
      // Remove connector path(s) that reference this node's id
      const id = entry.el.dataset.id;
      svgOverlay.querySelectorAll(`path[data-pair^="${id}-"], path[data-pair$="-${id}"]`)
        .forEach(p => p.remove());
      entry.el.remove();
      entry.el = null;
    }
  }
}
```

- [ ] **Step 2: Verify** — Type ~15 words quickly (or shrink the browser window). Older word nodes disappear after scrolling far enough off-screen to the left. Open DevTools → Elements: no accumulation of off-screen `.word-node` divs.

- [ ] **Step 3: Commit**

```bash
git add chain-spell/script.js
git commit -m "feat(chain-spell): prune off-screen word nodes and connectors"
```

---

## Task 11: Timer Expiry & Game Over (Basic)

**Files:**
- Modify: `chain-spell/script.js`

- [ ] **Step 1: Implement `update` function** (replace empty stub)

```js
function update(dt) {
  if (game.state !== STATE.PLAYING) return;

  // Timer expiry
  if (performance.now() >= game.timerEnd) {
    endGame();
    return;
  }
}

function endGame() {
  setState(STATE.OVER);
  inputEl.disabled = true;
  inputEl.blur();

  // Save best score
  const best = Math.max(game.score, game.best || 0);
  localStorage.setItem('chain-spell', JSON.stringify({ best }));
  bestEl.textContent = `BEST: ${best}`;

  // Shatter (Task 16) — stub for now: just show summary
  if (game.chain.length === 0) {
    showScoreSummary(); // Task 17
  } else {
    showScoreSummary(); // shatter added in Task 16
  }
}

function showScoreSummary() { /* stub — Task 17 */ }
```

- [ ] **Step 2: Verify** — Type one word then wait for the 15-second timer to drain to zero. The timer hits zero, input is disabled. Console shows no errors. (Summary overlay added in Task 17.)

- [ ] **Step 3: Commit**

```bash
git add chain-spell/script.js
git commit -m "feat(chain-spell): timer expiry, endGame stub, save best score"
```

---

## Task 12: Level Progression

**Files:**
- Modify: `chain-spell/script.js`
- Modify: `chain-spell/style.css`

- [ ] **Step 1: Add level-up overlay markup to `index.html`**

Add before `</body>`:

```html
<div id="levelup-overlay" aria-hidden="true">
  <div id="levelup-text">LEVEL 2</div>
</div>
```

- [ ] **Step 2: Add level-up overlay styles**

```css
/* ── Level-up overlay ────────────────────────────────────────────── */
#levelup-overlay {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 10;
  align-items: center;
  justify-content: center;
  background: rgba(13,13,15,0.7);
}
#levelup-overlay.active { display: flex; }

#levelup-text {
  font-size: clamp(3rem, 10vw, 6rem);
  font-weight: 700;
  letter-spacing: 0.2em;
  color: var(--accent);
  animation: level-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
}

@keyframes level-pop {
  from { transform: scale(0.75); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}
```

- [ ] **Step 3: Add `triggerLevelUp` function to section 5**

```js
const levelupOverlay = document.getElementById('levelup-overlay');
const levelupText    = document.getElementById('levelup-text');

function triggerLevelUp() {
  setState(STATE.LEVELUP);
  levelupText.textContent = `LEVEL ${game.level}`;
  levelupText.style.animation = 'none';
  void levelupText.offsetWidth;
  levelupText.style.animation = '';
  levelupOverlay.classList.add('active');
  levelEl.textContent = `LVL ${game.level}`;

  setTimeout(() => {
    levelupOverlay.classList.remove('active');
    const ceiling = timerCeiling(game.level);
    game.timerDuration = ceiling;
    game.timerEnd = performance.now() + ceiling;
    game.lastPulseSecond = 3;
    setState(STATE.PLAYING);
  }, 900);
}
```

- [ ] **Step 4: Call `triggerLevelUp` from `acceptWord`**

In `acceptWord`, replace the comment `// Level-up overlay fired in Task 11` with:

```js
triggerLevelUp();
```

- [ ] **Step 5: Verify** — Type 5 words. "LEVEL 2" overlay appears with a pop animation, then dismisses. Timer resets to 14.5s (ceiling at level 2). After 5 more words, "LEVEL 3" overlay. Timer at level 20+ holds at 5s minimum.

- [ ] **Step 6: Commit**

```bash
git add chain-spell/index.html chain-spell/style.css chain-spell/script.js
git commit -m "feat(chain-spell): level-up overlay with timer ceiling tightening"
```

---

## Task 13: Audio

**Files:**
- Modify: `chain-spell/script.js`

- [ ] **Step 1: Add AudioContext setup and sound functions** (section 4)

```js
let audioCtx = null;

function unlockAudio() {
  if (audioCtx) return;
  audioCtx = new AudioContext();
}
document.addEventListener('keydown', unlockAudio, { once: true });

function playTone(freq, type = 'sine', duration = 0.1, gain = 0.25, startDelay = 0) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const env = audioCtx.createGain();
  osc.connect(env); env.connect(audioCtx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startDelay);
  env.gain.setValueAtTime(gain, audioCtx.currentTime + startDelay);
  env.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startDelay + duration);
  osc.start(audioCtx.currentTime + startDelay);
  osc.stop(audioCtx.currentTime + startDelay + duration);
}

function sfxAccept() {
  playTone(220, 'sine', 0.08, 0.2);
  playTone(440, 'sine', 0.1,  0.2, 0.06);
}

function sfxInvalid() {
  playTone(180, 'square', 0.08, 0.15);
}

function sfxDupe() {
  playTone(220, 'square', 0.08, 0.15);
}

function sfxLevelUp() {
  playTone(300, 'sine', 0.1, 0.18);
  playTone(450, 'sine', 0.1, 0.18, 0.08);
  playTone(600, 'sine', 0.1, 0.18, 0.16);
}

function sfxTimerPulse() {
  playTone(440, 'sine', 0.06, 0.08);
}

function sfxGameOver() {
  const osc = audioCtx && audioCtx.createOscillator();
  if (!osc) return;
  const env = audioCtx.createGain();
  osc.connect(env); env.connect(audioCtx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.8);
  env.gain.setValueAtTime(0.2, audioCtx.currentTime);
  env.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.8);
}
```

- [ ] **Step 2: Wire up sounds to events**

In `acceptWord`: add `sfxAccept();` before `addWordNode`.

In `flashInput`: add to the `if (type !== 'valid')` branch:
```js
if (type === 'dupe') sfxDupe(); else sfxInvalid();
```

In `triggerLevelUp`: add `sfxLevelUp();` before the setTimeout.

In `endGame`: add `sfxGameOver();`.

- [ ] **Step 3: Add low-timer pulse to `update`**

In the `update` function, after the timer expiry check:

```js
// Low-timer pulse (≤3s remaining)
const remaining = game.timerEnd - performance.now();
if (remaining <= 3000 && remaining > 0) {
  const pulseSecond = Math.ceil(remaining / 1000);
  if (pulseSecond !== game.lastPulseSecond) {
    game.lastPulseSecond = pulseSecond;
    sfxTimerPulse();
  }
}
```

- [ ] **Step 4: Verify** — Type words and listen: accept sound on valid submission, buzz on invalid, higher buzz on duplicate. After 5 words, rising three-note level-up sound. Let timer drain to 3s — three quiet pulses. Let it hit zero — descending glide.

- [ ] **Step 5: Commit**

```bash
git add chain-spell/script.js
git commit -m "feat(chain-spell): Web Audio sound effects for all game events"
```

---

## Task 14: Scoring & Persistence

**Files:**
- Modify: `chain-spell/script.js`

Scoring logic is already wired into `acceptWord`. This task ensures `best` is loaded on startup and the display is correct.

- [ ] **Step 1: Load best on init** — `startGame()` already loads from `localStorage`. Verify in the browser: type some words, let the game end, reload — best score persists.

- [ ] **Step 2: Expose `best` on game object**

In `defaultState()`, add: `best: 0`.

In `startGame()`, update:

```js
const saved = JSON.parse(localStorage.getItem('chain-spell') || '{}');
game.best = saved.best || 0;
bestEl.textContent = `BEST: ${game.best}`;
```

- [ ] **Step 3: Verify** — Play two rounds. In round 2, the BEST display shows round 1's score. Reload — best persists.

- [ ] **Step 4: Commit**

```bash
git add chain-spell/script.js
git commit -m "feat(chain-spell): score persistence with localStorage best tracking"
```

---

## Task 15: Shatter Animation

**Files:**
- Modify: `chain-spell/script.js`
- Modify: `chain-spell/style.css`

- [ ] **Step 1: Add shatter transition style**

```css
/* ── Shatter nodes ───────────────────────────────────────────────── */
.word-node.shattering {
  position: fixed;
  transition: none !important;
  pointer-events: none;
}
```

- [ ] **Step 2: Implement `buildShatterNodes`**

Add to `endGame()`, replacing the stub call to `showScoreSummary()` for the non-empty chain case:

```js
function buildShatterNodes() {
  game.chain.forEach(entry => {
    if (!entry.el) return;
    const rect = entry.el.getBoundingClientRect();
    entry.el.classList.add('shattering');
    entry.el.style.left   = `${rect.left}px`;
    entry.el.style.top    = `${rect.top}px`;
    entry.el.style.transform = 'none';

    game.shatterNodes.push({
      el:      entry.el,
      vx:      (Math.random() - 0.5) * 400,
      vy:      (Math.random() - 0.8) * 300,
      vr:      (Math.random() - 0.5) * 360,
      elapsed: 0,
    });
    entry.el = null;
  });
}
```

- [ ] **Step 3: Update `endGame` to build shatter nodes**

```js
function endGame() {
  setState(STATE.OVER);
  inputEl.disabled = true;
  inputEl.blur();
  sfxGameOver();

  const best = Math.max(game.score, game.best || 0);
  localStorage.setItem('chain-spell', JSON.stringify({ best }));
  game.best = best;
  bestEl.textContent = `BEST: ${best}`;

  if (game.chain.length === 0 || game.chain.every(e => !e.el)) {
    showScoreSummary();
  } else {
    buildShatterNodes();
    // showScoreSummary called from update when shatter is done
  }
}
```

- [ ] **Step 4: Add shatter physics to `update`**

```js
function updateShatter(dt) {
  const DURATION = 0.6;
  let allDone = true;

  game.shatterNodes.forEach(n => {
    n.elapsed += dt;
    const t = n.elapsed;
    const opacity = Math.max(0, 1 - t / DURATION);
    n.el.style.transform = `translate(${n.vx * t}px, ${n.vy * t + 200 * t * t}px) rotate(${n.vr * t}deg)`;
    n.el.style.opacity = String(opacity);
    if (opacity > 0) allDone = false;
  });

  if (allDone && game.shatterNodes.length > 0) {
    game.shatterNodes.forEach(n => n.el.remove());
    game.shatterNodes = [];
    showScoreSummary();
  }
}
```

- [ ] **Step 5: Call `updateShatter` from `update`**

```js
if (game.state === STATE.OVER && game.shatterNodes.length > 0) {
  updateShatter(dt);
  return;
}
```

- [ ] **Step 6: Verify** — Play until game over. Word nodes fly off in random directions and fade out over ~600ms. If the chain is empty (no words typed before timer hits zero), the summary appears immediately without a shatter.

- [ ] **Step 7: Commit**

```bash
git add chain-spell/style.css chain-spell/script.js
git commit -m "feat(chain-spell): shatter animation on game over"
```

---

## Task 16: Score Summary & Restart

**Files:**
- Modify: `chain-spell/index.html`
- Modify: `chain-spell/style.css`
- Modify: `chain-spell/script.js`

- [ ] **Step 1: Add summary overlay markup to `index.html`**

```html
<div id="summary-overlay" aria-hidden="true">
  <div id="summary-label">GAME OVER</div>
  <div id="summary-score">0</div>
  <div id="summary-best">BEST: 0</div>
  <div id="summary-detail">LEVEL 1 · 0 WORDS</div>
  <div id="summary-restart">press any key to restart</div>
</div>
```

- [ ] **Step 2: Add summary overlay styles**

```css
/* ── Score summary overlay ───────────────────────────────────────── */
#summary-overlay {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 20;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(13,13,15,0.92);
  animation: fade-in 0.4s ease both;
}
#summary-overlay.active { display: flex; }

@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

#summary-label   { font-size: 0.75rem; letter-spacing: 0.15em; color: var(--muted); }
#summary-score   { font-size: clamp(3rem, 10vw, 5rem); font-weight: 700; }
#summary-best    { font-size: 0.9rem; color: var(--muted); }
#summary-detail  { font-size: 0.75rem; color: var(--muted); letter-spacing: 0.08em; margin-top: 4px; }
#summary-restart { font-size: 0.7rem; color: var(--accent); letter-spacing: 0.1em; margin-top: 24px; }
```

- [ ] **Step 3: Implement `showScoreSummary` in `script.js`**

```js
const summaryOverlay  = document.getElementById('summary-overlay');
const summaryScore    = document.getElementById('summary-score');
const summaryBest     = document.getElementById('summary-best');
const summaryDetail   = document.getElementById('summary-detail');

function showScoreSummary() {
  const wordCount = game.chain.length;
  summaryScore.textContent   = game.score;
  summaryBest.textContent    = `BEST: ${game.best}`;
  summaryDetail.textContent  = `LEVEL ${game.level} · ${wordCount} WORD${wordCount !== 1 ? 'S' : ''}`;
  summaryOverlay.style.animation = 'none';
  void summaryOverlay.offsetWidth;
  summaryOverlay.style.animation = '';
  summaryOverlay.classList.add('active');
}
```

- [ ] **Step 4: Add restart handler**

```js
document.addEventListener('keydown', e => {
  if (game.state === STATE.OVER && game.shatterNodes.length === 0) {
    summaryOverlay.classList.remove('active');
    startGame();
  }
});

summaryOverlay.addEventListener('click', () => {
  if (game.state === STATE.OVER && game.shatterNodes.length === 0) {
    summaryOverlay.classList.remove('active');
    startGame();
  }
});
```

- [ ] **Step 5: Verify** — Let the game end. After shatter completes, the summary overlay fades in with score, best, level, and word count. Press any key → overlay disappears, game resets to IDLE. "CHAIN SPELL" title reappears. Input is re-enabled and focused.

- [ ] **Step 6: Commit**

```bash
git add chain-spell/index.html chain-spell/style.css chain-spell/script.js
git commit -m "feat(chain-spell): score summary overlay and instant restart"
```

---

## Task 17: Pre-Bundle Checklist & Polish

**Files:**
- Modify: any of the three source files as issues are found

Work through the checklist from the spec, playing the game and fixing issues:

- [ ] **Every player action has visual + audio feedback** — submit valid word, submit invalid, submit duplicate, level up, timer expiry. Play-test each.
- [ ] **Game states visually unambiguous** — IDLE (pulsing title, dimmed bar), PLAYING (full UI), LEVELUP (overlay), OVER (summary). No ambiguity.
- [ ] **Score, level, timer always readable during PLAYING** — verify at each state that nothing overlaps or obscures them.
- [ ] **High score persists** — play two rounds, reload, confirm BEST shows correctly.
- [ ] **Instant restart** — game over → press key → instantly playing. No delay, no stuck state.
- [ ] **Difficulty ramps perceptible** — after 5 words, timer ceiling is visibly shorter. After level 10+, it's clearly tighter.
- [ ] **60fps in Chrome** — open DevTools → Performance → record 5 seconds of gameplay. Frame rate stays at 60fps. No jank.
- [ ] **No console errors** — open DevTools console, play a full game, verify zero errors or warnings.
- [ ] **Visual check** — connectors draw at the correct position between letter spans. Pruning removes nodes cleanly. Shatter flies correctly. Level-up overlay pops and dismisses.

Fix any issues found, then commit:

```bash
git add -p   # stage only changed lines
git commit -m "fix(chain-spell): pre-bundle polish fixes"
```

---

## Task 18: Bundle into `game.html`

**Files:**
- Create: `chain-spell/game.html`

- [ ] **Step 1: Read all three source files**

Open `chain-spell/index.html`, `chain-spell/style.css`, `chain-spell/script.js`.

- [ ] **Step 2: Create `chain-spell/game.html`**

Copy `index.html` as the base. Replace:
- `<link rel="stylesheet" href="style.css">` → `<style>` + full contents of `style.css` + `</style>`
- `<script src="script.js"></script>` → `<script>` + full contents of `script.js` + `</script>`

Result: a single self-contained HTML file with no external references.

- [ ] **Step 3: Verify** — Navigate to `chain-spell/` in Explorer (Windows), double-click `game.html`. It opens in Chrome without a server. Full game is playable. No network requests in DevTools → Network tab.

- [ ] **Step 4: Commit**

```bash
git add chain-spell/game.html
git commit -m "feat(chain-spell): bundle into standalone game.html"
```

---

## Task 19: Compound Step

**Files:**
- Modify: `CLAUDE.md`

Before closing the session, answer the compound questions from CLAUDE.md and update the Game Log and any relevant sections:

- [ ] What technique worked better than expected?
- [ ] What did I have to figure out from scratch (that should be documented here)?
- [ ] What did I try that failed or had to be removed?
- [ ] What code snippet proved reusable?
- [ ] Did any guidance in this file slow me down or mislead?
- [ ] Was there a non-obvious problem and solution worth a `docs/solutions/` entry?

- [ ] **Commit**

```bash
git add CLAUDE.md
git commit -m "docs: compound step — Chain Spell lessons"
```
