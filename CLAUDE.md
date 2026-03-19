# Small Web Games — Development Guide

## Compound Engineering

This file is a living document. It compounds — each game built here deposits lessons that raise the starting point for the next one. That is the core principle: **every unit of work makes subsequent work easier, not harder.**

### The loop

Every game follows four phases:

1. **Plan** — read this file, understand the game's mechanic, write a spec
2. **Build** — implement in `index.html` + `style.css` + `script.js`
3. **Review** — run the pre-bundle checklist, play-test, fix issues
4. **Compound** — before closing the session, update this file

### The compound step (mandatory before bundling)

After every completed game, answer these questions and act on the answers:

- **What technique worked better than expected?** → Promote it to a named pattern in the relevant section.
- **What did I have to figure out from scratch?** → It should have been here. Add it now.
- **What did I try that failed or had to be removed?** → Add it to the Anti-patterns section.
- **What code snippet proved reusable?** → Add it to the relevant section's code blocks.
- **Did any guidance in this file slow me down or mislead?** → Fix or remove it.
- **Was there a non-obvious problem and solution?** → Document it in `docs/solutions/` (see below).

Do not add things speculatively. Only write what was learned from a real game. Keep this file short and alive — prune stale entries as the project evolves.

### Solutions library

For non-trivial problems that took real effort to solve, create a file in `docs/solutions/`:

```
docs/solutions/YYYY-MM-DD-short-description.md
```

Use this frontmatter:
```yaml
---
title: Short description of the problem
game: which game this came from
tags: [audio, timing, svg, animation, state, ...]
---
```

Then describe: the problem, what failed, what worked, and the reusable pattern. Future planning phases reference this directory automatically.

---

## Philosophy

Build games that feel premium despite having no assets, no dependencies, and living in a single HTML file. The constraint is the design: every technique must earn its place. Polish is not decoration — it is feedback, clarity, and responsiveness made tangible.

**The bar:** a stranger should open the file, play for 30 seconds, and think it came from a professional studio.

---

## Development Pipeline

Games are developed in three separate files, then bundled into one.

### Working files
```
index.html   — structure and markup only
style.css    — all styles
script.js    — all game logic
```

### Final deliverable
```
game.html    — single self-contained file with everything inlined
```

### Bundle step
When the game is complete and polished, inline the CSS into a `<style>` block and JS into a `<script>` block inside a single `game.html`. No external references. The file must open and run by double-clicking.

Do not start with `game.html`. Develop in the three-file structure, bundle last.

---

## Visual Design

### Rendering target
Default to **SVG** for interactive/animated elements and **Canvas** for particle-heavy or pixel-level effects. SVG gives you DOM events, CSS animations, and SMIL for free. Use both in the same game when it makes sense.

### Asset-free aesthetics
Never use image files. Build all visuals from:
- SVG primitives: `circle`, `rect`, `path`, `polygon`, `line`
- CSS/SVG gradients: `radialGradient` for glow and depth, `linearGradient` for surface sheen
- CSS `filter: blur()` + a colored shape = glow effect
- `stroke-dasharray` / `stroke-dashoffset` for progress rings and draw-on animations
- CSS `clip-path` for interesting shapes without extra markup

### Color
- Use a **limited palette**: 1 background, 1–2 mid tones, 1–2 accent colors. Four to five total.
- Dark backgrounds (near-black, deep navy, deep purple) make colors pop and reduce eye strain.
- One color does the heavy lifting (primary accent); others support or contrast.
- Use HSL in code — it makes programmatic color manipulation readable: `hsl(210, 80%, 60%)`.
- Signal states with color shifts (hue rotation, saturation drop) rather than new colors.

### Motion
- **Never use `linear` easing.** Default to `ease-out` for things entering, `ease-in` for things leaving, `ease-in-out` for oscillating elements.
- Every spawn gets a scale-in bounce: scale from 0 → 1.1 → 1.0.
- Every hit/collect gets a scale pulse: 1.0 → 1.3 → 0 or back to 1.0.
- CSS custom properties (`--t`) driven by JS make animation state easy to sync.
- Prefer `transform` and `opacity` for animation — they don't trigger layout reflow.

### Typography
- One font stack: `system-ui, -apple-system, sans-serif`. No imports.
- Two weights maximum: regular and bold.
- Score/timer: large, top-center or top-corners, always visible.
- Labels: small, muted, secondary color. Never compete with the game field.

---

## Game Feel (Juice)

Juice is the layer of feedback that makes actions feel satisfying. It does not change game rules — it amplifies them.

### Core rule
**Every meaningful player action must produce at least two simultaneous responses**: one visual, one audio. Clicking a target should spawn a particle burst *and* play a sound.

### Techniques

