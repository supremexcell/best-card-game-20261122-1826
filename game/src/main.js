// Boot and the game flow: title -> play -> AI turn (intent banner first,
// then the AI acts) -> win/loss. ?seed=N fixes the shuffle; ?shot=title|
// cover|win|loss (with &seed=N) stages that scene instead of running the
// game, paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY } from './config.js';
import { createRandom } from './random.js';
import {
  PHASE_AI, PHASE_LOSS, PHASE_PLAY, PHASE_WIN, aiTakeTurn, createGame,
  endPlayerTurn, playCard, startGame,
} from './state.js';
import { createRenderer, SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { createInput } from './input.js';
import { playSound, toggleMute } from './audio.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const stage = document.getElementById('stage');
const game = createGame(createRandom(seed));
const renderer = createRenderer(stage);
let screen = SCREEN_TITLE;
let best = readBest();
let aiTimer = null;

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}

function fitStage() {
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  stage.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', fitStage);
fitStage();

function draw() {
  renderer.render(game, screen, best);
}

function finishGame() {
  if (game.phase === PHASE_WIN) {
    screen = SCREEN_WIN;
    if (game.score > best) {
      best = game.score;
      saveBest(best);
    }
    playSound('win');
    renderer.confetti();
  } else if (game.phase === PHASE_LOSS) {
    screen = SCREEN_LOSS;
    if (game.score > best) {
      best = game.score;
      saveBest(best);
    }
    playSound('lose');
  }
  draw();
}

function runAiTurn() {
  const result = aiTakeTurn(game);
  if (!result.ok) {
    draw();
    return;
  }
  if (game.phase === PHASE_WIN || game.phase === PHASE_LOSS) {
    finishGame();
    return;
  }
  playSound('draw');
  draw();
}

const actions = {
  start() {
    if (screen === SCREEN_TITLE || screen === SCREEN_WIN || screen === SCREEN_LOSS) {
      const fresh = createGame(createRandom(seed));
      Object.assign(game, fresh);
      game.log = [];
      startGame(game);
      screen = SCREEN_PLAY;
      playSound('play');
      draw();
    }
  },
  playCard(index) {
    if (screen !== SCREEN_PLAY || game.phase !== PHASE_PLAY) return;
    const before = game.ai.hp;
    const result = playCard(game, index);
    if (!result.ok) {
      playSound('error');
      return;
    }
    if (result.card.type === 'serang') {
      playSound('hit');
      renderer.floatText(`-${result.effect}`, 'dmg', 640, 260);
      if (result.effect >= 7) renderer.shake(true);
      else renderer.shake(false);
    } else if (result.card.type === 'pulih') {
      playSound('heal');
      renderer.floatText(`+${result.effect}`, 'heal', 640, 560);
    } else {
      playSound('block');
      renderer.floatText(`+${result.effect} 🛡`, 'block', 640, 560);
    }
    void before;
    if (game.phase === PHASE_WIN || game.phase === PHASE_LOSS) {
      finishGame();
      return;
    }
    draw();
  },
  endTurn() {
    if (screen !== SCREEN_PLAY || game.phase !== PHASE_PLAY) return;
    const result = endPlayerTurn(game);
    if (!result.ok) return;
    playSound('play');
    draw();
    // The intent banner shows first; the AI acts after a readable pause.
    if (aiTimer) window.clearTimeout(aiTimer);
    aiTimer = window.setTimeout(runAiTurn, 1500);
  },
  mute() {
    const muted = toggleMute();
    const btn = document.getElementById('muteBtn');
    if (btn) btn.textContent = muted ? '🔇' : '🔊';
  },
};

function runShot(name) {
  const scene = stageShot(name, game);
  screen = scene.screen;
  best = scene.best;
  let painted = 0;
  function paint() {
    renderer.render(game, screen, best);
    if (screen === SCREEN_WIN) renderer.confetti();
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  createInput(actions).bind(stage);
  draw();
}

if (shot) runShot(shot);
else runGame();
