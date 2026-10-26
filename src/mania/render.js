// Two canvases: #bg (the scrolling GIF, DPR 1) and #fg (everything else, DPR up to 2).
// The stage is oversized by PAD on every side so screen shake never shows an edge.
import { L, itemX, itemY } from './layout';
import { S, BG, variantsReady } from './assets';
import {
  W, items, telegraphs, FALL, MISS, SLURP, BLAST, SPLAT,
} from './world';
import { input } from './input';
import {
  fx, particles, popups, banners, labels, reducedMotion, cameraTransform, textSprite, FONTS,
} from './fx';
import { MUSHROOMS, BELL, PSI } from './data';
import { T } from './config';
import { DEG, TAU, clamp, easeOutBack, easeOutCubic } from './util';

const PAD = 24;
let bg; let bgx; let fg; let fgx; let stage; let frameEl;
let scroll = 0;
let scrollSpeed = 12;
let hueT = 0;
let time = 0;
let cameraIdle = true;
const badgeCache = new Map();
let bang = null;

export const render = { quality: 0 }; // governor step 0-3

export const initRender = () => {
  stage = document.getElementById('stage');
  bg = document.getElementById('bg');
  fg = document.getElementById('fg');
  frameEl = document.getElementById('frame');
  bgx = bg.getContext('2d', { alpha: false });
  fgx = fg.getContext('2d');
};

export const resizeCanvases = () => {
  const cw = L.W + 2 * PAD;
  const ch = L.H + 2 * PAD;
  bg.width = cw;
  bg.height = ch;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (render.quality >= 1) dpr = Math.min(dpr, 1.5);
  if (cw * ch * dpr * dpr > 2.4e6) dpr = Math.sqrt(2.4e6 / (cw * ch));
  L.dpr = dpr;
  fg.width = Math.round(cw * dpr);
  fg.height = Math.round(ch * dpr);
  frameEl.style.display = L.PW < L.availW - 1 ? 'block' : 'none';
  badgeCache.clear();
  bang = null;
};

// ---------- background ----------

const drawBackground = (dt) => {
  const tile = BG.tile;
  bgx.setTransform(1, 0, 0, 1, 0, 0);
  bgx.fillStyle = '#a2c3e7';
  bgx.fillRect(0, 0, bg.width, bg.height);
  if (!tile) return;
  const groundY = L.floorY - 0.25 * L.U + PAD;
  const s = groundY / 418;
  const tw = 500 * s;
  const th = 450 * s;
  const manic = W.mania.on && !reducedMotion;
  const target = W.mania.on ? (W.mania.level === 2 ? 360 : 180) : 12;
  scrollSpeed += (target - scrollSpeed) * Math.min(1, dt / 0.5 * 3);
  if (reducedMotion) scrollSpeed = 12;
  scroll += scrollSpeed * dt;
  const parallax = 0.15 * (input.basketX - 5) * L.U;
  const offset = ((scroll + parallax) % (2 * tw) + 2 * tw) % (2 * tw);
  let variantA = null;
  let variantB = null;
  let mix = 0;
  if (W.mania.on && variantsReady()) {
    const cycle = reducedMotion ? 8 : (W.mania.level === 2 ? 1.2 : 2.4);
    hueT += dt;
    const ph = (hueT / cycle) * 6;
    const i = Math.floor(ph) % 6;
    variantA = BG.variants[i];
    if (render.quality >= 3) mix = 0; else { variantB = BG.variants[(i + 1) % 6]; mix = ph - Math.floor(ph); }
  }
  const drawTile = (img, x, mirrored) => {
    if (mirrored) {
      bgx.setTransform(-1, 0, 0, 1, x + tw, 0);
      bgx.drawImage(img, 0, 0, 500, 450, 0, 0, tw, th);
      bgx.drawImage(img, 0, 438, 500, 12, 0, th, tw, bg.height - th + 1);
      bgx.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      bgx.drawImage(img, 0, 0, 500, 450, x, 0, tw, th);
      bgx.drawImage(img, 0, 438, 500, 12, x, th, tw, bg.height - th + 1);
    }
  };
  let k = 0;
  for (let x = -offset; x < bg.width; x += tw, k += 1) {
    const mirrored = k % 2 === 1;
    bgx.globalAlpha = 1;
    drawTile(variantA || tile, x, mirrored);
    if (variantB && mix > 0.01) {
      bgx.globalAlpha = mix;
      drawTile(variantB, x, mirrored);
    }
  }
  bgx.globalAlpha = 1;
  if (!manic) hueT = 0;
};

