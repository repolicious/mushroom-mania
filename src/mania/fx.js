// Game feel: time effects, particles, popups, banners, shake, flashes and set pieces.
// Text is drawn once into small canvases at spawn and blitted every frame.
import { L } from './layout';
import { Spring, clamp, rand, TAU } from './util';

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const fx = {
  hitstopMs: 0,
  timeScale: 1,
  slow: null,
  trauma: 0,
  traumaFloor: 0,
  zoom: new Spring(1, 300, 20),
  pump: 0,
  flash: { color: '#fff', a: 0, ms: 1, t: 1 },
  lastFlash: -9999,
  squash: new Spring(0, 600, 18),
  badgeT: 1,
  hopT: 1,
  poisonT: 1,
  vignettes: { green: 0, gold: 0 },
  edge: null,
  death: null,
  clap: null,
  flyer: null,
  frameHue: 0,
  now: 0,
  particleCap: 150,
};

// ---------- time ----------

export const hitstop = (ms) => { fx.hitstopMs = Math.max(fx.hitstopMs, ms); };
export const slowmo = (scale, ms) => { fx.slow = { scale, ms, t: 0 }; };

export const timeStep = (realDt) => {
  if (fx.hitstopMs > 0) {
    fx.hitstopMs -= realDt * 1000;
    return 0;
  }
  if (fx.slow) {
    const s = fx.slow;
    s.t += realDt * 1000;
    const k = s.t / s.ms;
    if (k >= 1) { fx.slow = null; fx.timeScale = 1; } else if (k < 0.6) fx.timeScale = s.scale;
    else fx.timeScale = s.scale + (1 - s.scale) * ((k - 0.6) / 0.4);
  }
  return realDt * fx.timeScale;
};

// ---------- camera ----------

export const addTrauma = (v) => { if (!reducedMotion) fx.trauma = Math.min(1, fx.trauma + v); };
export const zoomPunch = (v) => { if (!reducedMotion) fx.zoom.v = Math.max(fx.zoom.v, v); };

export const flash = (color, a, ms) => {
  if (fx.now - fx.lastFlash < 333) return;
  fx.lastFlash = fx.now;
  fx.flash = { color, a: Math.min(0.6, a) * (reducedMotion ? 0.5 : 1), ms, t: 0 };
};

// ---------- particles (struct of arrays) ----------

const MAXP = 300;
const P = {
  x: new Float32Array(MAXP), y: new Float32Array(MAXP), vx: new Float32Array(MAXP), vy: new Float32Array(MAXP),
  life: new Float32Array(MAXP), max: new Float32Array(MAXP), size: new Float32Array(MAXP), g: new Float32Array(MAXP),
  color: new Array(MAXP).fill('#fff'), n: 0,
};
export const particles = P;

export const burst = (x, y, color, n, opts = {}) => {
  const { U } = L;
  const spread = opts.spread || TAU / 3;
  const dir = opts.dir === undefined ? -Math.PI / 2 : opts.dir;
  for (let i = 0; i < n; i += 1) {
    if (P.n >= fx.particleCap) return;
    const j = P.n;
    P.n += 1;
    const a = dir + (Math.random() - 0.5) * spread;
    const sp = rand(Math.random, opts.min || 2, opts.max || 4) * U;
    P.x[j] = x; P.y[j] = y;
    P.vx[j] = Math.cos(a) * sp; P.vy[j] = Math.sin(a) * sp;
    P.max[j] = rand(Math.random, opts.lifeMin || 0.35, opts.lifeMax || 0.6);
    P.life[j] = P.max[j];
    P.size[j] = (opts.size || 0.09) * U * rand(Math.random, 0.7, 1.3);
    P.g[j] = (opts.gravity === undefined ? 20 : opts.gravity) * U;
    P.color[j] = typeof color === 'function' ? color(i) : color;
  }
};

const updateParticles = (dt) => {
  let i = 0;
  while (i < P.n) {
    P.life[i] -= dt;
    if (P.life[i] <= 0) {
      const last = P.n - 1;
      P.x[i] = P.x[last]; P.y[i] = P.y[last]; P.vx[i] = P.vx[last]; P.vy[i] = P.vy[last];
      P.life[i] = P.life[last]; P.max[i] = P.max[last]; P.size[i] = P.size[last]; P.g[i] = P.g[last];
      P.color[i] = P.color[last];
      P.n -= 1;
    } else {
      P.vy[i] += P.g[i] * dt;
      P.x[i] += P.vx[i] * dt;
      P.y[i] += P.vy[i] * dt;
      i += 1;
    }
  }
};

// ---------- text sprites ----------

