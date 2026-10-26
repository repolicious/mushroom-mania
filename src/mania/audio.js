// Web Audio engine: buses, loudness-matched clips and a few synth sounds.
// Every failure is silent; the game never breaks over audio.
import maniaMedia from './media';
import { MUSHROOMS, EXTRA_GAINS } from './data';

const AC = window.AudioContext || window.webkitAudioContext;
const ua = navigator.userAgent;
const isIOS = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);

let ctx = null;
let master = null;
const bus = {};
const buf = {};
const clipGain = {};
let noise = null;
let silentEl = null;
let muted = false;

const LOAD_ORDER = [
  'sm64_here_we_go', 'Pink_Disco', 'Psilocybe', 'Funeral_Bell', 'Purple_Jellydisc', 'Witches_Butter', 'Bitter_Poisonpie',
  'Bug_Sputnik', 'Pancake_Crust', 'Destroying_Angel', 'Whiskery_Milkcap', 'Goblet_Parachute', 'Cinnamon_Jellybaby',
  'Hairy_Parachute', 'Barometer_Earthstar', 'Mint_Mildew', 'Dewdrop_Dapperling', 'Bonfire_Cauliflower',
  'Chicken_of_the_Woods', 'The_Pretender', 'Hairy_Nuts_Disco', 'sm64_high_score',
];

const setAudioSession = () => {
  try { if ('audioSession' in navigator) navigator.audioSession.type = 'playback'; } catch (e) { /* not supported */ }
};

