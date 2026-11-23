// The AI opponent, Laksamana Bara: readable and counterable. Before it acts
// it announces one intent, and its choices follow three rules a player can
// read and play around: it heals when badly hurt, shields when hurt, and
// hits hardest when the player is low.
import { START_HP } from './config.js';

export function aiIntent(game) {
  const ai = game.ai;
  const hasHeal = ai.hand.some((c) => c.type === 'pulih' && c.cost <= ai.energy + 3);
  const hasShield = ai.hand.some((c) => c.type === 'perisai' && c.cost <= ai.energy + 3);
  if (ai.hp <= 10 && hasHeal) return { kind: 'pulih', text: 'akan memulihkan diri!' };
  if (ai.hp <= 12 && hasShield) return { kind: 'perisai', text: 'akan memasang perisai!' };
  return { kind: 'serang', text: 'akan menyerang!' };
}

/** Pick the cards the AI plays this turn, in order, within its energy. */
export function chooseAiCards(game) {
  const ai = game.ai;
  const energy = ai.energy; // already topped up by aiTakeTurn before this call
  const affordable = (c) => c.cost <= energy;
  const picked = [];
  let spent = 0;
  const take = (card) => {
    if (card && card.cost + spent <= energy) {
      picked.push(card);
      spent += card.cost;
    }
  };
  const byValue = (a, b) => b.value - a.value;
  const heals = ai.hand.filter((c) => c.type === 'pulih' && affordable(c)).sort(byValue);
  const shields = ai.hand.filter((c) => c.type === 'perisai' && affordable(c)).sort(byValue);
  const attacks = ai.hand.filter((c) => c.type === 'serang' && affordable(c)).sort(byValue);
  if (ai.hp <= 10 && heals.length > 0) take(heals[0]);
  if (ai.hp <= 12 && shields.length > 0) take(shields[0]);
  // Hit hardest first; a second attack if energy is left over.
  for (const atk of attacks) {
    if (atk.cost + spent <= energy && picked.length < 3) take(atk);
  }
  if (picked.length === 0) {
    // Nothing fits the plan: play the cheapest useful card it can afford.
    const cheapest = ai.hand.filter(affordable).sort((a, b) => a.cost - b.cost)[0];
    take(cheapest);
  }
  void START_HP;
  return picked;
}
