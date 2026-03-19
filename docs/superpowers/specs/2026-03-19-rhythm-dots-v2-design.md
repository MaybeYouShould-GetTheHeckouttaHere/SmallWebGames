---
title: Rhythm Dots v2 — Difficulty Presets, Grace Period, No-Overlap Spawn, Click Cooldown
game: Rhythm Dots
tags: [difficulty, input, spawn, game-feel, stress]
---

# Rhythm Dots v2 Feature Spec

## Overview

Four improvements to Rhythm Dots that sharpen game feel and add a difficulty axis:

1. **Difficulty presets** — five levels tuning stress and timing parameters, selectable on the start and retry screens
2. **Miss grace period** — a 50 ms ghost window after dot expiry that absorbs a follow-up click on the dead dot's position
3. **No-overlap spawn** — dot hit circles never overlap at spawn time
4. **Click cooldown** — a 60 ms lockout after an empty-space miss to prevent accidental double-penalties

All four features are additive changes to `script.js` and `style.css`. No structural changes to `index.html`. Bundle `game.html` is rebuilt last.

---

## Feature 1: Difficulty Presets

### Config object

Replace the bare top-level stress/timing constants with a `DIFFICULTIES` map. Each entry is a flat config object. The **Easy** entry reproduces current values exactly.

```js
const DIFFICULTIES = {
  'V. Easy': {
    color: 'hsl(220,70%,55%)',
    hitWindow: 0.900, timingGood: 0.750, timingPerfect: 0.600,
    stressMissAdd: 0.15, stressMehAdd: 0.04,
    stressGoodSub: 0.10, stressExcellentSub: 0.18, stressPerfectSub: 0.28,
    stressStreakGood: 0.18, stressStreakExcellent: 0.25, stressStreakPerfect: 0.32,
    stressDriftPerSec: 0.006, stressDecayPerSec: 0.006, stressCalmThreshold: 2.0,
    lifeRecoveryInterval: 30,
    timeCompressInterval: 400, timeCompressFactor: 0.96, timeCompressMinFrac: 0.50,
  },
  'Easy': {
    color: 'hsl(200,70%,60%)',
    hitWindow: 0.700, timingGood: 0.600, timingPerfect: 0.500,
    stressMissAdd: 0.30, stressMehAdd: 0.08,
    stressGoodSub: 0.05, stressExcellentSub: 0.10, stressPerfectSub: 0.15,
    stressStreakGood: 0.15, stressStreakExcellent: 0.20, stressStreakPerfect: 0.25,
    stressDriftPerSec: 0.012, stressDecayPerSec: 0.004, stressCalmThreshold: 3.0,
    lifeRecoveryInterval: 50,
    timeCompressInterval: 200, timeCompressFactor: 0.90, timeCompressMinFrac: 0.40,
  },
  'Normal': {
    color: 'hsl(140,60%,50%)',
    hitWindow: 0.500, timingGood: 0.420, timingPerfect: 0.330,
    stressMissAdd: 0.45, stressMehAdd: 0.14,
    stressGoodSub: 0.04, stressExcellentSub: 0.08, stressPerfectSub: 0.12,
    stressStreakGood: 0.12, stressStreakExcellent: 0.16, stressStreakPerfect: 0.20,
    stressDriftPerSec: 0.018, stressDecayPerSec: 0.003, stressCalmThreshold: 3.5,
    lifeRecoveryInterval: 80,
    timeCompressInterval: 150, timeCompressFactor: 0.85, timeCompressMinFrac: 0.35,
  },
  'Hard': {
    color: 'hsl(30,80%,55%)',
    hitWindow: 0.350, timingGood: 0.280, timingPerfect: 0.200,
    stressMissAdd: 0.60, stressMehAdd: 0.22,
    stressGoodSub: 0.03, stressExcellentSub: 0.06, stressPerfectSub: 0.09,
    stressStreakGood: 0.10, stressStreakExcellent: 0.13, stressStreakPerfect: 0.16,
    stressDriftPerSec: 0.025, stressDecayPerSec: 0.002, stressCalmThreshold: 4.0,
    lifeRecoveryInterval: 130,
    timeCompressInterval: 100, timeCompressFactor: 0.80, timeCompressMinFrac: 0.30,
  },
  'V. Hard': {
    color: 'hsl(0,70%,55%)',
    hitWindow: 0.220, timingGood: 0.170, timingPerfect: 0.110,
    stressMissAdd: 0.75, stressMehAdd: 0.32,
    stressGoodSub: 0.02, stressExcellentSub: 0.04, stressPerfectSub: 0.06,
    stressStreakGood: 0.08, stressStreakExcellent: 0.10, stressStreakPerfect: 0.13,
    stressDriftPerSec: 0.035, stressDecayPerSec: 0.001, stressCalmThreshold: 5.0,
    lifeRecoveryInterval: 200,
    timeCompressInterval: 60, timeCompressFactor: 0.75, timeCompressMinFrac: 0.25,
  },
};
const DIFFICULTY_KEYS = Object.keys(DIFFICULTIES); // ordered array
```

