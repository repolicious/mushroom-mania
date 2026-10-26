// Image loading and sprite baking. Everything with a glow, outline or tint is drawn
// once here (shadowBlur and getImageData are fine at bake time, never per frame).
import faUrl from '@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff2?url';
import maniaMedia from './media';
import { MUSHROOMS, OTHER_IMAGES, NORMAL_COUNT } from './data';
import { T } from './config';
import { L } from './layout';
import { sleep } from './util';

export const IMG = {}; // key -> HTMLImageElement
export const S = {}; // baked sprites, rebuilt when U changes
export const BG = { tile: null, variants: [] };

const ALL_KEYS = [...MUSHROOMS.map((m) => m.key), ...OTHER_IMAGES];
export const IMAGE_COUNT = ALL_KEYS.length + 1; // + the background GIF

const canvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
};

const loadImage = (src) => new Promise((resolve) => {
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    const done = () => resolve(img);
    if (img.decode) img.decode().then(done, done); else done();
  };
  img.onerror = () => resolve(null);
  img.src = src;
});

export const loadImages = async (onProgress) => {
  let n = 0;
  const tick = () => { n += 1; onProgress(n, IMAGE_COUNT); };
  const jobs = ALL_KEYS.map((key) => loadImage(maniaMedia(`images/${key}.webp`)).then((img) => { IMG[key] = img; tick(); }));
  jobs.push(loadImage(maniaMedia('images/Super_Mario_Final.gif')).then((img) => { BG.tile = img; tick(); }));
  await Promise.all(jobs);
};

export const loadFonts = async () => {
  try {
    const face = new FontFace('FA Solid', `url(${faUrl})`, { weight: '900' });
    document.fonts.add(face);
    face.load().catch(() => {});
  } catch (e) { /* icons fall back to nothing */ }
  const wanted = ['16px "Press Start 2P"', '16px "Bungee Shade"', '16px "Squada One"'];
  try {
    await Promise.race([Promise.all(wanted.map((f) => document.fonts.load(f))), sleep(1500)]);
  } catch (e) { /* bake with fallbacks */ }
};

// A white (or tinted) silhouette of an image, same size.
const silhouette = (img, w, h, color) => {
  const c = canvas(w, h);
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0, c.width, c.height);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  return c;
};

// sizeU: longest side in U. opts: outline color, glow {color, blur (U), passes}, padU.
const bakeImage = (img, longest, opts = {}) => {
  const { dpr } = L;
  if (!img) return null;
  const k = (longest * dpr) / Math.max(img.naturalWidth, img.naturalHeight);
  const w = img.naturalWidth * k;
  const h = img.naturalHeight * k;
  const pad = Math.ceil((opts.padU || 0.08) * L.U * dpr);
  const c = canvas(w + 2 * pad, h + 2 * pad);
  const g = c.getContext('2d');
  if (opts.glow) {
    const sil = silhouette(img, w, h, opts.glow.color);
    g.save();
    g.shadowColor = opts.glow.color;
    g.shadowBlur = opts.glow.blur * L.U * dpr;
    for (let i = 0; i < (opts.glow.passes || 2); i += 1) g.drawImage(sil, pad, pad, w, h);
    g.restore();
    if (opts.glowOnly) {
      g.globalCompositeOperation = 'destination-out';
      g.drawImage(img, pad, pad, w, h);
      return { c, w: c.width / dpr, h: c.height / dpr };
    }
  }
  if (opts.outline) {
    const sil = silhouette(img, w, h, opts.outline);
    const o = 2 * dpr;
    for (let a = 0; a < 8; a += 1) {
      const ang = (a / 8) * Math.PI * 2;
      g.drawImage(sil, pad + Math.cos(ang) * o, pad + Math.sin(ang) * o, w, h);
    }
  }
  if (opts.tint) {
    g.drawImage(silhouette(img, w, h, opts.tint), pad, pad, w, h);
  } else {
    g.drawImage(img, pad, pad, w, h);
  }
  return { c, w: c.width / dpr, h: c.height / dpr };
};

const bakeBasket = (fill, weave) => {
  const { dpr, U } = L;
  const bw = T.basketWMM * U;
  const bh = T.basketH * U;
  const pad = 6;
  const c = canvas((bw + 2 * pad) * dpr, (bh + 2 * pad) * dpr);
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  g.translate(pad, pad);
  const trap = () => {
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(bw, 0);
    g.lineTo(bw * 0.89, bh);
    g.lineTo(bw * 0.11, bh);
    g.closePath();
  };
  g.save();
  g.shadowColor = 'rgba(0,0,0,.8)';
  g.shadowBlur = 4;
  g.shadowOffsetX = 2;
  g.shadowOffsetY = 2;
  trap();
  g.fillStyle = fill;
  g.fill();
  g.restore();
  g.save();
  trap();
  g.clip();
  g.strokeStyle = weave;
  g.lineWidth = Math.max(1, U * 0.05);
  for (let i = 1; i <= 3; i += 1) {
    g.beginPath(); g.moveTo(0, (bh * i) / 4); g.lineTo(bw, (bh * i) / 4); g.stroke();
  }
  g.lineWidth = Math.max(1, U * 0.035);
  for (let x = -bh; x < bw + bh; x += U * 0.32) {
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x + bh * 0.6, bh); g.stroke();
  }
  g.fillStyle = weave;
  g.fillRect(0, 0, bw, U * 0.12);
  g.restore();
  trap();
  g.strokeStyle = '#fff';
  g.lineWidth = 2;
  g.stroke();
  return { c, w: c.width / dpr, h: c.height / dpr, pad };
};

