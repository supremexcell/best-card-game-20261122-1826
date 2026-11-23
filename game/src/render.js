// The DOM renderer: builds the 1280x720 table once, then repaints it from the
// pure game state. Cards are DOM (not canvas) so values stay legible at
// thumbnail size. Suits are told apart by colour AND shape glyph, never
// text alone.
import { FIELD, PALETTE, START_HP, SUITS, TYPES } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function hpBar(side, hp, maxHp, block) {
  const wrap = el('div', `hpbar ${side}`);
  const fill = el('div', 'hpfill');
  fill.style.width = `${Math.max(0, (hp / maxHp) * 100)}%`;
  wrap.appendChild(fill);
  const label = el('div', 'hplabel', `${hp} / ${maxHp}${block > 0 ? `  🛡 ${block}` : ''}`);
  wrap.appendChild(label);
  return wrap;
}

/** One playable card. `index` is its position in the hand (for keys 1-5). */
export function cardElement(card, index, opts = {}) {
  const suit = SUITS[card.suit];
  const type = TYPES[card.type];
  const node = el('div', `card suit-${card.suit} type-${card.type}${opts.small ? ' small' : ''}${opts.played ? ' played' : ''}${opts.disabled ? ' disabled' : ''}`);
  node.dataset.index = String(index);
  node.style.setProperty('--suit', suit.colour);
  node.style.setProperty('--suit-dark', suit.dark);
  const cost = el('div', 'cost', String(card.cost));
  cost.title = `Biaya ${card.cost} energi`;
  node.appendChild(cost);
  const suitBadge = el('div', 'suitbadge');
  suitBadge.appendChild(el('span', 'suitglyph', suit.glyph));
  suitBadge.appendChild(el('span', 'suitname', suit.name));
  node.appendChild(suitBadge);
  node.appendChild(el('div', 'cardname', card.name));
  const art = el('div', 'cardart');
  art.appendChild(el('span', 'artglyph', suit.glyph));
  art.appendChild(el('span', 'arttype', type.glyph));
  node.appendChild(art);
  const valueRow = el('div', 'valuerow');
  valueRow.appendChild(el('span', 'typeglyph', type.glyph));
  valueRow.appendChild(el('span', 'bigvalue', String(card.effect ?? card.value)));
  valueRow.appendChild(el('span', 'typelabel', type.name));
  node.appendChild(valueRow);
  if (card.combo) node.appendChild(el('div', 'combobadge', 'REMPAH +2'));
  if (opts.hint) node.appendChild(el('div', 'keyhint', opts.hint));
  return node;
}

function miniCard() {
  const node = el('div', 'minicard');
  node.appendChild(el('span', 'miniglyph', '✦'));
  return node;
}

