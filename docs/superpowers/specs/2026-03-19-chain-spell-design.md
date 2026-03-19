---
title: Chain Spell — Game Design Spec
game: chain-spell
tags: [word-game, svg, dom, typography, animation, audio]
date: 2026-03-19
---

# Chain Spell — Design Spec

## Overview

A word-chain typing game where each new word must start with the last letter of the previous word. The mechanic is simple; the design goal is typographic polish. A horizontal chain of accepted words scrolls across the screen, linked by SVG connector curves. Clean, minimal, white-on-dark aesthetic.

---

## Core Mechanic

- Player types a word into a text input and presses Enter to submit.
- Valid submission: word exists in dictionary, starts with the required letter (last letter of the most recent word), has not been used in this game.
- **First word:** no letter constraint — `requiredLetter` is empty at game start. Any valid dictionary word starts the chain. The timer does **not** start until the first word is accepted — the player types their opening word at leisure. On acceptance, `timerEnd` and `timerDuration` are set and `STATE.PLAYING` begins.
- On valid submission: word is added to the chain, timer is reset to the current level ceiling then bonus seconds are added on top (`+word.length × 0.5s`); time can briefly exceed the ceiling and that is intentional — it rewards longer words. **If the submission also triggers a level-up**, do not apply the bonus — call `levelUp()` immediately after scoring the word, which performs a hard timer reset to the new ceiling.
- On invalid submission (wrong letter or not in dictionary): input shakes, **red** border flash, no score penalty — time continues draining.
- On already-used word submission: input shakes, **amber** border flash — visually distinct from wrong-letter errors; audio is also distinct (see Audio section).
- Timer reaches zero: game over, shatter animation, score summary.
- **Restart from OVER:** any keypress or tap during `STATE.OVER` triggers restart. The input is **disabled and blurred** on `endGame()` so keypresses are not swallowed by the input. A global `keydown` listener (or a tap on the score summary) calls `startGame()`, which re-enables the input and focuses it. If the shatter animation is still running, cancel it immediately (stop the animation loop, remove all shatter DOM nodes), clear the chain field, and then call `startGame()`.

### Dictionary

Embedded as `const WORDS = new Set([...])` — ~20k common English words inlined in `script.js`. O(1) lookup. No external fetch required.

### Scoring

- `+word.length × 10` points per accepted word.
- Bonus time on valid submission: timer is first reset to the current level ceiling, then `+word.length × 0.5` seconds are added. Time can exceed the ceiling; this is intentional.

### Level Progression

- Every 5 correct words triggers a level-up.
- Timer ceiling per level: `max(5000, 15000 - level × 500)` ms (tightens by 0.5s per level, floors at 5s).
- Level-up transitions to `STATE.LEVELUP`. The timer bar holds at its current visual fill while in this state (the game loop does not evaluate `timerEnd`). The overlay shows "LEVEL {n}" with scale-in animation (~800ms), then dismisses: `setState(STATE.PLAYING)`, `timerEnd = performance.now() + newCeiling`, `timerDuration = newCeiling`. **Bonus time earned at the triggering word is discarded** — the level-up is a hard timer reset, not a continuation. The `game.levelUpPausedAt` field is not needed for timer compensation (the timer is simply replaced); it exists only if needed for other pause-sensitive fields in future.
- Level is the only difficulty axis.

---

## Idle / Start Screen

During `STATE.IDLE`:
- Chain field is empty.
- The game title "CHAIN SPELL" is displayed centered in the chain field area, large, in the accent blue color, with a gentle opacity pulse animation.
- Input zone shows a one-line instruction beneath the input: `"type any word to begin"`.
- No timer bar is shown (or it is hidden).
- Player starts the game by typing any word into the input and pressing Enter. The first valid dictionary word starts the chain, sets the timer to the level-1 ceiling, and transitions to `STATE.PLAYING`. The timer bar is hidden until this moment.
- No separate "Start" button — the input itself is the entry point.

---

## Visual Design

### Aesthetic

- **Style:** Clean typographic, minimal. White-on-dark. The words are the spectacle.
- **Rendering:** DOM word nodes + SVG overlay for connector paths. Approach chosen for maximum CSS typography control.
- **Font:** `system-ui, -apple-system, sans-serif`. Two weights: regular (chain history) and bold (most recent word).

### Color Palette

| Role | Value |
|---|---|
| Background | `#0d0d0f` |
| Text | `#f5f5f5` |
| Accent (blue) | `hsl(210, 90%, 65%)` |
| Error flash | `hsl(0, 80%, 60%)` |
| Duplicate flash (amber) | `hsl(40, 90%, 60%)` |
| Faded chain history | `rgba(245,245,245,0.2)` at furthest |

### Layout Zones

**Top bar** — score (top-left, with personal best in smaller muted text beneath it), level badge (top-center), timer bar (top-right). Always visible during play.

