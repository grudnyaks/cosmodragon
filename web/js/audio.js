// Звук: процедурная фоновая музыка, урчание дракончика и эффекты (WebAudio)
'use strict';
const Sound = (function () {
  let ac = null, master, musicGain, sfxGain, verb, noiseBuf = null;
  let musicOn = false, nextBeat = 0, beat = 0, timer = null;

  function init() {
    if (ac) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
    // мягкое «эхо» вместо реверберации
    verb = ac.createDelay(1); verb.delayTime.value = 0.33;
    const fb = ac.createGain(); fb.gain.value = 0.35;
    const vf = ac.createBiquadFilter(); vf.type = 'lowpass'; vf.frequency.value = 1800;
    const vout = ac.createGain(); vout.gain.value = 0.35;
    verb.connect(vf); vf.connect(fb); fb.connect(verb); vf.connect(vout); vout.connect(master);
    musicGain = ac.createGain(); musicGain.gain.value = 0.0; musicGain.connect(master); musicGain.connect(verb);
    sfxGain = ac.createGain(); sfxGain.gain.value = 0.8; sfxGain.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } // коричневый шум
  }

  // Записанное урчание (sounds/purr1..4.mp3); пока не загрузилось — синтезированное
  const purrBufs = [];
  let purrLoading = false, lastPurr = -1, purrUntil = 0;
  function loadPurrs() {
    if (purrLoading || !ac) return; purrLoading = true;
    for (let i = 1; i <= 4; i++) {
      fetch('sounds/purr' + i + '.mp3').then(r => r.arrayBuffer())
        .then(b => new Promise((ok, bad) => ac.decodeAudioData(b, ok, bad)))
        .then(buf => purrBufs.push(buf)).catch(() => { });
    }
  }
  function playPurrSample(t, rate) {
    let i; do { i = (Math.random() * purrBufs.length) | 0; } while (purrBufs.length > 1 && i === lastPurr);
    lastPurr = i;
    const src = ac.createBufferSource(); src.buffer = purrBufs[i]; src.playbackRate.value = rate;
    const g = ac.createGain(); g.gain.value = 1.0;
    src.connect(g); g.connect(sfxGain); src.start(t);
    return purrBufs[i].duration / rate;
  }

  function unlock() {
    init(); if (!ac) return;
    loadPurrs();
    if (ac.state === 'suspended') ac.resume();
    if (S.data.music && !musicOn) startMusic();
  }

  // ---------- Музыка ----------
  // Тональность до мажор, пентатоника. Аккорды: C – Am – F – G
  const CH = [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59]];
  const PENTA = [60, 62, 64, 67, 69, 72, 74, 76, 79];
  const BPM = 80, SPB = 60 / BPM;
  let melIdx = 4;
  const mf = n => 440 * Math.pow(2, (n - 69) / 12);

  function tone(freq, t, dur, type, vol, dest, attack) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (attack || 0.02));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxGain);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }

  function scheduleBeat(t) {
    const bar = Math.floor(beat / 4) % 4, b = beat % 4;
    const ch = CH[bar];
    if (b === 0) {
      // мягкий пэд
      for (let i = 1; i < 4; i++) tone(mf(ch[i]), t, SPB * 4.2, 'triangle', 0.045, musicGain, 0.6);
      tone(mf(ch[0] - 12), t, SPB * 3.5, 'sine', 0.12, musicGain, 0.05);
    }
    if (b === 2) tone(mf(ch[0] - 5), t, SPB * 1.6, 'sine', 0.07, musicGain, 0.05);
    // колокольчик-мелодия
    const pattern = [1, 0.5, 1, 0.6][b];
    if (Math.random() < pattern * 0.85) {
      melIdx = M.clamp(melIdx + M.pick([-2, -1, -1, 0, 1, 1, 2]), 0, PENTA.length - 1);
      const n = PENTA[melIdx];
      tone(mf(n), t, 1.1, 'sine', 0.07, musicGain, 0.01);
      tone(mf(n + 12), t, 0.5, 'sine', 0.015, musicGain, 0.01);
      if (Math.random() < 0.35) {
        const n2 = PENTA[M.clamp(melIdx + M.pick([-1, 1, 2]), 0, PENTA.length - 1)];
        tone(mf(n2), t + SPB / 2, 0.9, 'sine', 0.05, musicGain, 0.01);
      }
    }
    beat++;
  }

  function startMusic() {
    init(); if (!ac || musicOn) return;
    musicOn = true;
    musicGain.gain.cancelScheduledValues(ac.currentTime);
    musicGain.gain.setTargetAtTime(0.55, ac.currentTime, 1.0);
    nextBeat = ac.currentTime + 0.1;
    timer = setInterval(() => {
      if (ac.state !== 'running') return;
      while (nextBeat < ac.currentTime + 0.3) { scheduleBeat(nextBeat); nextBeat += SPB; }
    }, 80);
  }
  function stopMusic() {
    if (!ac || !musicOn) return;
    musicOn = false; clearInterval(timer);
    musicGain.gain.setTargetAtTime(0, ac.currentTime, 0.3);
  }
  function setMusic(on) { S.data.music = on; S.save(); on ? startMusic() : stopMusic(); }

  // ---------- Эффекты ----------
  function noise(t, dur, filterType, f0, f1, vol, q) {
    const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ac.createBiquadFilter(); f.type = filterType; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(t, Math.random()); src.stop(t + dur + 0.05);
    return g;
  }
  const ok = () => { init(); return !!ac; };

  return {
    unlock, setMusic, startMusic, stopMusic,
    get musicOn() { return musicOn; },
    pause() { if (ac && ac.state === 'running') ac.suspend(); Voice.stop(); },
    resume() { if (ac && ac.state === 'suspended') ac.resume(); },
    // Урчание дракончика: записанные «мур-р», чем больше дракончик — тем ниже голос
    purr(len) {
      if (!ok()) return;
      if (purrBufs.length) {
        const now = ac.currentTime;
        if (now < purrUntil - 0.3) return; // не накладываем урчание на урчание
        const lvl = (S.data && S.data.level) || 1, rate = 1.1 - (lvl - 1) * 0.06;
        let t = now, total = len || 1.6;
        do { t += playPurrSample(t, rate * (0.97 + Math.random() * 0.06)) - 0.05; } while (t - now < total * 0.8);
        purrUntil = t;
        return;
      }
      this.purrSynth(len);
    },
    // Запасной синтезированный вариант: низкий шум с пульсацией ~24 Гц
    purrSynth(len) {
      if (!ok()) return; const t = ac.currentTime, dur = len || 1.6;
      const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; lp.Q.value = 4;
      const am = ac.createGain(); am.gain.value = 0.5;
      const lfo = ac.createOscillator(); lfo.type = 'sawtooth'; lfo.frequency.value = 23;
      const lfoG = ac.createGain(); lfoG.gain.value = 0.5;
      lfo.connect(lfoG); lfoG.connect(am.gain);
      const env = ac.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(1.6, t + 0.25);
      env.gain.setValueAtTime(1.6, t + dur * 0.45);
      env.gain.exponentialRampToValueAtTime(0.9, t + dur * 0.55); // вдох-выдох
      env.gain.exponentialRampToValueAtTime(1.5, t + dur * 0.7);
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(lp); lp.connect(am); am.connect(env); env.connect(sfxGain);
      // тихий тональный «рык»
      const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(58, t + dur);
      const og = ac.createGain(); og.gain.value = 0.18; o.connect(og); og.connect(am);
      src.start(t); lfo.start(t); o.start(t);
      src.stop(t + dur + 0.1); lfo.stop(t + dur + 0.1); o.stop(t + dur + 0.1);
    },
    pop(p) { if (!ok()) return; const t = ac.currentTime; const o = tone(500 * (p || 1), t, 0.12, 'sine', 0.25); o.frequency.exponentialRampToValueAtTime(900 * (p || 1), t + 0.08); },
    chime(p) { if (!ok()) return; const t = ac.currentTime; tone(1320 * (p || 1), t, 0.6, 'sine', 0.18); tone(1980 * (p || 1), t + 0.05, 0.5, 'sine', 0.08); },
    coin() { if (!ok()) return; const t = ac.currentTime; tone(988, t, 0.1, 'square', 0.06); tone(1319, t + 0.08, 0.35, 'square', 0.06); },
    chomp() { if (!ok()) return; const t = ac.currentTime; for (let i = 0; i < 3; i++) noise(t + i * 0.13, 0.09, 'bandpass', 900, 400, 0.6, 2); tone(300, t + 0.4, 0.15, 'sine', 0.15); },
    whoosh() { if (!ok()) return; noise(ac.currentTime, 0.6, 'bandpass', 300, 2500, 0.5, 1.5); },
    bump() { if (!ok()) return; const t = ac.currentTime; const o = tone(160, t, 0.35, 'sine', 0.5); o.frequency.exponentialRampToValueAtTime(50, t + 0.3); noise(t, 0.2, 'lowpass', 600, 100, 0.5); },
    dig() { if (!ok()) return; noise(ac.currentTime, 0.25, 'bandpass', 1400, 500, 0.5, 1); },
    boing() { if (!ok()) return; const t = ac.currentTime; const o = tone(220, t, 0.4, 'triangle', 0.25); o.frequency.exponentialRampToValueAtTime(520, t + 0.15); o.frequency.exponentialRampToValueAtTime(300, t + 0.35); },
    fire() { if (!ok()) return; noise(ac.currentTime, 0.9, 'lowpass', 3000, 300, 0.7, 0.7); },
    snap() { if (!ok()) return; const t = ac.currentTime; tone(700, t, 0.08, 'triangle', 0.3); tone(1050, t + 0.05, 0.2, 'sine', 0.2); },
    // нота поющего кристалла (0..5)
    note(i) {
      if (!ok()) return; const t = ac.currentTime;
      const f = [523.25, 659.25, 783.99, 1046.5, 880, 587.33][i % 6];
      tone(f, t, 0.9, 'triangle', 0.22); tone(f * 2, t, 0.5, 'sine', 0.06); tone(f / 2, t, 0.6, 'sine', 0.08);
    },
    win() {
      if (!ok()) return; const t = ac.currentTime;
      [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => tone(mf(n), t + i * 0.09, 0.6, 'triangle', 0.15));
      [72, 76, 79].forEach(n => tone(mf(n), t + 0.75, 1.2, 'sine', 0.12));
    },
    levelUp() {
      if (!ok()) return; const t = ac.currentTime;
      [60, 67, 72, 64, 71, 76, 67, 74, 79, 84].forEach((n, i) => tone(mf(n), t + i * 0.11, 0.8, 'triangle', 0.13));
    },
  };
})();

document.addEventListener('visibilitychange', () => { document.hidden ? Sound.pause() : Sound.resume(); });