### Active config

`game.cfg` holds the active config object (set at `startGame`). All functions that currently read bare stress/timing constants are updated to read `game.cfg.X` instead. The dynamic getters become:

```js
function getHitWindow()     { return game.cfg.hitWindow     * game.hitWindowMult; }
function getTimingGood()    { return game.cfg.timingGood    * game.hitWindowMult; }
function getTimingPerfect() { return game.cfg.timingPerfect * game.hitWindowMult; }
```

`STRESS_DIST_SCALE` (currently `0.12`) is **not** per-difficulty — it remains a bare constant. Its role (scaling the distance-stress contribution) does not need to vary across difficulty levels.

#### Complete constant migration table

Every bare constant below is deleted from the top of the file and replaced with a `game.cfg.*` read at every call site. Do a global search-and-replace for each:

| Old bare constant | New `game.cfg` field | Call sites |
|---|---|---|
| `HIT_WINDOW` | `game.cfg.hitWindow` | `getHitWindow()` |
| `TIMING_GOOD` | `game.cfg.timingGood` | `getTimingGood()` |
| `TIMING_PERFECT` | `game.cfg.timingPerfect` | `getTimingPerfect()` |
| `STRESS_MISS_ADD` | `game.cfg.stressMissAdd` | `registerMiss()` |
| `STRESS_MEH_ADD` | `game.cfg.stressMehAdd` | `handleClick()` hit-handler |
| `STRESS_GOOD_SUB` | `game.cfg.stressGoodSub` | `handleClick()` hit-handler |
| `STRESS_EXCELLENT_SUB` | `game.cfg.stressExcellentSub` | `handleClick()` hit-handler |
| `STRESS_PERFECT_SUB` | `game.cfg.stressPerfectSub` | `handleClick()` hit-handler |
| `STRESS_STREAK_GOOD` | `game.cfg.stressStreakGood` | `checkStreakBonus()` |
| `STRESS_STREAK_EXCELLENT` | `game.cfg.stressStreakExcellent` | `checkStreakBonus()` |
| `STRESS_STREAK_PERFECT` | `game.cfg.stressStreakPerfect` | `checkStreakBonus()` |
| `STRESS_DRIFT_PER_SEC` | `game.cfg.stressDriftPerSec` | game loop passive-stress block |
| `STRESS_DECAY_PER_SEC` | `game.cfg.stressDecayPerSec` | game loop passive-stress block |
| `STRESS_CALM_THRESHOLD` | `game.cfg.stressCalmThreshold` | game loop passive-stress block |
| `LIFE_RECOVERY_INTERVAL` | `game.cfg.lifeRecoveryInterval` | `addScore()` — both the threshold check and the `+= ...` increment |
| `TIME_COMPRESS_INTERVAL` | `game.cfg.timeCompressInterval` | `addScore()` — both the threshold check and the `+= ...` increment |
| `TIME_COMPRESS_FACTOR` | `game.cfg.timeCompressFactor` | `addScore()` |
| `TIME_COMPRESS_MIN_FRAC` | `game.cfg.timeCompressMinFrac` | `addScore()` |

`STRESS_DIST_SCALE`, `STRESS_SPAWN_MIN_SPREAD`, and `STRESS_SPAWN_MAX_SPREAD` are **not** in the table — they remain bare constants.

### Initialization order

`defaultState()` currently seeds `nextLifeScore` and `nextCompressScore` from bare constants. After the refactor, `startGame()` must:

1. Set `game.cfg = DIFFICULTIES[selectedDifficulty]`
2. Then call `Object.assign(game, defaultState())` — **but** `defaultState()` still references bare constants for those two fields. To avoid this, `startGame()` re-initializes them from `game.cfg` immediately after `defaultState()`:

```js
function startGame() {
  ensureAudio();
  game = defaultState();
  game.cfg = DIFFICULTIES[selectedDifficulty];
  game.nextLifeScore     = game.cfg.lifeRecoveryInterval;
  game.nextCompressScore = game.cfg.timeCompressInterval;
  // ... rest of startGame
}
```

`defaultState()` must use `nextLifeScore: 0` and `nextCompressScore: 0` as placeholder zeros. The bare constants `LIFE_RECOVERY_INTERVAL` and `TIME_COMPRESS_INTERVAL` are deleted from the file, so leaving them in `defaultState()` would throw a ReferenceError. The `startGame()` overwrite is authoritative.

### Persistence

`selectedDifficulty` is a module-level variable (not in `game` state — it persists across restarts). Default: `'Easy'`. Saved to and loaded from `localStorage` key `'rhythm-dots-difficulty'`.

### UI

Both the IDLE and OVER overlay render a difficulty selector row above the instruction line. Five buttons, each labeled with the difficulty name, colored with the difficulty's `color` value. The selected button has a white border and full-opacity text; others are dimmer (60% opacity, no border).