**Chain field** — middle 60% of screen height. Single horizontal baseline, vertically centered. Words scroll left; the newest word anchors near center-right.

**Input zone** — bottom quarter. Large, clean text input. Dim placeholder shows the required starting letter. A small label below reads: `next word must start with —`. During IDLE, this label reads only the one-line instruction (`"type any word to begin"`); the game title is shown in the chain field area, not here.

### Timer Bar

- Horizontal bar, right side of top bar.
- Width driven by `transform: scaleX(fill)` where `fill = (timerEnd - now) / timerDuration`, clamped 0–1.
- Color: white above 50% → amber at 25% → red at 10% (CSS custom property interpolation).

---

## Word Chain Rendering

### Word Nodes

- Each accepted word is an absolutely positioned `<div class="word-node">` inside the chain field container (`position: relative`).
- The newest word is always anchored near **65% of the container width** (its `left` is set to this value). All older nodes are offset left from there via their own cumulative `transform: translateX(−Npx)`, where N grows with each new word added. Each node maintains its own translateX; there is no shared wrapper.
- On new word accepted: all existing nodes increase their `translateX` by `-(newWordWidth + gap)` (shifting left). GPU-composited, no reflow.
- New word enters at `left: 65% + 120px` then transitions `translateX(120px) → translateX(0)` + `opacity 0 → 1`, ~200ms ease-out.
- **Opacity fade:** words 1–3 positions back fade proportionally toward 20% opacity. Chain reads as a trail.
- **Bold/regular:** newest word is bold; all others regular weight.

### Linking Letter Highlight

- The last letter of every word in the chain is colored blue (accent).
- The first letter of the newest incoming word is also colored blue.
- No explicit instruction needed — the chain rule is self-evident.

### SVG Connector Paths

- SVG overlay: same dimensions as chain field, `pointer-events: none`, sits behind word nodes.
- After each new word's entry animation completes, read screen coordinates via `getBoundingClientRect()` on the last-letter `<span>` of the previous word and the first-letter `<span>` of the new word, then draw or update a `<path>` between those points. The SVG overlay has **no `viewBox`** — its coordinate system matches CSS pixels. Convert `getBoundingClientRect()` results to SVG space by subtracting the overlay's own `getBoundingClientRect().left` and `.top`. Listen for `transitionend` **attached directly to the new node** using `{ once: true }` (not delegated from the container), filtered to `e.propertyName === 'transform'`, to avoid double-firing (opacity also fires `transitionend`), to avoid catching scroll transitions on older nodes, and to prevent the listener accumulating on subsequent leftward shifts of the same node.
- Each connector path has a `data-pair` attribute (e.g. `"2-3"`) matching the chain indices it connects. When a word node is pruned from the DOM (see below), its associated connector path is also removed by matching `data-pair`.
- Shape: cubic bezier curving upward slightly.
- Style: blue accent stroke, 1.5px, ~40% opacity. Connective tissue, not a feature.

### Node Pruning

- Pruning happens once per new word accepted, **before** the `transitionend` listener is attached to the new node. The previous word (n−1) is never eligible for pruning in this pass — its connector to the new word has not yet been drawn. All other nodes are eligible if they meet the position threshold.
- Word nodes whose **right edge has passed more than 300px beyond the container's left edge** are removed from the DOM along with their connector path (matched by `data-pair`). The 300px margin is a hysteresis buffer — it keeps nodes alive well past the visible area so that connectors between still-visible node pairs are never removed. Condition: `node.getBoundingClientRect().right < containerRect.left - 300`. When a node is pruned, its *outgoing* connector (to the next node) is also removed; the next node's *incoming* connector end is visually unconnected but that node will itself be pruned shortly.
- By the time a node qualifies for pruning, its connector path was already drawn on a prior word's `transitionend`. Pruning the node and removing its path is safe.
- This prevents unbounded DOM growth during long sessions and keeps the shatter node set bounded to visible nodes only.

---

## Animations

### Scroll

All word nodes shift left together via `transform: translateX` — a single CSS transition fires on all nodes simultaneously.

### New Word Entry

`translateX(120px) → 0` + `opacity 0 → 1`, 200ms ease-out.

### Level-Up Overlay

Dims chain field, shows "LEVEL {n}" in large text with `scale(0.8) → scale(1)` + `opacity 0 → 1`, ~800ms, then fades out. Timer starts after dismiss.

### Shatter (Game Over)

On timer expiry:
- If `game.chain` is empty (player never accepted a word), skip shatter entirely — show the score summary immediately.
- Otherwise, the existing `.word-node` divs are re-used as shatter objects — no cloning. They are set to `position: fixed` with their current screen coordinates so they detach from flow.
- Each node receives a random velocity vector (stored in `game.shatterNodes`).
- JS-driven each frame: `translate(vx*t, vy*t) rotate(r*t)` + `opacity` fading to 0 over ~600ms.
- Once all nodes reach opacity 0, they are removed from the DOM and the score summary fades in.