| Effect | When to use |
|---|---|
| Screen shake | Impact, failure, explosion |
| Scale bounce | Spawning, collecting, scoring |
| Squash & stretch | Bouncing objects, character movement |
| Flash to white/accent | Hit confirmation |
| Trail / motion blur | Fast-moving objects |
| Particles | Collection, destruction, combo |
| Number pop | Score gain, combo text |
| Eased camera/follow | Any viewport tracking |

### Screen shake
```js
// Simple trauma-based screen shake
let trauma = 0;
function applyShake(amount) { trauma = Math.min(1, trauma + amount); }
function updateShake() {
  trauma *= 0.9; // decay
  const shake = trauma * trauma;
  svg.style.transform = `translate(${rand(-8,8)*shake}px, ${rand(-4,4)*shake}px)`;
}
```

### Timing
- Hit windows, grace periods, and forgiveness windows should be *generous at first* and tighten with difficulty. Players need to feel competent before they feel challenged.
- "Coyote time" (brief input window after the correct moment has passed) makes timing games feel fair.

---

## Audio

All audio is synthesized with the **Web Audio API**. No audio files.

### Initialization
```js
let ctx;
function unlockAudio() {
  ctx = new AudioContext();
  document.removeEventListener('click', unlockAudio);
}
document.addEventListener('click', unlockAudio);
```
Always initialize AudioContext on a user gesture — browsers block autoplay.

### Synthesized SFX pattern
```js
function playTone(freq, type = 'sine', duration = 0.1, gain = 0.3) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.connect(env); env.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  env.gain.setValueAtTime(gain, ctx.currentTime);
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}
```

### Sound palette
A complete game needs only **4–6 sounds**. Common set:
- `click / confirm` — short sine blip, ~200Hz, 80ms
- `success / score` — ascending two-tone, ~440 + 660Hz
- `miss / fail` — descending, square wave, ~200→100Hz
- `game over` — slow descending arpeggio or low buzz
- `level up` — rising chord sweep
- `ambient tick` — very quiet sine pulse on each beat (rhythm games)

### Drift-free timing
For rhythm-dependent games, use `AudioContext.currentTime` as the master clock — not `Date.now()` or `setInterval`. Drift accumulates with JS timers; AudioContext does not drift.

---

## Code Architecture

### File structure (`script.js`)
Organize code in this order:
```
1. Constants & config
2. State variables
3. AudioContext setup
4. Game state machine
5. Input handlers
6. Game update logic
7. Render logic
8. Particle / effect system
9. Game loop (requestAnimationFrame)
10. Init / start
```

### Game loop
```js
let lastTime = 0;
const TICK = 1000 / 60; // 16.67ms fixed timestep
let accumulator = 0;

function loop(timestamp) {
  const dt = Math.min(timestamp - lastTime, 100); // cap at 100ms to avoid spiral
  lastTime = timestamp;
  accumulator += dt;
  while (accumulator >= TICK) {
    update(TICK / 1000); // update with fixed dt in seconds
    accumulator -= TICK;
  }
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

> **Audio-driven games:** When `audioCtx.currentTime` is the master clock, variable-dt with a 100ms cap is sufficient. The fixed-timestep accumulator adds complexity without benefit — the beat scheduler already provides frame-independent timing. Use variable-dt for rhythm games.

### State machine
Use a string enum, never multiple booleans.
```js
const STATE = { IDLE: 'idle', PLAYING: 'playing', PAUSED: 'paused', OVER: 'over' };
let state = STATE.IDLE;

