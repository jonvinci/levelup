// Švarūs UI garsai, sugeneruoti Web Audio API (be failų – veikia ir offline).
// LU.sound.play('done' | 'undo' | 'star' | 'bonus' | 'achievement' | 'levelup')
window.LU = window.LU || {};

LU.sound = (() => {
  let ctx = null;
  let master = null;

  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      // švelnus filtras + bendras garsumas, kad garsai būtų minkšti, be „aštrumo"
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 5200;
      master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(lp);
      lp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /** Viena nata: dažnis (Hz), pradžia (s nuo dabar), trukmė (s), garsumas, bangos tipas. */
  function tone(freq, start, dur, vol = 0.5, type = 'sine', glideTo = null) {
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur * 0.6);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }
  /** Nata su minkštu „varpelio" atspalviu (pagrindinis tonas + tylus oktavos aukštesnis). */
  const bell = (f, start, dur, vol) => { tone(f, start, dur, vol, 'sine'); tone(f * 2, start, dur * 0.6, vol * 0.18, 'sine'); };

  const SOUNDS = {
    // atlikta: E6 → A6, trumpas ir šviesus
    done: () => { bell(1318.5, 0, 0.18, 0.45); bell(1760, 0.07, 0.26, 0.4); },
    // atšaukta: vienas tylesnis žemėjantis tonas
    undo: () => { tone(660, 0, 0.16, 0.28, 'sine', 520); },
    // žvaigždutė: labai trumpas aukštas spragtelėjimas
    star: () => { tone(2093, 0, 0.07, 0.22, 'triangle'); tone(2637, 0.035, 0.09, 0.16, 'sine'); },
    // visos misijos: C6–E6–G6 arpedžio
    bonus: () => { bell(1046.5, 0, 0.3, 0.38); bell(1318.5, 0.09, 0.3, 0.36); bell(1568, 0.18, 0.45, 0.36); },
    // pasiekimas: blizgus dvigubas „ting"
    achievement: () => { bell(1568, 0, 0.22, 0.32); bell(2093, 0.1, 0.4, 0.3); },
    // lygio pakilimas: G5–C6–E6–G6 + baigiamasis akordas
    levelup: () => {
      [[784, 0], [1046.5, 0.1], [1318.5, 0.2]].forEach(([f, s]) => bell(f, s, 0.22, 0.34));
      [1568, 1318.5, 1046.5].forEach((f) => tone(f, 0.32, 0.9, 0.2, 'triangle'));
      bell(1568, 0.32, 0.9, 0.3);
    },
  };

  function enabled() {
    const st = LU.store && LU.store.state;
    return !(st && st.settings && st.settings.sound === false);
  }

  function play(name, delayMs = 0) {
    if (!enabled() || !SOUNDS[name]) return;
    const run = () => { try { if (audio()) SOUNDS[name](); } catch (e) { /* garsas neprivalomas */ } };
    if (delayMs) setTimeout(run, delayMs); else run();
  }

  /** Sugeneruoja garsą į AudioBuffer (be grojimo) – peržiūrai / testams. */
  function render(name, seconds = 1.4) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const sr = 44100;
    const off = new OAC(1, Math.round(sr * seconds), sr);
    const saved = [ctx, master];
    ctx = off;
    const lp = off.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 5200;
    master = off.createGain();
    master.gain.value = 0.22;
    master.connect(lp);
    lp.connect(off.destination);
    try { SOUNDS[name](); } finally { [ctx, master] = saved; }
    return off.startRendering();
  }

  return { play, enabled, render, names: Object.keys(SOUNDS) };
})();