const bakeVignette = (color, inner = 0.35) => {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 128 * inner, 128, 128, 182);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, color);
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return c;
};

const bakeEdge = () => {
  const c = canvas(64, 8);
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 64, 0);
  grad.addColorStop(0, 'rgba(255,215,0,.95)');
  grad.addColorStop(1, 'rgba(255,215,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 8);
  return c;
};

const free = (spr) => { if (spr && spr.c) { spr.c.width = 0; spr.c.height = 0; } };

export const bakeSprites = () => {
  Object.values(S).forEach((v) => (Array.isArray(v) ? v.forEach(free) : free(v)));
  const { U, H } = L;
  S.items = MUSHROOMS.map((m) => {
    const size = T.sizes[m.kind];
    if (m.kind === 0) return bakeImage(IMG[m.key], size * U, { outline: '#fff' });
    if (m.kind === 1) return bakeImage(IMG[m.key], size * U, { glow: { color: '#7cff4f', blur: 0.18, passes: 2 }, outline: '#7cff4f', padU: 0.3 });
    if (m.kind === 2) return bakeImage(IMG[m.key], size * U, { glow: { color: '#ff2a2a', blur: 0.2, passes: 2 }, outline: '#8b0d0d', padU: 0.32 });
    return bakeImage(IMG[m.key], size * U, { glow: { color: '#ffe680', blur: 0.25, passes: 3 }, padU: 0.4 });
  });
  S.bellGlow = bakeImage(IMG.Funeral_Bell, T.sizes[2] * U, { glow: { color: '#ff2a2a', blur: 0.35, passes: 3 }, glowOnly: true, padU: 0.5 });
  S.minis = MUSHROOMS.slice(0, NORMAL_COUNT).map((m) => bakeImage(IMG[m.key], T.mini * U, { padU: 0.02 }));
  S.mario = bakeImage(IMG.Mario_Party_4, L.MH, { padU: 0.02 });
  S.marioGhost = bakeImage(IMG.Mario_Party_4, L.MH, { padU: 0.02, tint: 'rgba(255,255,255,.9)' });
  S.tele = bakeImage(IMG.Death, 0.9 * U, { glow: { color: '#ff2a2a', blur: 0.12, passes: 1 }, padU: 0.15 });
  S.death = bakeImage(IMG.Death, 0.9 * H, { glow: { color: '#bf1212', blur: 0.4, passes: 2 }, padU: 0.5 });
  S.clap = bakeImage(IMG.Mario_Clap, 0.45 * H, { glow: { color: '#ffffff', blur: 0.5, passes: 2 }, padU: 0.6 });
  S.psiFlyer = bakeImage(IMG.Psilocybe, 2.2 * U, { glow: { color: '#ffe680', blur: 0.4, passes: 2 }, padU: 0.5 });
  S.basket = bakeBasket('#c99c6d', '#a5774a');
  S.basketGold = bakeBasket('#f5c542', '#c9951a');
  S.basketGreen = bakeBasket('#6fdc4f', '#3e9c2a');
  if (!S.vignettes) {
    S.vignettes = {
      green: bakeVignette('rgba(60,255,60,.9)'),
      red: bakeVignette('rgba(200,0,0,.95)', 0.45),
      gold: bakeVignette('rgba(255,200,40,.9)', 0.3),
      dark: bakeVignette('rgba(0,0,0,.9)', 0.1),
    };
    S.edge = bakeEdge();
  }
  S.U = U;
};

// MANIA background: the GIF hue-rotated in 60 degree steps and saturated, one per tick.
const hueMatrix = (deg) => {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [
    0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
    0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.140, 0.072 - c * 0.072 - s * 0.283,
    0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072,
  ];
};

export const bakeBackgroundVariants = () => {
  if (!BG.tile || BG.variants.length) return;
  const w = BG.tile.naturalWidth;
  const h = BG.tile.naturalHeight;
  const bakeOne = (i) => {
    try {
      const c = canvas(w, h);
      const g = c.getContext('2d');
      g.drawImage(BG.tile, 0, 0);
      const data = g.getImageData(0, 0, w, h);
      const d = data.data;
      const m = hueMatrix(i * 60);
      const sat = 1.4;
      for (let p = 0; p < d.length; p += 4) {
        const r = d[p]; const gg = d[p + 1]; const b = d[p + 2];
        let nr = m[0] * r + m[1] * gg + m[2] * b;
        let ng = m[3] * r + m[4] * gg + m[5] * b;
        let nb = m[6] * r + m[7] * gg + m[8] * b;
        const lum = 0.2126 * nr + 0.7152 * ng + 0.0722 * nb;
        nr = lum + (nr - lum) * sat; ng = lum + (ng - lum) * sat; nb = lum + (nb - lum) * sat;
        d[p] = nr; d[p + 1] = ng; d[p + 2] = nb;
      }
      g.putImageData(data, 0, 0);
      BG.variants[i] = c;
    } catch (e) {
      BG.variants = []; // tainted or out of memory: MANIA falls back to the gold vignette
      return;
    }
    if (i < 5) setTimeout(() => bakeOne(i + 1), 0);
  };
  setTimeout(() => bakeOne(0), 0);
};

export const variantsReady = () => BG.variants.length === 6;