const textCanvas = (lines, opts = {}) => {
  const { dpr } = L;
  const pad = 8;
  const meas = document.createElement('canvas').getContext('2d');
  const sized = lines.map((ln) => {
    meas.font = ln.font;
    return { ...ln, w: meas.measureText(ln.text).width, h: ln.size * 1.25 };
  });
  const maxW = opts.maxW || 640;
  const w = Math.min(maxW, Math.max(...sized.map((l) => l.w)) + pad * 2 + 8);
  const h = sized.reduce((a, l) => a + l.h, 0) + pad * 2;
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * dpr);
  c.height = Math.ceil(h * dpr);
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  let y = pad;
  sized.forEach((ln) => {
    g.font = ln.font;
    const scale = ln.w > w - pad * 2 ? (w - pad * 2) / ln.w : 1;
    g.save();
    g.translate(w / 2, y + ln.h / 2);
    if (ln.rot) g.rotate(ln.rot);
    g.scale(scale, scale);
    if (ln.pill) {
      g.fillStyle = 'rgba(0,0,0,.65)';
      const pw = ln.w + 16;
      const ph = ln.size + 10;
      g.beginPath();
      g.moveTo(-pw / 2 + ph / 2, -ph / 2);
      g.arc(pw / 2 - ph / 2, 0, ph / 2, -Math.PI / 2, Math.PI / 2);
      g.arc(-pw / 2 + ph / 2, 0, ph / 2, Math.PI / 2, -Math.PI / 2);
      g.fill();
    }
    if (ln.glow) {
      g.shadowColor = ln.glow;
      g.shadowBlur = 8;
      g.shadowOffsetX = 2;
      g.shadowOffsetY = 2;
    }
    if (ln.stroke) {
      g.strokeStyle = ln.stroke;
      g.lineWidth = ln.strokeW || 4;
      g.strokeText(ln.text, 0, 0);
      g.shadowColor = 'transparent';
    }
    if (ln.rainbow) {
      const grad = g.createLinearGradient(-ln.w / 2, 0, ln.w / 2, 0);
      ['#ff2a2a', '#ffa62b', '#ffe14d', '#5cff5c', '#3dd6ff', '#b44dff', '#ff2fa0'].forEach((col, i, arr) => grad.addColorStop(i / (arr.length - 1), col));
      g.fillStyle = grad;
    } else g.fillStyle = ln.color || '#fff';
    g.fillText(ln.text, 0, 0);
    g.restore();
    y += ln.h;
  });
  return { c, w, h };
};

export const textSprite = textCanvas;

const PS = (size) => `${size}px "Press Start 2P", monospace`;
const BS = (size) => `${size}px "Bungee Shade", Impact, sans-serif`;
const SQ = (size) => `${size}px "Squada One", "Arial Narrow", sans-serif`;
export const FONTS = { PS, BS, SQ };

// ---------- popups ----------

export const popups = [];
let lastPopup = { x: -99, y: -99, at: -99, stack: 0 };

export const popup = (text, x, y, opts = {}) => {
  if (popups.length >= 16) popups.shift();
  const size = (opts.size || 14) * (opts.big ? 1.3 : 1);
  const spr = textCanvas([{
    text, font: PS(size), size, color: opts.color || '#fff', stroke: '#3a0a0a', strokeW: 4, rainbow: opts.rainbow,
  }], { maxW: L.PW });
  let py = y;
  if (Math.abs(x - lastPopup.x) < 0.8 * L.U && fx.now - lastPopup.at < 250) {
    lastPopup.stack += 1;
    py -= lastPopup.stack * 0.45 * L.U;
  } else lastPopup.stack = 0;
  lastPopup = { ...lastPopup, x, y, at: fx.now };
  popups.push({
    spr, x: clamp(x, L.fieldLeft + spr.w / 2, L.fieldLeft + L.PW - spr.w / 2), y: py, t: 0, life: opts.life || 0.7, rise: opts.rise === undefined ? 1.2 : opts.rise, fall: opts.fall || 0,
  });
};

const updatePopups = (dt) => {
  for (let i = popups.length - 1; i >= 0; i -= 1) {
    const p = popups[i];
    p.t += dt;
    if (p.t >= p.life) popups.splice(i, 1);
  }
};

// ---------- banners ----------

export const banners = [];

export const banner = (lines, opts = {}) => {
  if (banners.length >= 4) banners.shift();
  const spr = textCanvas(lines, { maxW: Math.min(L.W, 720) });
  banners.push({
    spr, t: 0, hold: opts.hold || 1.2, mode: opts.mode || 'slam', y: opts.y === undefined ? 0.42 : opts.y,
  });
};