// ---------- foreground helpers ----------

const draw = (spr, x, y, rot, sx, sy, alpha, ax = 0.5, ay = 0.5) => {
  if (!spr || alpha <= 0) return;
  const d = L.dpr;
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  fgx.globalAlpha = alpha > 1 ? 1 : alpha;
  fgx.setTransform(d * c * sx, d * s * sx, -d * s * sy, d * c * sy, d * (x + PAD), d * (y + PAD));
  fgx.drawImage(spr.c, -spr.w * ax, -spr.h * ay, spr.w, spr.h);
};

const identity = () => {
  const d = L.dpr;
  fgx.setTransform(d, 0, 0, d, d * PAD, d * PAD);
};

const badge = (mult) => {
  if (!badgeCache.has(mult)) {
    if (badgeCache.size > 24) badgeCache.clear();
    badgeCache.set(mult, textSprite([{
      text: `x${mult}`, font: FONTS.PS(16), size: 16, color: '#fff', stroke: '#3a0a0a', strokeW: 4,
    }]));
  }
  return badgeCache.get(mult);
};

const drawItem = (it) => {
  const spr = S.items[it.type];
  if (!spr) return;
  let x = itemX(it.x);
  let y = itemY(it.p);
  let sx = it.size * it.sx;
  let sy = it.size * it.sy;
  let alpha = it.harmless ? 0.5 : 1;
  let rot = it.rot * DEG;
  if (it.state === SLURP) {
    const k = Math.min(1, it.st / 0.09);
    x = it.bx + (itemX(input.basketX) - it.bx) * k;
    y = it.by + (L.rimY - it.by) * k;
    sx *= 1 - 0.5 * k; sy *= 1 - 0.5 * k;
  } else if (it.state === BLAST) {
    x = it.bx; y = it.by;
    alpha = 1 - it.st / 0.5;
  } else if (it.state === SPLAT) {
    y = itemY(L.pFloor);
    sx *= 1.4; sy *= 0.35;
    alpha *= 1 - it.st / 0.3;
    rot = 0;
  }
  if (it.state === FALL) {
    if (it.kind === BELL) draw(S.bellGlow, x, y, rot, sx, sy, 0.6 + 0.4 * Math.sin(TAU * 2 * time));
    if (it.motion === 'heavy') {
      const step = 0.35 * L.U;
      draw(spr, x, y - step, rot, sx, sy, 0.25);
      draw(spr, x, y - 2 * step, rot, sx, sy, 0.12);
    }
    if (W.mania.on && !reducedMotion && render.quality < 2 && it.p > 0.35) {
      const k = 0.25 * L.U * (W.mania.level === 2 ? 1.6 : 1.2);
      draw(spr, x, y - k, rot, sx, sy, 0.25);
      draw(spr, x, y - 2 * k, rot, sx, sy, 0.15);
      draw(spr, x, y - 3 * k, rot, sx, sy, 0.08);
    }
  }
  if (it.kind === BELL && it.state === FALL) {
    // Swing from the top of the bell: the centre hangs half a height below the pivot.
    const half = (spr.h * sy) / 2;
    draw(spr, x - Math.sin(rot) * half, y - half + Math.cos(rot) * half, rot, sx, sy, alpha);
    return;
  }
  draw(spr, x, y, rot, sx, sy, alpha);
};