// A 0.5 s, 8 kHz, 8-bit mono silent WAV as a data: URI (no blob: URLs, see WebKit 15.4).
const silentWavUri = () => {
  const n = 4000;
  const bytes = new Uint8Array(44 + n);
  const dv = new DataView(bytes.buffer);
  const str = (o, s) => { for (let i = 0; i < s.length; i += 1) bytes[o + i] = s.charCodeAt(i); };
  str(0, 'RIFF'); dv.setUint32(4, 36 + n, true); str(8, 'WAVE'); str(12, 'fmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, 8000, true); dv.setUint32(28, 8000, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true);
  str(36, 'data'); dv.setUint32(40, n, true);
  bytes.fill(128, 44);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(bin)}`;
};

export const initAudio = (startMuted) => {
  muted = startMuted;
  MUSHROOMS.forEach((m) => { clipGain[m.key] = m.gain; });
  Object.assign(clipGain, EXTRA_GAINS);
  if (!AC) return;
  try {
    try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { ctx = new AC(); }
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.15;
    comp.connect(ctx.destination);
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(comp);
    [['tick', 0.45], ['clip', 0.8], ['music', 0.85], ['sfx', 0.6]].forEach(([k, v]) => {
      bus[k] = ctx.createGain();
      bus[k].gain.value = v;
      bus[k].connect(master);
      bus[k].base = v;
    });
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
    setAudioSession();
  } catch (e) {
    ctx = null;
    return;
  }
  // Decode four at a time.
  const queue = LOAD_ORDER.slice();
  const next = () => {
    const key = queue.shift();
    if (!key || !ctx) return;
    fetch(maniaMedia(`sounds/${key}.wav`))
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
      .then((ab) => new Promise((resolve) => {
        try { ctx.decodeAudioData(ab, (b) => { buf[key] = b; resolve(); }, () => resolve()); } catch (e) { resolve(); }
      }))
      .catch(() => {})
      .then(next);
  };
  [0, 1, 2, 3].forEach(next);
};

export const unlockAudio = () => {
  if (!ctx) return;
  setAudioSession();
  try {
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    const b = ctx.createBuffer(1, 1, 22050);
    const s = ctx.createBufferSource();
    s.buffer = b;
    s.connect(ctx.destination);
    s.start(0);
  } catch (e) { /* ignore */ }
  if (isIOS && !('audioSession' in navigator) && !muted) {
    try {
      if (!silentEl) {
        silentEl = document.createElement('audio');
        silentEl.setAttribute('playsinline', '');
        silentEl.setAttribute('x-webkit-airplay', 'deny');
        silentEl.loop = true;
        silentEl.disableRemotePlayback = true;
        silentEl.src = silentWavUri();
      }
      const p = silentEl.play();
      if (p) p.catch(() => {});
    } catch (e) { /* ignore */ }
  }
};

export const suspendAudio = () => {
  try { if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {}); } catch (e) { /* ignore */ }
  try { if (silentEl) silentEl.pause(); } catch (e) { /* ignore */ }
};

export const isRunning = () => !!ctx && ctx.state === 'running';

export const setMuted = (m) => {
  muted = m;
  if (!ctx) return;
  master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.03);
  if (m && silentEl) { try { silentEl.pause(); } catch (e) { /* ignore */ } }
};

// ---------- voices ----------

const play = (key, opts = {}) => {
  if (!ctx || !buf[key] || ctx.state !== 'running') return null;
  try {
    const src = ctx.createBufferSource();
    src.buffer = buf[key];
    src.playbackRate.value = opts.rate || 1;
    const g = ctx.createGain();
    const vol = (clipGain[key] || 1) * (opts.gain === undefined ? 1 : opts.gain);
    const now = ctx.currentTime + (opts.delay || 0);
    g.gain.setValueAtTime(vol, now);
    src.connect(g);
    g.connect(bus[opts.bus || 'sfx']);
    const offset = opts.offset || 0;
    if (opts.dur) {
      const fade = opts.fade || 0.04;
      const real = opts.dur / (opts.rate || 1);
      g.gain.setValueAtTime(vol, now + Math.max(0, real - fade));
      g.gain.linearRampToValueAtTime(0, now + real);
      src.start(now, offset, opts.dur + 0.01);
    } else src.start(now, offset);
    const voice = { src, g, started: ctx.currentTime, end: ctx.currentTime + (opts.dur || (buf[key].duration - offset)) / (opts.rate || 1) };
    src.onended = () => { voice.done = true; };
    return voice;
  } catch (e) {
    return null;
  }
};

const stop = (voice, fade = 0.03) => {
  if (!voice || voice.done || !ctx) return;
  try {
    const now = ctx.currentTime;
    voice.g.gain.cancelScheduledValues(now);
    voice.g.gain.setValueAtTime(voice.g.gain.value, now);
    voice.g.gain.linearRampToValueAtTime(0, now + fade);
    voice.src.stop(now + fade + 0.01);
  } catch (e) { /* ignore */ }
  voice.done = true;
};

// TICK: Pink Disco's coin ding on a rising major scale.
const SCALE = [0, 2, 4, 5, 7, 9, 11];
const ticks = [];
let lastTick = 0;
export const tick = (combo, mania) => {
  if (!ctx) return;
  const now = ctx.currentTime;
  if (now - lastTick < 0.045) return;
  for (let i = ticks.length - 1; i >= 0; i -= 1) if (ticks[i].done || ticks[i].end < now) ticks.splice(i, 1);
  if (ticks.length >= 4) return;
  lastTick = now;
  const c = Math.max(0, combo - 1);
  let semi = c < 14 ? 12 * Math.floor(c / 7) + SCALE[c % 7] : 12 + SCALE[c % 7];
  if (mania) semi += 5;
  semi = Math.min(semi, 21);
  const v = play('Pink_Disco', {
    bus: 'tick', offset: 0.018, dur: 0.32, rate: 2 ** (semi / 12),
  });
  if (v) ticks.push(v);
};

// CLIP: one voice, priority based ("Mario has one mouth").
let clipVoice = null;
let clipPrio = 0;
let clipIdleAt = 0;
export const clip = (key, prio, opts = {}) => {
  if (!ctx) return;
  const now = ctx.currentTime;
  const busy = clipVoice && !clipVoice.done && clipVoice.end > now;
  if (busy && prio < clipPrio) return;
  if (prio === 1 && (busy || now - clipIdleAt < 0.25)) return;
  if (busy) stop(clipVoice, 0.03);
  clipVoice = play(key, { bus: 'clip', rate: opts.rate || 1, gain: opts.gain });
  clipPrio = prio;
  if (clipVoice) clipIdleAt = clipVoice.end;
};

// MUSIC: one voice; a lower priority request never cuts a higher one.
let musicVoice = null;
let musicPrio = 0;
export const music = (key, prio, opts = {}) => {
  if (!ctx) return null;
  const now = ctx.currentTime;
  if (musicVoice && !musicVoice.done && musicVoice.end > now && prio < musicPrio) return null;
  if (musicVoice) stop(musicVoice, 0.1);
  musicVoice = play(key, {
    bus: 'music', rate: opts.rate, offset: opts.offset, dur: opts.dur, fade: opts.fade,
  });
  musicPrio = prio;
  return musicVoice;
};
export const stopMusic = (fade = 0.1) => { stop(musicVoice, fade); musicVoice = null; musicPrio = 0; };

// SFX: up to four voices, the oldest is stolen.
const sfxVoices = [];
export const sfx = (key, opts = {}) => {
  if (!ctx) return;
  const now = ctx.currentTime;
  for (let i = sfxVoices.length - 1; i >= 0; i -= 1) if (sfxVoices[i].done || sfxVoices[i].end < now) sfxVoices.splice(i, 1);
  if (sfxVoices.length >= 4) stop(sfxVoices.shift(), 0.02);
  const v = play(key, { bus: 'sfx', ...opts });
  if (v) sfxVoices.push(v);
};

// ---------- synth ----------

const synthGain = (vol, t0, dur) => {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.setValueAtTime(vol, t0 + Math.max(0.01, dur - 0.05));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  g.connect(bus.sfx);
  return g;
};

const ready = () => ctx && ctx.state === 'running';

export const sweep = (from, to, dur, vol = 0.25) => {
  if (!ready()) return;
  try {
    const t0 = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 4;
    f.frequency.setValueAtTime(from, t0);
    f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    src.connect(f);
    f.connect(synthGain(vol, t0, dur));
    src.start(t0, 0, dur + 0.05);
  } catch (e) { /* ignore */ }
};

export const thump = () => {
  if (!ready()) return;
  try {
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(90, t0);
    o.frequency.exponentialRampToValueAtTime(35, t0 + 0.35);
    o.connect(synthGain(0.6, t0, 0.35));
    o.start(t0);
    o.stop(t0 + 0.4);
  } catch (e) { /* ignore */ }
};

export const blip = (freq, dur = 0.04, vol = 0.12, type = 'square') => {
  if (!ready()) return;
  try {
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    o.connect(synthGain(vol, t0, dur));
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch (e) { /* ignore */ }
};

export const sadTrombone = () => {
  if (!ready()) return;
  try {
    const t0 = ctx.currentTime;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1200;
    lp.connect(synthGain(0.15, t0, 1.35));
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    [392, 370, 349, 330].forEach((f, i) => o.frequency.setValueAtTime(f, t0 + i * 0.25));
    const vib = ctx.createOscillator();
    const vg = ctx.createGain();
    vib.frequency.value = 6;
    vg.gain.setValueAtTime(0, t0);
    vg.gain.setValueAtTime(8, t0 + 0.75);
    vib.connect(vg);
    vg.connect(o.frequency);
    o.connect(lp);
    o.start(t0); vib.start(t0);
    o.stop(t0 + 1.4); vib.stop(t0 + 1.4);
  } catch (e) { /* ignore */ }
};

// Duck the tick and clip buses (e.g. under the Funeral Bell).
export const duck = (level, secs) => {
  if (!ctx) return;
  const now = ctx.currentTime;
  ['tick', 'clip'].forEach((k) => {
    bus[k].gain.setTargetAtTime(bus[k].base * level, now, 0.03);
    bus[k].gain.setTargetAtTime(bus[k].base, now + secs, 0.1);
  });
};

export const busLevel = (name, level) => {
  if (!ctx || !bus[name]) return;
  bus[name].gain.setTargetAtTime(bus[name].base * level, ctx.currentTime, 0.03);
};

export const fadeAllButMusic = (secs) => {
  if (!ctx) return;
  ['tick', 'clip', 'sfx'].forEach((k) => bus[k].gain.setTargetAtTime(0, ctx.currentTime, secs / 3));
};

export const restoreBuses = () => {
  if (!ctx) return;
  Object.keys(bus).forEach((k) => bus[k].gain.setTargetAtTime(bus[k].base, ctx.currentTime, 0.03));
};

export const audioTime = () => (ctx ? ctx.currentTime : 0);
