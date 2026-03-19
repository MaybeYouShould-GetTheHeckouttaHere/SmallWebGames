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
  lastPulseSecond:0,  // last integer-second at which low-timer pulse fired
  levelUpPausedAt:0,  // reserved; not currently used for timer compensation
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
  if (!lastTime) { lastTime = ts; requestAnimationFrame(loop); return; }
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
