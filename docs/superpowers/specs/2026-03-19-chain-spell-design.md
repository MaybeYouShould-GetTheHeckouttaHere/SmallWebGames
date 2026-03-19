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
- On valid submission: word is added to the chain, timer resets (+ bonus time), score increases.
- On invalid submission: input shakes, red border flash, no score penalty — time continues draining.
- Timer reaches zero: game over, shatter animation, score summary.

### Dictionary

Embedded as `const WORDS = new Set([...])` — ~20k common English words inlined in `script.js`. O(1) lookup. No external fetch required.

### Scoring

- `+word.length × 10` points per accepted word.
- Bonus time on valid submission: `+word.length × 0.5` seconds added on top of the timer reset.

### Level Progression

- Every 5 correct words triggers a level-up.
- Timer ceiling per level: `max(5000, 15000 - level × 500)` ms (tightens by 0.5s per level, floors at 5s).
- Level-up shows a brief overlay: "LEVEL {n}" with scale-in animation (~800ms), then dismisses and restarts the timer.
- Level is the only difficulty axis.

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
| Faded chain history | `rgba(245,245,245,0.2)` at furthest |

### Layout Zones

**Top bar** — score (top-left), level badge (top-center), timer bar (top-right). Always visible during play.

**Chain field** — middle 60% of screen height. Single horizontal baseline, vertically centered. Words scroll left; the newest word anchors near center-right.

**Input zone** — bottom quarter. Large, clean text input. Dim placeholder shows the required starting letter. A small label below reads: `next word must start with —`.

### Timer Bar

- Horizontal bar, right side of top bar.
- Width driven by `transform: scaleX(fill)` where `fill = (timerEnd - now) / timerDuration`, clamped 0–1.
- Color: white above 50% → amber at 25% → red at 10% (CSS custom property interpolation).

---

## Word Chain Rendering

### Word Nodes

- Each accepted word is an absolutely positioned `<div class="word-node">`.
- On new word accepted: existing nodes translate left by `(newWordWidth + gap)` via `transform: translateX`. GPU-composited, no reflow.
- New word enters: `translateX(120px) → translateX(0)` + `opacity 0 → 1`, ~200ms ease-out.
- **Opacity fade:** words 1–3 positions back fade proportionally toward 20% opacity. Chain reads as a trail.
- **Bold/regular:** newest word is bold; all others regular weight.

### Linking Letter Highlight

- The last letter of every word in the chain is colored blue (accent).
- The first letter of the newest incoming word is also colored blue.
- No explicit instruction needed — the chain rule is self-evident.

### SVG Connector Paths

- SVG overlay: same dimensions as chain field, `pointer-events: none`, sits behind word nodes.
- After each new word settles, a `<path>` is drawn from the last letter of the previous word to the first letter of the new one.
- Shape: cubic bezier curving upward slightly.
- Style: blue accent stroke, 1.5px, ~40% opacity. Connective tissue, not a feature.

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
- Each word node receives a random velocity vector.
- JS-driven each frame: `translate(vx*t, vy*t) rotate(r*t)` + `opacity` fading to 0 over ~600ms.
- Once all nodes are invisible, score summary fades in.

### Score Counter

On accepted word, score counts up via lerp over ~300ms in the render loop. The number itself animates — no pop-up elements.

### Input Feedback

- Valid: input clears, blue border flash.
- Invalid: horizontal shake oscillation (~200ms), red border flash.

---

## State Model

```js
const STATE = { IDLE: 'idle', PLAYING: 'playing', LEVELUP: 'levelup', OVER: 'over' };

game = {
  state: STATE.IDLE,
  chain: [{ word, x }],       // accepted words + their DOM x positions
  usedWords: new Set(),
  requiredLetter: '',          // last letter of most recent word
  score: 0,
  displayScore: 0,             // lerped toward score for animated counter
  level: 1,
  wordsThisLevel: 0,           // resets on level-up
  timerEnd: 0,                 // performance.now() when timer expires
  timerDuration: 0,            // ms allotted for current word
  levelingUp: false,
  shatterParticles: [],        // word nodes mid-shatter
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
| Timer low (≤3s remaining) | Quiet pulse per second, sine, ~440Hz, 60ms |
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