function setState(next) {
  state = next;
  render(); // always re-render on state change
}
```

### Input
Bind all input in one place. Never inline event handlers in HTML. Unbind what you rebind.

### Persistence
```js
const scores = JSON.parse(localStorage.getItem('scores') || '{}');
function saveScore(game, score) {
  scores[game] = Math.max(score, scores[game] || 0);
  localStorage.setItem('scores', JSON.stringify(scores));
}
```

### No globals creep
Keep all mutable state in one `game` object. Makes reset trivial: `Object.assign(game, defaultState())`.

---

## Progression & Difficulty

- Introduce **one mechanic at a time**. The player should master step N before step N+1 appears.
- Difficulty increases must be **visually signaled** — a color shift, a sound cue, a brief on-screen indicator. Never surprise the player.
- Use a **formula, not a lookup table**. Difficulty as a function of score/time is easier to tune: `speed = BASE + Math.floor(score / 500) * STEP`.
- Cap difficulty. There is a ceiling where the game is mechanically maxed out — signal this and shift to pure endurance.
- **Instant restart**: game over → playable in one keypress or tap. Zero friction. No confirm dialogs.
- Show the **high score alongside the current score** at all times. The personal record is the primary motivator for replaying.

---

## UX Conventions

- **Score and timer are always visible** during play. Never obscured by effects.
- The player must always know: am I playing right now? Use visual state clearly (dimmed overlay = paused/over, no overlay = playing).
- **No loading screens**. If the page is loaded, the game is ready.
- A brief **intro/idle animation** on the start screen makes the game feel alive before the first click.
- Instructions must fit in **one line** or a 3-bullet list. If you need more, simplify the mechanic.
- **Feedback for errors** (wrong input, miss) must be immediate — less than one frame delay.

---

## Performance

- Target **60 fps**. If it drops below 60, cut visual complexity, not game logic.
- Animate with `transform` and `opacity` only — these are GPU-composited and do not trigger layout.
- For SVG: update element attributes in the render pass only, never in update(). Batch DOM writes.
- For Canvas: clear only what changed when possible; full `clearRect` is fine for simple games.
- Particle systems: use an **object pool** — pre-allocate particles and reuse them. Never `new Particle()` in the hot loop.
- Remove elements from the DOM when they're done. Don't leave invisible nodes accumulating.

---

## Checklist Before Bundling

- [ ] Every player action has visual + audio feedback
- [ ] Game states are visually unambiguous
- [ ] Score / timer always readable
- [ ] High score persists across sessions
- [ ] Instant restart works
- [ ] Difficulty ramps are perceptible
- [ ] Runs at 60fps in Chrome on a mid-range laptop
- [ ] No console errors
- [ ] Inline everything into `game.html` — open by double-click, no server required
- [ ] **Compound step complete** — this file updated with lessons from this game

---

## Anti-patterns

> Failures and dead ends learned from real games. Do not repeat these.

### Calling side-effects inside `Array.filter`
Never call `registerMiss()`, `endGame()`, or any state-mutating function inside a `.filter()` callback. If two items match the condition on the same frame, the side-effect fires twice — double audio, double state transitions, lives going to -1. Pattern: separate into (1) mark pass, (2) side-effect pass, (3) filter pass.

### Using array index as a stable DOM identifier
Particle (or any pooled object) DOM elements must use a monotonic ID counter — not array index — as `data-pid`. After `.filter()` compacts the array, indices shift and DOM lookups alias: two live elements claim the same slot, one orphaned element lingers. Use `let particleIdCounter = 0` and `id: particleIdCounter++` at spawn, same as `dotIdCounter` for dots.

### Scheduling audio sounds at `audioCtx.currentTime` when the event is in the future
If a beat is pre-scheduled into a lookahead buffer, its associated sound must also be scheduled at the beat's future AudioContext time — not at `currentTime`. Use the `startOffset` parameter: `playTone(freq, type, duration, gain, beatTime - audioCtx.currentTime)`.

### Leaving `field.style.transform` set when leaving PLAYING state
Screen shake writes `field.style.transform = translate(...)` every frame during PLAYING. When state transitions to OVER or IDLE, the loop stops updating it — freezing the last translate value permanently on screen and into the next game's first frame. Fix: in `setState`, clear `field.style.transform` whenever leaving PLAYING.

### Keeping expired dots alive through a pause/resume cycle
On resume, `audioCtx.currentTime` picks up where it left off. Any dots with `beatTime` values now in the past trigger immediate misses on the first `updateDots` call. Always call `clearDots()` + `clearParticles()` in `resumeGame` before restarting the scheduler.

### No state guard at the top of miss/endGame functions
A `forEach` does not stop when one iteration calls `endGame()`. If two dots expire on the same frame (common with Double Dots at 1 life), the second call to `registerMiss()` runs with `game.state === STATE.OVER`, causing lives to go to −1 and `endGame()` to fire twice (double audio, double save). **Always guard** any function that can trigger `endGame()`:
```js
function registerMiss() {
  if (game.state !== STATE.PLAYING) return;
  // ...
}
```

### `el.style.display = ''` falls back to CSS `display: none`
When a CSS rule sets `display: none` on an element, clearing the inline style with `el.style.display = ''` removes the override and the CSS rule wins — element stays hidden. Always set an explicit value: `el.style.display = 'block'` (or `flex`, `inline`, etc.).

### Creating objects whose consumer is disabled by a modifier
When a modifier disables a code path (e.g., No Grace Period disables ghost absorption in `handleClick`), also gate the *creation* of those objects in `updateDots`. Without the gate, the ghost array grows unboundedly per miss with no pruning path. Gate at the source:
```js
if (!selectedModifiers.noGracePeriod) {
  game.ghosts.push({ ... });
}
```

### Copying a multiplier without verifying its direction
When one modifier tightens a window (×0.5) and another widens it (×1.5), copy-pasting the tight branch for the wide one silently reverses the effect. `getTimingGood` had `×0.5` for `dizziness` copied from `hardTiming`, contradicting the modifier's stated ×1.5 widening. After writing any modifier multiplier, verify: does *smaller* mean harder or easier for this specific value?

---

## Game Log

> One entry per completed game. Each entry names the game, what was learned, and what was added to this file as a result.

### Rhythm Dots — 2026-03-18

First game. Core loop: AudioContext lookahead scheduler + requestAnimationFrame SVG renderer.

**Added to Anti-patterns:** Five patterns (filter side-effects, array-index DOM IDs, audio scheduling offset, frozen transform on state change, resume miss-flood).

**Added to Audio — Drift-free scheduling:** Confirmed that `playTone` must accept a `startOffset` and all beats scheduled into the lookahead buffer must pass their future offset. Tones fired at `currentTime` drift relative to the visual beat.

**Confirmed from Architecture:** The fixed-timestep accumulator loop in the guide was not used — variable-dt with a 100ms cap works fine for a game driven by `audioCtx.currentTime`. The guide's fixed-timestep pattern adds complexity without benefit when the master clock is AudioContext. Consider noting this as optional for audio-driven games.

**Reusable pattern — monotonic pool ID counter:**
```js
let dotIdCounter = 0;
// at spawn:
game.dots.push({ id: dotIdCounter++, ... });
// in render cleanup:
const liveIds = new Set(game.dots.map(d => String(d.id)));
document.querySelectorAll('.dot-group').forEach(el => {
  if (!liveIds.has(el.dataset.id)) el.remove();
});
```
Use this for every pooled object that has a DOM counterpart. Never use array index.

### Rhythm Dots v2 — 2026-03-19

Modifier system, difficulty presets, combo multiplier, stress director, milestone pauses, visual polish.

**Added to Anti-patterns:** Four new patterns (state guard on registerMiss, display='' CSS fallback, creating objects whose consumer is disabled, multiplier direction copy-paste error).

**Reusable pattern — `game.cfg` difficulty config:**
Collect all tunable constants into per-difficulty config objects. Set `game.cfg = DIFFICULTIES[selectedDifficulty]` at `startGame()`. Every function reads `game.cfg.X` instead of bare constants. No if-chains, no scattered magic numbers. Re-seeding score thresholds that derive from config must happen *after* `defaultState()` is called:
```js
function startGame() {
  game = defaultState();
  game.cfg = DIFFICULTIES[selectedDifficulty];
  game.nextLifeScore     = game.cfg.lifeRecoveryInterval;
  game.nextCompressScore = game.cfg.timeCompressInterval;
}
```

**Reusable pattern — modifier system:**
```js
const MODIFIER_DEFAULTS = { shrinkingCircles: false, hardTiming: false, ... };
const MODIFIER_LIST = [
  { id: 'hardTiming', label: 'Hard Timing', group: 'Difficulty',
    desc: 'Hit windows halved.', incompatible: ['dizziness'] },
  // ...
];
let selectedModifiers = { ...MODIFIER_DEFAULTS };
// Load from localStorage on init, save on change.
```
Build the UI dynamically from `MODIFIER_LIST` in `initModifiers()`. Attach `change` listeners that auto-uncheck incompatible modifiers. This pattern scales to any number of modifiers with zero per-modifier UI code.

**Reusable pattern — zone-penalty spawn:**
To bias spawns away from a screen region (HUD, corner counter), add a penalty to the clearance score rather than hard-rejecting. The best-of-N fallback still places dots in the zone if there is no alternative, avoiding softlocks:
```js
const penalty = inZone ? ZONE_PENALTY : 0;   // e.g. 500
const score   = clearance - penalty;
if (score > bestScore) { bestScore = score; best = { x, y }; }
```

**Reusable pattern — wall-clock pause freeze:**
For any timer based on `performance.now()` that must pause with the game, record when the pause started and add the elapsed pause duration on resume:
```js
function pauseGame()  { game.pausedAt = performance.now(); ... }
function resumeGame() {
  if (game.someTimer > 0 && game.pausedAt > 0)
    game.someTimer += performance.now() - game.pausedAt;
  game.pausedAt = 0;
  ...
}
```

**Clock choice — `performance.now()` vs `audioCtx.currentTime`:**
Use `audioCtx.currentTime` for beat scheduling. Use `performance.now()` for everything else: grace windows, click cooldowns, combo timers, UI countdowns, pause tracking. Both clocks advance in real time at the same rate; the distinction is semantic, not functional.

**CSS — custom checkboxes with SVG background-image:**
`::after` pseudo-elements on checkboxes require `position: relative` on the parent, which shifts layout. Use `background-image: url("data:image/svg+xml,...")` on the `:checked` state instead — no positioning side-effects, works in all browsers.

**CSS — tooltips escaping a fixed panel:**
A panel fixed to the screen edge needs `overflow: visible` for tooltips to extend beyond it. `overflow-y: auto` clips any child that overflows even horizontally. If content fits without scrolling (16 items on any modern screen), `overflow: visible` is always correct.
