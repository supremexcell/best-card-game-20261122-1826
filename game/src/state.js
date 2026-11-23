// Pure game rules: no DOM, no audio, no randomness except the injected rng.
// Node-testable: createGame, startPlayerTurn, playCard, endPlayerTurn,
// aiTakeTurn, and the win/loss checks. Every rule the screenshots show
// runs through here.
import {
  DECK_SIZE, ENERGY_PER_TURN, HAND_SIZE, MAX_ENERGY, START_HP, WIN_BONUS,
} from './config.js';
import { dealDecks, drawUp } from './deck.js';
import { chooseAiCards, aiIntent } from './ai.js';

export const PHASE_TITLE = 'title';
export const PHASE_PLAY = 'play';
export const PHASE_AI = 'ai';
export const PHASE_WIN = 'win';
export const PHASE_LOSS = 'loss';

function side(hp) {
  return { hp, maxHp: START_HP, block: 0, energy: 0, hand: [], pile: [], discard: [] };
}

export function createGame(rng) {
  const decks = dealDecks(rng);
  const game = {
    rng,
    phase: PHASE_TITLE,
    turn: 1,
    player: side(START_HP),
    ai: side(START_HP),
    suitsPlayed: [],
    log: [],
    score: 0,
    damageDealt: 0,
    damageTaken: 0,
    lastPlayed: null,
    lastAiPlayed: null,
    aiIntent: null,
    winner: null,
  };
  game.player.pile = decks.player;
  game.ai.pile = decks.ai;
  game.player.hand = drawUp(game.player.hand, game.player.pile, game.player.discard, rng, HAND_SIZE);
  game.ai.hand = drawUp(game.ai.hand, game.ai.pile, game.ai.discard, rng, HAND_SIZE);
  return game;
}

export function log(game, text) {
  game.log.unshift(text);
  if (game.log.length > 5) game.log.length = 5;
}

/** Combo "Rempah": the second card of the same suit in one turn gets +2. */
export function comboBonus(game, card) {
  return game.suitsPlayed.includes(card.suit) ? 2 : 0;
}

export function startPlayerTurn(game) {
  const p = game.player;
  p.energy = Math.min(MAX_ENERGY, p.energy + ENERGY_PER_TURN);
  p.block = 0;
  game.suitsPlayed = [];
  const drawn = drawUp(p.hand, p.pile, p.discard, game.rng, 1);
  p.hand.push(...drawn);
  game.phase = PHASE_PLAY;
  log(game, `Giliran ${game.turn}: +${ENERGY_PER_TURN} energi, tarik 1 kartu.`);
  return drawn;
}

export function startGame(game) {
  game.phase = PHASE_PLAY;
  game.player.energy = ENERGY_PER_TURN;
  log(game, 'Duel dimulai! Nakhoda Raka melawan Laksamana Bara.');
}

/** Apply damage to `target`, absorbed by block first. Returns damage that hit HP. */
export function dealDamage(game, target, amount, sourceName) {
  const absorbed = Math.min(target.block, amount);
  target.block -= absorbed;
  const through = amount - absorbed;
  target.hp = Math.max(0, target.hp - through);
  if (target === game.ai) {
    game.damageDealt += through;
    game.score += through;
  } else {
    game.damageTaken += through;
  }
  return { absorbed, through };
}

function checkEnd(game) {
  if (game.ai.hp <= 0) {
    game.phase = PHASE_WIN;
    game.winner = 'player';
    game.score += WIN_BONUS;
    log(game, 'MENANG! Rempah Nusantara milikmu!');
    return true;
  }
  if (game.player.hp <= 0) {
    game.phase = PHASE_LOSS;
    game.winner = 'ai';
    log(game, 'KALAH — Armada Bara menang.');
    return true;
  }
  return false;
}

/**
 * Play the card at `handIndex` from the player's hand. Returns
 * { ok, reason?, effect?, combo? } — never throws on an illegal play.
 */
export function playCard(game, handIndex) {
  if (game.phase !== PHASE_PLAY) return { ok: false, reason: 'bukan giliranmu' };
  const p = game.player;
  const card = p.hand[handIndex];
  if (!card) return { ok: false, reason: 'tidak ada kartu' };
  if (card.cost > p.energy) return { ok: false, reason: 'energi tidak cukup' };
  const bonus = comboBonus(game, card);
  const effect = card.value + bonus;
  p.energy -= card.cost;
  p.hand.splice(handIndex, 1);
  p.discard.push(card);
  game.suitsPlayed.push(card.suit);
  game.lastPlayed = { ...card, effect, combo: bonus > 0 };
  if (card.type === 'serang') {
    const hit = dealDamage(game, game.ai, effect, card.name);
    log(game, `${card.name} menyerang ${effect}${bonus ? ' (Rempah +2!)' : ''} — Bara -${hit.through} HP${hit.absorbed ? `, ${hit.absorbed} ditahan perisai` : ''}.`);
  } else if (card.type === 'perisai') {
    p.block += effect;
    log(game, `${card.name}: perisai +${effect}${bonus ? ' (Rempah +2!)' : ''}.`);
  } else {
    const healed = Math.min(effect, START_HP - p.hp);
    p.hp += healed;
    log(game, `${card.name}: pulih +${healed} HP${bonus ? ' (Rempah +2!)' : ''}.`);
  }
  checkEnd(game);
  return { ok: true, card, effect, combo: bonus > 0 };
}

/** End the player's turn: the AI shows its intent, then acts. */
export function endPlayerTurn(game) {
  if (game.phase !== PHASE_PLAY) return { ok: false, reason: 'bukan giliranmu' };
  game.phase = PHASE_AI;
  game.aiIntent = aiIntent(game);
  log(game, `Bara ${game.aiIntent.text}`);
  return { ok: true, intent: game.aiIntent };
}

/** Resolve the AI turn (called after the intent banner has shown). */
export function aiTakeTurn(game) {
  if (game.phase !== PHASE_AI) return { ok: false, reason: 'bukan giliran AI' };
  const ai = game.ai;
  ai.energy = Math.min(MAX_ENERGY, ai.energy + ENERGY_PER_TURN);
  ai.block = 0;
  const drawn = drawUp(ai.hand, ai.pile, ai.discard, game.rng, 1);
  ai.hand.push(...drawn);
  const played = chooseAiCards(game);
  for (const card of played) {
    const idx = ai.hand.indexOf(card);
    if (idx === -1) continue;
    ai.hand.splice(idx, 1);
    ai.discard.push(card);
    ai.energy -= card.cost;
    game.lastAiPlayed = { ...card, effect: card.value, combo: false };
    if (card.type === 'serang') {
      const hit = dealDamage(game, game.player, card.value, card.name);
      log(game, `Bara memainkan ${card.name}: -${hit.through} HP${hit.absorbed ? `, ${hit.absorbed} ditahan perisaimu` : ''}.`);
    } else if (card.type === 'perisai') {
      ai.block += card.value;
      log(game, `Bara memasang perisai +${card.value}.`);
    } else {
      const healed = Math.min(card.value, START_HP - ai.hp);
      ai.hp += healed;
      log(game, `Bara memulihkan +${healed} HP.`);
    }
    if (checkEnd(game)) return { ok: true, played };
  }
  game.turn += 1;
  startPlayerTurn(game);
  return { ok: true, played };
}

export function deckSize(game) {
  return DECK_SIZE;
}