export const bannerLines = {
  big: (text, opts = {}) => ({
    text, font: BS(opts.size || 30), size: opts.size || 30, color: opts.color || '#fff', glow: opts.glow === undefined ? 'rgb(247,14,14)' : opts.glow, rainbow: opts.rainbow, stroke: opts.stroke, strokeW: 6, rot: opts.rot,
  }),
  pixel: (text, opts = {}) => ({
    text, font: PS(opts.size || 14), size: opts.size || 14, color: opts.color || '#fff', stroke: '#3a0a0a', strokeW: 4, glow: opts.glow,
  }),
  body: (text, opts = {}) => ({
    text, font: SQ(opts.size || 22), size: opts.size || 22, color: opts.color || '#fff', stroke: '#000', strokeW: 4,
  }),
};

const updateBanners = (dt) => {
  for (let i = banners.length - 1; i >= 0; i -= 1) {
    const b = banners[i];
    b.t += dt;
    if (b.t >= b.hold + 0.3 + 0.3) banners.splice(i, 1);
  }
};

// ---------- labels following items ----------

export const labels = [];
export const label = (it, text) => {
  const spr = textCanvas([{
    text, font: PS(10), size: 10, color: '#fff', pill: true,
  }], { maxW: L.PW });
  labels.push({ it, spr, t: 0 });
};

// ---------- set pieces ----------

export const deathSeq = (mode) => { fx.death = { mode, t: 0 }; };
export const clapSeq = () => { fx.clap = { t: 0 }; };
export const flyerSeq = (x, y) => { fx.flyer = { x, y, t: 0 }; };
export const edgeGlow = (side) => { fx.edge = { side, t: 0 }; };
export const vignette = (name, a) => { fx.vignettes[name] = a; };
export const squashKick = () => { fx.squash.v = 1; fx.squash.vel = 0; };
export const badgeSlam = () => { fx.badgeT = 0; };
export const hop = () => { if (!reducedMotion) fx.hopT = 0; };
export const poisonPulse = () => { fx.poisonT = 0; };

export const clearFx = () => {
  P.n = 0;
  popups.length = 0;
  banners.length = 0;
  labels.length = 0;
  fx.death = null; fx.clap = null; fx.flyer = null; fx.edge = null;
  fx.vignettes.green = 0; fx.vignettes.gold = 0;
  fx.trauma = 0; fx.traumaFloor = 0; fx.hitstopMs = 0; fx.slow = null; fx.timeScale = 1;
  fx.zoom.v = 1; fx.zoom.vel = 0;
  fx.flash.a = 0;
};

// ---------- per frame ----------

export const updateFx = (simDt, realDt) => {
  fx.now += realDt * 1000;
  updateParticles(simDt);
  updatePopups(simDt);
  updateBanners(realDt);
  for (let i = labels.length - 1; i >= 0; i -= 1) {
    labels[i].t += realDt;
    if (labels[i].t > 1.5 || !labels[i].it.on) labels.splice(i, 1);
  }
  fx.trauma = Math.max(fx.traumaFloor, fx.trauma - 1.5 * realDt);
  fx.zoom.step(Math.min(realDt, 1 / 30));
  fx.squash.step(Math.min(simDt, 1 / 30));
  fx.flash.t += realDt * 1000;
  fx.badgeT = Math.min(1, fx.badgeT + realDt / 0.26);
  fx.hopT = Math.min(1, fx.hopT + realDt / 0.24);
  fx.poisonT = Math.min(1, fx.poisonT + realDt / 0.3);
  fx.vignettes.green = Math.max(0, fx.vignettes.green - realDt / 0.4 * 0.45);
  if (fx.edge) { fx.edge.t += realDt; if (fx.edge.t > 0.8) fx.edge = null; }
  if (fx.death) fx.death.t += realDt;
  if (fx.clap) { fx.clap.t += realDt; if (fx.clap.t > 2.6) fx.clap = null; }
  if (fx.flyer) { fx.flyer.t += realDt; if (fx.flyer.t > 0.7) fx.flyer = null; }
};

// Camera transform for #stage (the HUD never shakes).
export const cameraTransform = (t) => {
  const k = fx.trauma * fx.trauma;
  const n = (a, b, c, d) => 0.6 * Math.sin(a * t + b) + 0.4 * Math.sin(c * t + d);
  const ox = reducedMotion ? 0 : 12 * k * n(37.1, 0.3, 61.7, 1.7);
  const oy = reducedMotion ? 0 : 12 * k * n(41.3, 2.1, 57.9, 0.6);
  const rot = reducedMotion ? 0 : 1.5 * k * n(29.7, 1.1, 47.3, 2.9);
  const zoom = reducedMotion ? 1 : fx.zoom.v * (1 + fx.pump);
  return `translate3d(${ox.toFixed(2)}px,${oy.toFixed(2)}px,0) rotate(${rot.toFixed(3)}deg) scale(${zoom.toFixed(4)})`;
};