Clicking a button sets `selectedDifficulty`, saves it to `localStorage`, and re-renders the overlay (does not start the game). Space or a field-click starts the game with the current `selectedDifficulty`.

#### Event binding for difficulty buttons

`renderOverlay` uses `innerHTML` assignment. After setting `content.innerHTML`, attach button listeners with `querySelectorAll`:

```js
content.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation(); // prevent click reaching onClickAnywhere
    selectedDifficulty = btn.dataset.diff;
    localStorage.setItem('rhythm-dots-difficulty', selectedDifficulty);
    renderOverlay();
  });
});
```

`e.stopPropagation()` is required — without it, the click bubbles up to `onClickAnywhere` which would immediately call `startGame()`, defeating the selection-before-start flow. Each button carries `data-diff="<difficulty key>"` set in the `innerHTML` template.

#### CSS additions (`style.css`)

```css
.diff-row {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: 20px 0 16px;
}

.diff-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 2px solid transparent;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  background: transparent;
  opacity: 0.55;
  transition: opacity 0.15s, border-color 0.15s;
}

.diff-btn.selected {
  border-color: hsl(0,0%,90%);
  opacity: 1;
}
```

Button `color` and `border-color` (when selected) use inline styles set from `difficulty.color`.

---

## Feature 2: Miss Grace Period (50 ms)

### Data

`game.ghosts`: array of `{ x, y, hitRadius, expiresAt }` where `expiresAt = performance.now() + 50`.

`performance.now()` is used intentionally here (not `audioCtx.currentTime`) because the grace window is a pure wall-clock timeout with no audio scheduling involved. Both clocks advance at the same rate, so the 50 ms window is accurate.

Added to `defaultState()`. Cleared in `clearDots()` alongside dot cleanup.

### Ghost creation

In `updateDots`, in the **first pass** (marking expired dots), push a ghost immediately when setting `dot.state = 'miss'`:

```js
game.ghosts.push({ x: dot.x, y: dot.y, hitRadius: dot.hitRadius, expiresAt: performance.now() + 50 });
```

Ghosts are created before `registerMiss()` fires so they are available if the click arrives on the same frame.

### Click absorption

In `handleClick`, inserted between the live-dot hit loop and the empty-space miss path:

```js
// Prune stale ghosts
game.ghosts = game.ghosts.filter(g => performance.now() < g.expiresAt);

// Ghost hit check
const ghostIdx = game.ghosts.findIndex(g => Math.hypot(cx - g.x, cy - g.y) <= g.hitRadius);
if (ghostIdx >= 0) {
  game.ghosts.splice(ghostIdx, 1);
  return; // absorbed — no extra miss, no ripple
}
```

No visual feedback on ghost absorption (intentional).

---

## Feature 3: No-Overlap Spawn

### Algorithm

In `spawnDot`, after the initial random position is generated, run a rejection-sampling loop (max 20 attempts). On each attempt, check the candidate position against all live dots:

```js
function overlaps(x, y, r, dots) {
  return dots.some(d => Math.hypot(x - d.x, y - d.y) < r + d.hitRadius);
}
```

If the candidate overlaps, generate a new random position. If all 20 attempts overlap, use the candidate with the greatest minimum clearance (best of the 20).

The `hitRadius` used for the new dot is `getHitRadius()` (same as today). The spawn region uses `margin = 120` as today.

---

## Feature 4: Click Cooldown (60 ms)

### Data

`game.lastMissClickAt`: `DOMHighResTimeStamp`, initialized to `0` in `defaultState()`.

### Logic

In `handleClick`, replace the current `if (!hit) { registerMiss(); spawnRipple(cx, cy); }` tail with:

```js
if (!hit) {
  if (performance.now() - game.lastMissClickAt < 60) return; // cooldown — silent
  game.lastMissClickAt = performance.now();
  registerMiss();
  spawnRipple(cx, cy);
}
```

The cooldown only gates the empty-space miss path. Clicking a live dot always registers.

---

## Implementation order

1. `DIFFICULTIES` config + `game.cfg` wiring (replaces bare constants)
2. Difficulty selector UI in `renderOverlay` + CSS
3. `game.ghosts` — `defaultState`, `clearDots`, ghost creation in `updateDots`, absorption in `handleClick`
4. No-overlap spawn in `spawnDot`
5. Click cooldown in `handleClick`
6. Rebuild `game.html`

---

## Checklist before bundling

- [ ] Difficulty selection persists across page reload
- [ ] Difficulty selector appears on both start and game-over screens
- [ ] Starting with V. Hard noticeably shrinks the timing window vs Easy
- [ ] Grace period absorbs a click landing on an expired dot's position within 50 ms
- [ ] Two dots never visually overlap at spawn
- [ ] Rapid double-click on empty space only costs 1 life
- [ ] No console errors
