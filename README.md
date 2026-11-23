# Duel Kartu Nusantara — Perang Rempah

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/supremexcell/best-card-game-20261122-1826/rank.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/supremexcell/best-card-game-20261122-1826/reward.svg)](https://make.fun/c/best-card-game-20261122-1826)

Entry for the make.fun bounty [Make the best card game](https://make.fun/c/best-card-game-20261122-1826).
Referral code: `bj2pae9c`.

An original Indonesian spice-trade card duel: **Nakhoda Raka** vs **Laksamana Bara**.
Both start at 30 HP. Play attack, shield and heal cards from four spice suits —
Cengkih ✿ (purple), Pala ● (orange), Lada ⁂ (red), Kayu Manis ◎ (gold) — told
apart by colour **and** shape, never text alone. Playing a second card of the
same suit in one turn triggers the **Rempah combo (+2)**. Bara announces his
intent before every turn ("Bara akan menyerang!" / "…memasang perisai!" /
"…memulihkan diri!"), so his choices can be read and countered: he heals when
badly hurt, shields when hurt, and hits hardest when you are low.

## Play

```sh
node serve.ts        # then open http://localhost:8080
```

- Click a card to play it (only with enough energy), or press keys **1–5**.
- Energy: +3 at turn start, max 6, leftover carries. Cards cost 1–3.
- **Space / Enter** ends your turn. **M** mutes the WebAudio synth sounds.
- Win by dropping Bara to 0 HP; lose if your HP hits 0. Best score is kept in
  `localStorage`.

## Screenshots

Deterministic scenes, all pinned to `?seed=7`:

| File | Scene |
| --- | --- |
| `screenshots/1-cover.jpg` | Mid-duel table: both hands, HP bars, cards played, energy |
| `screenshots/2-title.jpg` | Title screen |
| `screenshots/3-win.jpg` | Win screen |
| `screenshots/4-loss.jpg` | Loss screen |

Re-shoot with `?shot=cover|title|win|loss&seed=7` (see `shots.json`).

## Files

- `main.ts` — copies `game/` + `screenshots/` to `/output` and writes
  `dossier.json` (Node 22, stdlib only, deterministic).
- `serve.ts` — tiny static server for local playtesting.
- `game/index.html` — the 1280×720 table (DOM/CSS cards, system fonts only).
- `game/src/config.js` — tuning numbers, suits, palette.
- `game/src/random.js` — seeded RNG (mulberry32) + shuffle.
- `game/src/deck.js` — the original 30-card deck.
- `game/src/state.js` — pure game rules (damage, block, heal, combo, win/loss).
- `game/src/ai.js` — Bara's readable, counterable AI + intent.
- `game/src/render.js` — DOM renderer, animations, confetti, float numbers.
- `game/src/input.js` — mouse + keyboard input.
- `game/src/audio.js` — WebAudio synth sounds (no audio files).
- `game/src/shots.js` — deterministic screenshot scenes.
- `game/src/main.js` — boot, game flow, AI turn timing.

No network requests: every reference is a file inside `game/`, and the only
`Math.random()` in the game is the `?seed=` fallback. Licensed MIT.