const drawMario = () => {
  const { U } = L;
  const bob = 2 * Math.sin(TAU * 1.5 * time);
  let hopY = 0;
  if (fx.hopT < 1) hopY = 0.15 * U * Math.sin(Math.PI * fx.hopT);
  if (W.mania.on && !reducedMotion) hopY = Math.max(hopY, 0.15 * U * Math.abs(Math.sin(TAU * 1 * time)));
  const ax = itemX(input.basketX);
  const ay = L.basketBottomY + bob - hopY;
  const lean = input.lean * DEG;
  let alpha = 1;
  if (W.invuln > 0 && W.mode === 'playing') alpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.cos(TAU * 6 * time));
  const m = S.mario;
  if (m) {
    const padX = (m.w - L.MW) / 2;
    const padY = (m.h - L.MH) / 2;
    draw(m, ax, ay, lean, 1, 1, alpha, (padX + T.marioAnchor.x * L.MW) / m.w, (padY + T.marioAnchor.y * L.MH) / m.h);
  }

  // Basket: back rim, pile, front body, all pivoting on the hand.
  const bwMax = T.basketWMM * U;
  const scaleW = W.bw / T.basketWMM;
  const sq = fx.squash.v;
  const sx = 1 + 0.15 * sq;
  const sy = 1 - 0.18 * sq;
  const tilt = -0.5 * lean;
  const bh = T.basketH * U;
  const d = L.dpr;
  const c = Math.cos(tilt); const s = Math.sin(tilt);
  const setBasket = (extraX = 1, extraY = 1) => {
    fgx.setTransform(d * c * extraX, d * s * extraX, -d * s * extraY, d * c * extraY, d * (ax + PAD), d * (ay + PAD));
  };
  fgx.globalAlpha = alpha;
  setBasket(scaleW * sx, sy);
  fgx.fillStyle = '#7a5232';
  fgx.beginPath();
  fgx.ellipse(0, -bh, bwMax / 2, 0.11 * U, 0, 0, TAU);
  fgx.fill();
  // Pile of the last few catches.
  const offs = [[-0.6, -0.10], [0, -0.25], [0.6, -0.10], [-0.3, -0.35], [0.3, -0.35]];
  const k = W.bw / 2.7;
  W.pile.forEach((type, i) => {
    const o = offs[i];
    const bobP = 0.04 * U * Math.sin(TAU * 2 * time + i * 1.3);
    const px = o[0] * k * U * sx;
    const py = -bh + o[1] * U + bobP;
    draw(S.minis[type], ax + c * px - s * py, ay + s * px + c * py, tilt, 1, 1, alpha);
  });
  const body = W.mania.on ? S.basketGold : S.basket;
  if (body) {
    setBasket(scaleW * sx, sy);
    fgx.globalAlpha = alpha;
    fgx.drawImage(body.c, -bwMax / 2 - body.pad, -bh - body.pad, body.w, body.h);
    if (fx.poisonT < 1 && S.basketGreen) {
      fgx.globalAlpha = alpha * Math.abs(Math.sin(fx.poisonT * Math.PI * 3));
      fgx.drawImage(S.basketGreen.c, -bwMax / 2 - body.pad, -bh - body.pad, body.w, body.h);
    }
    if (W.mania.on) {
      fgx.globalAlpha = alpha;
      fgx.strokeStyle = `hsl(${Math.round((time * 300) % 360)},100%,60%)`;
      fgx.lineWidth = 3 / (scaleW * sx);
      fgx.beginPath();
      fgx.moveTo(-bwMax / 2, -bh);
      fgx.lineTo(bwMax / 2, -bh);
      fgx.stroke();
    }
  }
  // Multiplier badge.
  const mult = W.tierMult * W.maniaX;
  if (mult >= 2 && W.mode === 'playing') {
    const b = badge(mult);
    const slam = fx.badgeT < 1 ? 2.5 - 1.5 * easeOutBack(fx.badgeT) : 1;
    draw(b, ax, ay - bh - 0.45 * U - b.h / 2, 0, slam, slam, 1);
  }
};

const drawParticles = () => {
  identity();
  let last = '';
  for (let i = 0; i < particles.n; i += 1) {
    const col = particles.color[i];
    if (col !== last) { fgx.fillStyle = col; last = col; }
    fgx.globalAlpha = Math.min(1, particles.life[i] / particles.max[i] * 1.5);
    const sz = particles.size[i];
    fgx.fillRect(particles.x[i] - sz / 2, particles.y[i] - sz / 2, sz, sz);
  }
};

