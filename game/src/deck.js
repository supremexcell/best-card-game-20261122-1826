// The 30-card deck: every card is an original Indonesian spice-trade card.
// Four suits (rempah), told apart by colour AND shape glyph, never text alone:
// Cengkih ✿ ungu, Pala ● oranye, Lada ⁂ merah, Kayu Manis ◎ emas.
// Three types: Serang (damage), Perisai (block), Pulih (heal).
import { SUITS, TYPES } from './config.js';
import { shuffle } from './random.js';

// [suit, type, value, cost, name] — value 3-8, cost 1-3.
const DECK_SPEC = [
  ['cengkih', 'serang', 5, 2, 'Tusuk Cengkih'],
  ['cengkih', 'serang', 8, 3, 'Badai Bunga Cengkih'],
  ['cengkih', 'serang', 3, 1, 'Jarum Cengkih'],
  ['cengkih', 'perisai', 6, 2, 'Perisai Aroma Cengkih'],
  ['cengkih', 'perisai', 4, 1, 'Kelopak Penahan'],
  ['cengkih', 'pulih', 5, 2, 'Teh Cengkih Hangat'],
  ['cengkih', 'pulih', 3, 1, 'Minyak Cengkih'],
  ['cengkih', 'serang', 6, 2, 'Serbuan Kuncup'],
  ['pala', 'serang', 6, 2, 'Hantaman Biji Pala'],
  ['pala', 'serang', 4, 1, 'Lempar Pala'],
  ['pala', 'serang', 8, 3, 'Meriam Pala Banda'],
  ['pala', 'perisai', 7, 2, 'Cangkang Pala Baja'],
  ['pala', 'perisai', 5, 2, 'Tameng Biji'],
  ['pala', 'pulih', 6, 2, 'Sup Pala Pemulih'],
  ['pala', 'pulih', 4, 1, 'Parutan Pala'],
  ['pala', 'serang', 5, 2, 'Tumbukan Fuli'],
  ['lada', 'serang', 7, 3, 'Hujan Lada Pedas'],
  ['lada', 'serang', 4, 1, 'Percik Lada'],
  ['lada', 'serang', 5, 2, 'Tendangan Merica'],
  ['lada', 'perisai', 8, 3, 'Dinding Gugus Lada'],
  ['lada', 'perisai', 5, 1, 'Kabut Lada'],
  ['lada', 'pulih', 4, 2, 'Jamu Lada Hitam'],
  ['lada', 'pulih', 3, 1, 'Serbuk Lada'],
  ['lada', 'serang', 6, 2, 'Sabre Lada'],
  ['kayuManis', 'serang', 6, 2, 'Cambuk Kayu Manis'],
  ['kayuManis', 'serang', 3, 1, 'Serpih Manis'],
  ['kayuManis', 'serang', 7, 3, 'Gulungan Badai Manis'],
  ['kayuManis', 'perisai', 6, 2, 'Gulung Perisai'],
  ['kayuManis', 'perisai', 4, 1, 'Kulit Kayu Pelindung'],
  ['kayuManis', 'pulih', 6, 3, 'Wedang Kayu Manis'],
];

export function buildDeck() {
  return DECK_SPEC.map(([suit, type, value, cost, name], index) => ({
    id: index + 1,
    suit,
    type,
    value,
    cost,
    name,
    suitName: SUITS[suit].name,
    typeName: TYPES[type].name,
  }));
}

/** Two fresh shuffled 30-card decks (player and AI draw from their own). */
export function dealDecks(rng) {
  return { player: shuffle(buildDeck(), rng), ai: shuffle(buildDeck(), rng) };
}

export function drawUp(hand, pile, discard, rng, count) {
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    if (pile.length === 0) {
      if (discard.length === 0) break;
      pile.push(...shuffle(discard.splice(0), rng));
    }
    drawn.push(pile.shift());
  }
  return drawn;
}