### Score Summary (`STATE.OVER`)

A centered overlay fades in over the chain field. Contains (top to bottom):
- **"GAME OVER"** — small, muted label
- **Final score** — large, white, bold
- **"BEST: {highScore}"** — smaller, muted, beneath the score
- **"LEVEL {n} · {wordCount} WORDS"** — small, muted detail line
- **"press any key to restart"** — small, accent blue, at the bottom

No shatter debris remains visible behind the overlay. The input is disabled during this state and re-enabled on restart.

### Score Counter

On accepted word, score counts up via lerp over ~300ms in the render loop. The number itself animates — no pop-up elements.

### Input Feedback

- Valid: input clears, brief blue border flash.
- Invalid (wrong letter / not in dictionary): horizontal shake oscillation (~200ms), red border flash.
- Already used: horizontal shake oscillation (~200ms), amber border flash — visually distinct from invalid.

---

## State Model

```js
const STATE = { IDLE: 'idle', PLAYING: 'playing', LEVELUP: 'levelup', OVER: 'over' };

game = {
  state: STATE.IDLE,
  chain: [{ word }],           // accepted words in order; DOM positions are read via getBoundingClientRect() at render time, not stored
  usedWords: new Set(),
  requiredLetter: '',          // last letter of most recent word; empty string = no constraint (first word); never reset by level-up — the chain letter constraint persists across levels
  score: 0,
  displayScore: 0,             // lerped toward score for animated counter
  level: 1,
  wordsThisLevel: 0,           // resets on level-up
  timerEnd: 0,                 // performance.now() when timer expires; set in startGame() and on each word acceptance and level-up resume
  timerDuration: 0,            // ms allotted for current word; always set together with timerEnd (including in startGame()) so the bar ratio is correct from frame 1
  lastPulseSecond: 0,          // tracks which second the last low-timer pulse fired; prevents per-frame re-triggering
  levelUpPausedAt: 0,          // reserved; timer is replaced (not compensated) on level-up dismiss — do not use a separate `levelingUp` boolean, check `game.state === STATE.LEVELUP` instead
  shatterNodes: [],            // { el, vx, vy, vr, t } — existing .word-node DOM elements mid-shatter with velocity vectors
}
```

---

## Script Architecture

File order per project convention (`script.js`):

1. Constants & config (timer durations, level thresholds, score formula)
2. Dictionary (`const WORDS = new Set([...])`)
3. State variables
4. AudioContext setup
5. Game state machine (`setState`, `startGame`, `levelUp`, `endGame`)
6. Input handler (Enter key on text input)
7. Game update logic (timer countdown, shatter physics)
8. Render logic (chain scroll, SVG paths, timer bar, score lerp)
9. Game loop (`requestAnimationFrame`, variable-dt with 100ms cap)
10. Init

---

## Audio

Web Audio API, initialized on first user gesture.

| Event | Sound |
|---|---|
| Valid word accepted | Ascending two-tone, sine, ~220→440Hz, 120ms |
| Invalid word | Low blip, square wave, ~180Hz, 80ms |
| Already used word | Blip, square wave, ~220Hz, 80ms (slightly higher) |
| Level up | Three-note rising sweep, sine, ~300→450→600Hz, staggered 80ms |
| Timer low (≤3s remaining) | Quiet pulse per second, sine, ~440Hz, 60ms — track `lastPulseSecond = Math.ceil(remaining / 1000)` in state; fire only when it changes to avoid per-frame triggering |
| Game over / shatter | Descending sine glide, ~300→80Hz, 800ms, low gain |

No ambient or looping audio.

---

## UX

- **Instant restart:** game over → one keypress/tap → playing. No confirm dialogs.
- **Personal best:** shown beneath current score at all times during play.
- **High score persistence:** `localStorage`, same key scheme as Rhythm Dots.
- **No loading screens:** dictionary is inlined; page load = game ready.
- **Instructions:** one line below the input field during idle state. Gone during play.

---

## Development Pipeline

```
chain-spell/
  index.html
  style.css
  script.js
```

Bundle step: inline CSS + JS into `chain-spell/game.html`. Opens by double-click, no server.

---

## Pre-Bundle Checklist

- [ ] Every player action has visual + audio feedback
- [ ] Game states visually unambiguous
- [ ] Score / level / timer always readable during play
- [ ] High score persists across sessions
- [ ] Instant restart works
- [ ] Difficulty ramps are perceptible
- [ ] 60fps in Chrome on mid-range laptop
- [ ] No console errors
- [ ] game.html opens by double-click with no server
- [ ] Compound step complete — CLAUDE.md updated