const drawSetPieces = () => {
  const cx = L.fieldLeft + L.PW / 2;
  const cy = L.safeT + L.usableH * 0.45;
  if (fx.flyer && S.psiFlyer) {
    const k = Math.min(1, fx.flyer.t / 0.35);
    const x = fx.flyer.x + (cx - fx.flyer.x) * easeOutCubic(k);
    const y = fx.flyer.y + (cy - fx.flyer.y) * easeOutCubic(k);
    const sc = (0.3 + 1.9 * k) / 2.2;
    const spin = 0.25 + 0.75 * Math.abs(Math.cos(TAU * fx.flyer.t * 1.5));
    const a = fx.flyer.t < 0.35 ? 1 : 1 - (fx.flyer.t - 0.35) / 0.35;
    draw(S.psiFlyer, x, y, 0, sc * spin, sc, a);
  }
  if (fx.death && S.death) {
    const { t, mode } = fx.death;
    const full = 0.9 * L.H;
    let sc = 0;
    let a = 1;
    if (mode === 'hit') {
      const tt = t - 0.2;
      if (tt > 0) {
        const target = 0.55 * L.H / full;
        sc = tt < 0.26 ? target * (0.3 + 0.7 * easeOutBack(tt / 0.26)) : target;
        if (tt > 0.7) { const k = Math.min(1, (tt - 0.7) / 0.3); sc *= 1 + 0.1 * k; a = 1 - k; }
      }
    } else {
      sc = 0.55 * L.H / full + (1 - 0.55 * L.H / full) * Math.min(1, t / 0.6);
    }
    if (sc > 0) draw(S.death, cx, cy, 0, sc * 0.9, sc * 0.9, a);
  }
  if (fx.clap && S.clap) {
    const { t } = fx.clap;
    const rise = Math.min(1, t / 0.3);
    const y = L.H + S.clap.h / 2 - (L.H * 0.55 + S.clap.h / 2) * easeOutCubic(rise);
    const pulse = reducedMotion ? 1 : 1 + 0.02 * Math.sin(TAU * 2.5 * t);
    const a = t > 2.3 ? 1 - (t - 2.3) / 0.3 : 1;
    draw(S.clap, cx, y, 0, pulse, pulse, a);
  }
};

const drawBanners = () => {
  banners.forEach((b) => {
    const { t, hold } = b;
    let sc = 1;
    let a = 1;
    let x = L.fieldLeft + L.PW / 2;
    if (b.mode === 'slam') {
      if (t < 0.3) sc = 3 - 2 * easeOutBack(t / 0.3);
    } else if (t < 0.3) x += (1 - easeOutCubic(t / 0.3)) * L.W;
    if (t > hold + 0.3) a = 1 - (t - hold - 0.3) / 0.3;
    draw(b.spr, x, L.safeT + L.usableH * b.y, 0, sc, sc, a);
  });
};

const drawOverlays = () => {
  const { fieldLeft, PW, H } = L;
  identity();
  const vg = (img, a) => {
    if (a <= 0 || !img) return;
    fgx.globalAlpha = a;
    fgx.drawImage(img, fieldLeft - PAD, -PAD, PW + 2 * PAD, H + 2 * PAD);
  };
  if (S.vignettes) {
    vg(S.vignettes.green, fx.vignettes.green);
    if (W.lives === 1 && W.mode === 'playing') vg(S.vignettes.red, 0.12 + 0.13 * (0.5 + 0.5 * Math.sin(TAU * time)));
    if (W.mania.on && !variantsReady()) vg(S.vignettes.gold, 0.5);
    if (W.mode === 'dying' && render.quality >= 3) vg(S.vignettes.dark, 0.5);
  }
  if (fx.edge && S.edge) {
    fgx.globalAlpha = 0.6 * (1 - fx.edge.t / 0.8);
    const w = 0.6 * L.U;
    if (fx.edge.side < 0) fgx.drawImage(S.edge, fieldLeft, 0, w, H);
    else {
      fgx.save();
      fgx.translate(fieldLeft + PW, 0);
      fgx.scale(-1, 1);
      fgx.drawImage(S.edge, 0, 0, w, H);
      fgx.restore();
    }
  }
  if (W.mania.on && W.mania.level === 2) {
    fgx.globalAlpha = 1;
    fgx.fillStyle = `hsl(${Math.round((time * 600) % 360)},100%,55%)`;
    fgx.fillRect(fieldLeft, 0, PW, 6);
    fgx.fillRect(fieldLeft, H - 6, PW, 6);
    fgx.fillRect(fieldLeft, 0, 6, H);
    fgx.fillRect(fieldLeft + PW - 6, 0, 6, H);
  }
  const f = fx.flash;
  if (f.t < f.ms && f.a > 0) {
    fgx.globalAlpha = f.a * (1 - f.t / f.ms);
    fgx.fillStyle = f.color;
    fgx.fillRect(-PAD, -PAD, L.W + 2 * PAD, H + 2 * PAD);
  }
};

