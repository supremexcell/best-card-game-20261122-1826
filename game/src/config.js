// Every tuning number and colour in one place. The table is a fixed 1280x720
// logical stage; the renderer scales it to the window, so no rule below
// depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

export const START_HP = 30;
export const MAX_ENERGY = 6;
export const ENERGY_PER_TURN = 3;
export const HAND_SIZE = 5;
export const DECK_SIZE = 30;
export const WIN_BONUS = 50;

export const SUITS = {
  cengkih: { id: 'cengkih', name: 'Cengkih', colour: '#a855f7', dark: '#7e22ce', glyph: '✿', shape: 'bunga' },
  pala: { id: 'pala', name: 'Pala', colour: '#f97316', dark: '#c2410c', glyph: '●', shape: 'biji bulat' },
  lada: { id: 'lada', name: 'Lada', colour: '#ef4444', dark: '#b91c1c', glyph: '⁂', shape: 'gugus' },
  kayuManis: { id: 'kayuManis', name: 'Kayu Manis', colour: '#d4a017', dark: '#92400e', glyph: '◎', shape: 'gulungan' },
};

export const TYPES = {
  serang: { id: 'serang', name: 'SERANG', glyph: '⚔', colour: '#ef4444' },
  perisai: { id: 'perisai', name: 'PERISAI', glyph: '🛡', colour: '#3b82f6' },
  pulih: { id: 'pulih', name: 'PULIH', glyph: '✚', colour: '#22c55e' },
};

export const PALETTE = {
  sea: '#0b2239',
  seaDeep: '#071627',
  table: '#14532d',
  tableFelt: '#166534',
  gold: '#f2c94c',
  cream: '#fdf6e3',
  ink: '#1c1917',
  muted: '#a8b8c8',
  playerHp: '#22c55e',
  aiHp: '#ef4444',
  panel: '#102a43',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const BEST_KEY = 'duel-kartu-nusantara.best';
export const SCORE_KEY = 'duel-kartu-nusantara.score';
