// The screenshot scenes behind ?shot=title|cover|win|loss (with &seed=N).
// Each one plays the real rules forward from a fresh seeded game, so the
// frame is what a real duel looks like and the same seed always gives the
// same frame. The win/loss scenes stage a near-death state, then finish it
// with a real playCard / aiTakeTurn call.
import { PHASE_AI, PHASE_LOSS, PHASE_PLAY, PHASE_WIN, endPlayerTurn, aiTakeTurn, playCard, startGame } from './state.js';
import { SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

/** Play one affordable attack (else any affordable card) from the hand. */
function playOne(game) {
  const hand = game.player.hand;
  let idx = hand.findIndex((c) => c.type === 'serang' && c.cost <= game.player.energy);
  if (idx === -1) idx = hand.findIndex((c) => c.cost <= game.player.energy);
  if (idx !== -1) playCard(game, idx);
}

function playTurns(game, turns) {
  startGame(game);
  for (let t = 0; t < turns; t += 1) {
    if (game.phase !== PHASE_PLAY) break;
    playOne(game);
    if (game.phase !== PHASE_PLAY) break;
    endPlayerTurn(game);
    aiTakeTurn(game);
  }
}

/**
 * Set `game` to the named scene and return the screen to draw over it and
 * the best score to show. Unknown names stage the title.
 */
export function stageShot(name, game) {
  if (name === 'cover') {
    playTurns(game, 3);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'win') {
    startGame(game);
    game.ai.hp = 5;
    game.ai.block = 0;
    // A lethal attack in hand, with energy to pay for it.
    game.player.hand[0] = {
      id: 901, suit: 'lada', type: 'serang', value: 7, cost: 2,
      name: 'Hujan Lada Pedas', suitName: 'Lada', typeName: 'SERANG',
    };
    game.player.energy = 6;
    playCard(game, 0);
    return { screen: game.phase === PHASE_WIN ? SCREEN_WIN : SCREEN_PLAY, best: game.score };
  }
  if (name === 'loss') {
    startGame(game);
    game.player.hp = 4;
    game.player.block = 0;
    game.phase = PHASE_AI;
    game.aiIntent = { kind: 'serang', text: 'akan menyerang!' };
    game.ai.hand = [{
      id: 902, suit: 'cengkih', type: 'serang', value: 8, cost: 3,
      name: 'Badai Bunga Cengkih', suitName: 'Cengkih', typeName: 'SERANG',
    }];
    game.ai.energy = 0;
    aiTakeTurn(game);
    return { screen: game.phase === PHASE_LOSS ? SCREEN_LOSS : SCREEN_PLAY, best: 0 };
  }
  return { screen: SCREEN_TITLE, best: 0 };
}

export { PHASE_AI, PHASE_LOSS, PHASE_WIN };
