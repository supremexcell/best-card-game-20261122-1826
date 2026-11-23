// WebAudio synth sounds: every sound is generated, no audio files, no
// network. Created lazily on the first user gesture so browsers allow it.
let ctx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function audio() {
  if (muted) return null;
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type, vol, slideTo) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + start + dur);
  gain.gain.setValueAtTime(0.0001, ac.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(vol, ac.currentTime + start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + dur + 0.05);
}

export function playSound(name) {
  if (muted) return;
  if (name === 'play') {
    tone(660, 0, 0.09, 'triangle', 0.18);
    tone(880, 0.06, 0.1, 'triangle', 0.14);
  } else if (name === 'hit') {
    tone(180, 0, 0.18, 'sawtooth', 0.22, 70);
    tone(90, 0.02, 0.2, 'square', 0.12, 50);
  } else if (name === 'block') {
    tone(320, 0, 0.12, 'sine', 0.18, 240);
  } else if (name === 'heal') {
    tone(523, 0, 0.12, 'sine', 0.16);
    tone(659, 0.1, 0.12, 'sine', 0.16);
    tone(784, 0.2, 0.18, 'sine', 0.16);
  } else if (name === 'draw') {
    tone(440, 0, 0.06, 'triangle', 0.1);
  } else if (name === 'win') {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.22, 'triangle', 0.2));
    tone(1319, 0.5, 0.4, 'triangle', 0.18);
  } else if (name === 'lose') {
    [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.16, 0.26, 'sawtooth', 0.12));
  } else if (name === 'error') {
    tone(140, 0, 0.12, 'square', 0.12);
  }
}