export function createRenderer(stage) {
  stage.innerHTML = '';
  stage.classList.add('stage');

  // ---- opponent row ----
  const aiRow = el('div', 'airow');
  const aiAvatar = el('div', 'avatar ai-avatar', '⚓');
  const aiInfo = el('div', 'aiinfo');
  aiInfo.appendChild(el('div', 'fighter-name', 'LAKSAMANA BARA'));
  aiInfo.appendChild(el('div', 'fighter-sub', 'Armada Rempah · Lawan'));
  const aiHpWrap = el('div', 'aihp');
  aiRow.appendChild(aiAvatar);
  aiRow.appendChild(aiInfo);
  aiRow.appendChild(aiHpWrap);
  const aiHand = el('div', 'aihand');
  aiRow.appendChild(aiHand);
  const scoreBox = el('div', 'scorebox');
  scoreBox.appendChild(el('div', 'scorelabel', 'SKOR'));
  const scoreVal = el('div', 'scoreval', '0');
  scoreBox.appendChild(scoreVal);
  aiRow.appendChild(scoreBox);
  stage.appendChild(aiRow);

  // ---- intent banner ----
  const intent = el('div', 'intent hidden');
  intent.appendChild(el('span', 'intent-ico', '⚠'));
  intent.appendChild(el('span', 'intent-text', ''));
  stage.appendChild(intent);

  // ---- centre table ----
  const table = el('div', 'table');
  const playedRow = el('div', 'playedrow');
  const playedYou = el('div', 'playedslot');
  playedYou.appendChild(el('div', 'slotlabel', 'KARTU TERAKHIRMU'));
  const playedYouCard = el('div', 'slotcard');
  playedYou.appendChild(playedYouCard);
  const vs = el('div', 'vs', '⚔');
  const playedAi = el('div', 'playedslot');
  playedAi.appendChild(el('div', 'slotlabel', 'KARTU TERAKHIR BARA'));
  const playedAiCard = el('div', 'slotcard');
  playedAi.appendChild(playedAiCard);
  playedRow.appendChild(playedYou);
  playedRow.appendChild(vs);
  playedRow.appendChild(playedAi);
  table.appendChild(playedRow);
  const turnLabel = el('div', 'turnlabel', 'Giliran 1');
  table.appendChild(turnLabel);
  const logBox = el('div', 'log');
  table.appendChild(logBox);
  stage.appendChild(table);

  // ---- player row: HP + energy + end turn ----
  const playerRow = el('div', 'playerrow');
  const pAvatar = el('div', 'avatar player-avatar', '⛵');
  const pInfo = el('div', 'pinfo');
  pInfo.appendChild(el('div', 'fighter-name', 'NAKHODA RAKA'));
  pInfo.appendChild(el('div', 'fighter-sub', 'Kamu · 30 kartu rempah'));
  const pHpWrap = el('div', 'php');
  playerRow.appendChild(pAvatar);
  playerRow.appendChild(pInfo);
  playerRow.appendChild(pHpWrap);
  const energyBox = el('div', 'energybox');
  energyBox.appendChild(el('div', 'energylabel', 'ENERGI'));
  const energyPips = el('div', 'energypips');
  energyBox.appendChild(energyPips);
  playerRow.appendChild(energyBox);
  const endBtn = el('button', 'endbtn', 'AKHIRI GILIRAN ⏎');
  endBtn.id = 'endTurnBtn';
  playerRow.appendChild(endBtn);
  const muteBtn = el('button', 'mutebtn', '🔊');
  muteBtn.id = 'muteBtn';
  muteBtn.title = 'Bisukan (M)';
  playerRow.appendChild(muteBtn);
  stage.appendChild(playerRow);

  // ---- player hand ----
  const hand = el('div', 'hand');
  stage.appendChild(hand);

  // ---- floating numbers + confetti layers ----
  const fx = el('div', 'fx');
  stage.appendChild(fx);

  // ---- overlays ----
  const overlay = el('div', 'overlay hidden');
  overlay.id = 'overlay';
  stage.appendChild(overlay);

  const status = document.getElementById('status');

  function render(game, screen, best) {
    // AI HP + hand
    aiHpWrap.innerHTML = '';
    aiHpWrap.appendChild(hpBar('ai', game.ai.hp, START_HP, game.ai.block));
    aiHand.innerHTML = '';
    for (let i = 0; i < game.ai.hand.length; i += 1) aiHand.appendChild(miniCard());
    aiHand.appendChild(el('span', 'handcount', `× ${game.ai.hand.length}`));
    scoreVal.textContent = String(game.score);

    // Intent banner
    const intentText = intent.querySelector('.intent-text');
    if (game.phase === 'ai' && game.aiIntent) {
      intent.classList.remove('hidden');
      intentText.textContent = `Bara ${game.aiIntent.text}`;
    } else {
      intent.classList.add('hidden');
    }

    // Played cards
    playedYouCard.innerHTML = '';
    if (game.lastPlayed) playedYouCard.appendChild(cardElement(game.lastPlayed, -1, { small: true, played: true }));
    else playedYouCard.appendChild(el('div', 'slotempty', '— belum ada —'));
    playedAiCard.innerHTML = '';
    if (game.lastAiPlayed) playedAiCard.appendChild(cardElement(game.lastAiPlayed, -1, { small: true, played: true }));
    else playedAiCard.appendChild(el('div', 'slotempty', '— belum ada —'));
    turnLabel.textContent = `Giliran ${game.turn} · Dek: ${game.player.pile.length} kartu · Buangan: ${game.player.discard.length}`;
    logBox.innerHTML = '';
    for (const line of game.log) logBox.appendChild(el('div', 'logline', line));

    // Player HP + energy
    pHpWrap.innerHTML = '';
    pHpWrap.appendChild(hpBar('player', game.player.hp, START_HP, game.player.block));
    energyPips.innerHTML = '';
    for (let i = 0; i < 6; i += 1) {
      const pip = el('span', `pip${i < game.player.energy ? ' on' : ''}`, '⬢');
      energyPips.appendChild(pip);
    }
    energyPips.appendChild(el('span', 'energyval', `${game.player.energy}/6`));

    // Player hand
    hand.innerHTML = '';
    game.player.hand.forEach((card, i) => {
      const playable = game.phase === 'play' && card.cost <= game.player.energy;
      const node = cardElement(card, i, { disabled: !playable, hint: String(i + 1) });
      node.classList.add('deal-in');
      node.style.animationDelay = `${i * 0.07}s`;
      hand.appendChild(node);
    });
    endBtn.disabled = game.phase !== 'play';

    // Overlays
    overlay.innerHTML = '';
    if (screen === SCREEN_TITLE) {
      overlay.classList.remove('hidden');
      overlay.classList.add('title-screen');
      const box = el('div', 'titlebox');
      box.appendChild(el('div', 'kicker', '⚓ DUEL KARTU · PERANG REMPAH ⚓'));
      box.appendChild(el('div', 'gametitle', 'DUEL KARTU\nNUSANTARA'));
      box.appendChild(el('div', 'subtitle', 'Perang Rempah — Nakhoda Raka vs Laksamana Bara'));
      const suits = el('div', 'suitrow');
      for (const key of Object.keys(SUITS)) {
        const s = SUITS[key];
        const chip = el('div', 'suitchip');
        chip.style.setProperty('--suit', s.colour);
        chip.appendChild(el('span', 'chipglyph', s.glyph));
        chip.appendChild(el('span', 'chipname', s.name));
        suits.appendChild(chip);
      }
      box.appendChild(suits);
      box.appendChild(el('div', 'howto', 'Klik kartu untuk memainkannya · biaya dibayar dengan energi · kartu rempah kedua dengan jenis yang sama dalam satu giliran mendapat +2 · kalahkan Bara sebelum HP-mu habis!'));
      const startBtn = el('button', 'startbtn', '▶  MULAI DUEL');
      startBtn.id = 'startBtn';
      box.appendChild(startBtn);
      box.appendChild(el('div', 'bestline', best > 0 ? `Skor terbaik: ${best}` : 'Skor terbaik: —'));
      box.appendChild(el('div', 'controlsline', 'Tombol 1–5 mainkan kartu · Spasi/Enter akhiri giliran · M bisukan'));
      overlay.appendChild(box);
    } else if (screen === SCREEN_WIN || screen === SCREEN_LOSS) {
      overlay.classList.remove('hidden');
      overlay.classList.add(screen === SCREEN_WIN ? 'win-screen' : 'loss-screen');
      const box = el('div', 'endbox');
      box.appendChild(el('div', 'endtitle', screen === SCREEN_WIN ? '★ MENANG! ★' : 'KALAH'));
      box.appendChild(el('div', 'endsub', screen === SCREEN_WIN
        ? 'Rempah Nusantara Milikmu'
        : 'Armada Bara Menang'));
      box.appendChild(el('div', 'endscore', `Skor: ${game.score}`));
      box.appendChild(el('div', 'endstats', `Damage diberikan: ${game.damageDealt} · Giliran: ${game.turn} · Skor terbaik: ${Math.max(best, game.score)}`));
      const againBtn = el('button', 'startbtn', '↻  MAIN LAGI');
      againBtn.id = 'againBtn';
      box.appendChild(againBtn);
      overlay.appendChild(box);
    } else {
      overlay.classList.add('hidden');
      overlay.classList.remove('title-screen', 'win-screen', 'loss-screen');
    }
    if (status) {
      status.textContent = screen === SCREEN_TITLE
        ? 'Duel Kartu Nusantara. Tekan MULAI DUEL.'
        : `Giliran ${game.turn}. HP kamu ${game.player.hp}, Bara ${game.ai.hp}. Skor ${game.score}.`;
    }
  }

  function floatText(text, kind, x, y) {
    const node = el('div', `floatnum ${kind}`, text);
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    fx.appendChild(node);
    window.setTimeout(() => node.remove(), 1400);
  }

  function shake(big) {
    stage.classList.remove('shake', 'shake-big');
    void stage.offsetWidth;
    stage.classList.add(big ? 'shake-big' : 'shake');
  }

  // Confetti positions use a tiny local counter-based generator, not the
  // global random source, so the only random call in the game is the
  // ?seed= fallback in main.js.
  let confettiSeed = 987654321;
  function nextConfetti() {
    confettiSeed = (Math.imul(confettiSeed, 1103515245) + 12345) | 0;
    return ((confettiSeed >>> 0) % 100000) / 100000;
  }

  function confetti() {
    const colours = ['#f2c94c', '#a855f7', '#f97316', '#ef4444', '#22c55e', '#3b82f6'];
    for (let i = 0; i < 90; i += 1) {
      const piece = el('div', 'confetti');
      piece.style.left = `${nextConfetti() * 1280}px`;
      piece.style.background = colours[i % colours.length];
      piece.style.animationDelay = `${nextConfetti() * 0.9}s`;
      piece.style.animationDuration = `${1.8 + nextConfetti() * 1.6}s`;
      piece.style.transform = `rotate(${Math.floor(nextConfetti() * 360)}deg)`;
      fx.appendChild(piece);
      window.setTimeout(() => piece.remove(), 4200);
    }
  }

  return { render, floatText, shake, confetti, hand, endBtn, muteBtn, overlay, fx };
}

export { PALETTE };