const drawDebug = () => {
  identity();
  fgx.globalAlpha = 0.8;
  fgx.strokeStyle = '#0f0';
  fgx.lineWidth = 1;
  fgx.beginPath();
  fgx.moveTo(L.fieldLeft, L.rimY); fgx.lineTo(L.fieldLeft + L.PW, L.rimY);
  fgx.stroke();
  const half = W.bw / 2;
  const bx = itemX(input.basketX);
  fgx.fillStyle = 'rgba(0,255,0,.25)';
  fgx.fillRect(bx - (half + T.goodReach) * L.U, L.rimY - 3, 2 * (half + T.goodReach) * L.U, 6);
  fgx.fillStyle = 'rgba(255,0,0,.4)';
  const bad = Math.max(0.40, half - 0.15);
  fgx.fillRect(bx - bad * L.U, L.rimY - 1, 2 * bad * L.U, 2);
};

export const renderFrame = (dt, debug) => {
  time += dt;
  drawBackground(dt);
  fgx.setTransform(1, 0, 0, 1, 0, 0);
  fgx.clearRect(0, 0, fg.width, fg.height);
  if (!S.items) return;

  // Missed things go behind Mario; falling things in front of the basket.
  for (let i = 0; i < items.length; i += 1) {
    const it = items[i];
    if (it.on && (it.state === MISS || it.state === SPLAT)) drawItem(it);
  }
  telegraphs.forEach((tg) => {
    const x = itemX(tg.x);
    const y = L.hudBottom + 0.6 * L.U;
    const a = 0.55 + 0.45 * Math.sin(TAU * 4 * tg.age);
    draw(S.tele, x, y, 0, 1, 1, a);
    if (!bang) {
      bang = textSprite([{
        text: '!', font: FONTS.PS(18), size: 18, color: '#ff2a2a', stroke: '#fff', strokeW: 4,
      }]);
    }
    draw(bang, x + 0.6 * L.U, y, 0, 1, 1, a);
  });
  drawMario();
  for (let i = 0; i < items.length; i += 1) {
    const it = items[i];
    if (it.on && (it.state === FALL || it.state === SLURP || it.state === BLAST)) drawItem(it);
  }
  labels.forEach((lb) => {
    const it = lb.it;
    const a = lb.t > 1.2 ? 1 - (lb.t - 1.2) / 0.3 : 1;
    draw(lb.spr, clamp(itemX(it.x), L.fieldLeft + lb.spr.w / 2, L.fieldLeft + L.PW - lb.spr.w / 2), itemY(it.p) - 1.1 * L.U, 0, 1, 1, a);
  });
  drawParticles();
  popups.forEach((p) => {
    const k = p.t / p.life;
    const sc = p.t < 0.08 ? 1.4 - 0.4 * (p.t / 0.08) : 1;
    const a = p.t > p.life - 0.2 ? (p.life - p.t) / 0.2 : 1;
    const dy = p.fall ? 0.5 * p.fall * L.U * p.t * p.t : -p.rise * L.U * easeOutCubic(k);
    draw(p.spr, p.x, p.y + dy, 0, sc, sc, a);
  });
  drawSetPieces();
  drawBanners();
  drawOverlays();
  if (debug) drawDebug();
  fgx.globalAlpha = 1;

  // Camera on the stage element (the HUD stays still).
  const busy = fx.trauma > 0.001 || Math.abs(fx.zoom.v - 1) > 0.0005 || fx.pump > 0;
  if (busy) {
    stage.style.transform = cameraTransform(time);
    cameraIdle = false;
  } else if (!cameraIdle) {
    stage.style.transform = '';
    cameraIdle = true;
  }
};

export const renderTime = () => time;
