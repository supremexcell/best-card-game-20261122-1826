// Input: mouse clicks on cards and buttons, plus keyboard shortcuts.
// Keys 1-5 play a card, Space/Enter ends the turn, M toggles mute.
// All handlers call back into main.js through the `actions` object.
export const ACTION_END_TURN = 1;
export const ACTION_MUTE = 2;

export function createInput(actions) {
  function onCardClick(event) {
    const node = event.target.closest('.card');
    if (!node || node.classList.contains('disabled')) return;
    const index = Number.parseInt(node.dataset.index ?? '', 10);
    if (Number.isInteger(index) && index >= 0) actions.playCard(index);
  }

  function onKey(event) {
    if (event.key >= '1' && event.key <= '5') {
      actions.playCard(Number.parseInt(event.key, 10) - 1);
    } else if (event.key === ' ' || event.key === 'Enter') {
      if (event.target && (event.target.tagName === 'BUTTON')) return;
      event.preventDefault();
      actions.endTurn();
    } else if (event.key === 'm' || event.key === 'M') {
      actions.mute();
    }
  }

  function bind(stage) {
    const hand = stage.querySelector('.hand');
    if (hand) hand.addEventListener('click', onCardClick);
    document.addEventListener('keydown', onKey);
    stage.addEventListener('click', (event) => {
      const target = event.target;
      if (target.id === 'startBtn' || target.id === 'againBtn') actions.start();
      else if (target.id === 'endTurnBtn') actions.endTurn();
      else if (target.id === 'muteBtn') actions.mute();
    });
  }

  return { bind };
}
