// Screen geometry, recomputed on resize. The field is a portrait column PW wide;
// U = PW / 10 is the world unit, so every screen plays the same.
import { T } from './config';

export const L = {
  W: 0, H: 0, dpr: 1, safeT: 0, safeR: 0, safeB: 0, safeL: 0,
  PW: 0, U: 0, fieldLeft: 0, availW: 0, usableBottom: 0, usableH: 0,
  floorY: 0, MH: 0, MW: 0, marioTop: 0, basketBottomY: 0, rimY: 0,
  hudBottom: 0, spawnY: 0, pFloor: 1.4, phoneLandscape: false, PAD: 24,
};

const px = (v) => parseFloat(v) || 0;

export const computeLayout = () => {
  const vv = window.visualViewport;
  L.W = Math.round(vv ? vv.width : window.innerWidth);
  L.H = Math.round(vv ? vv.height : window.innerHeight);
  const probe = getComputedStyle(document.getElementById('probe'));
  L.safeT = px(probe.paddingTop);
  L.safeR = px(probe.paddingRight);
  L.safeB = px(probe.paddingBottom);
  L.safeL = px(probe.paddingLeft);

  L.availW = L.W - L.safeL - L.safeR;
  L.usableBottom = L.H - L.safeB;
  L.usableH = L.usableBottom - L.safeT;

  L.PW = Math.round(Math.min(L.availW, Math.max(Math.min(Math.round(0.70 * L.usableH), 720), Math.min(360, L.availW))));
  L.U = L.PW / 10;
  L.fieldLeft = L.safeL + (L.availW - L.PW) / 2;

  const { U } = L;
  L.floorY = L.usableBottom - Math.max(6, 0.30 * U);
  L.MH = T.marioH * U;
  L.MW = (L.MH * 200) / 262;
  L.marioTop = L.floorY - L.MH;
  L.basketBottomY = L.marioTop + T.marioAnchor.y * L.MH;
  L.rimY = L.basketBottomY - T.basketH * U;

  L.phoneLandscape = window.matchMedia('(pointer: coarse)').matches && L.W > L.H && L.H < 500;

  const root = document.getElementById('mania');
  root.style.setProperty('--fl', `${L.fieldLeft}px`);
  root.style.setProperty('--pw', `${L.PW}px`);
  return L;
};

// The HUD strip's bottom edge decides where mushrooms appear (just under it).
export const measureHud = () => {
  const strip = document.getElementById('strip');
  const r = strip.getBoundingClientRect();
  L.hudBottom = r.height ? r.bottom : L.safeT + 2.2 * L.U;
  L.spawnY = L.hudBottom - 1.0 * L.U;
  L.pFloor = (L.floorY - 0.25 * L.U - L.spawnY) / (L.rimY - L.spawnY);
};

// World x (U) and fall progress p to screen pixels (stage coordinates, before the PAD offset).
export const itemX = (x) => L.fieldLeft + x * L.U;
export const itemY = (p) => L.spawnY + p * (L.rimY - L.spawnY);
