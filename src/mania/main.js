// Boot, state machine, frame loop and the wiring from world events to fx, audio and HUD.
import './mania.css';
import { T, LEVEL_BANNERS } from './config';
import {
  L, computeLayout, measureHud, itemX, itemY,
} from './layout';
import {
  loadImages, loadFonts, bakeSprites, bakeBackgroundVariants, S, IMAGE_COUNT,
} from './assets';
import { input, initInput, updateInput } from './input';
import {
  W, events, items, resetRun, updateWorld, debugAction, directorInfo, FALL,
} from './world';
import {
  fx, timeStep, updateFx, hitstop, slowmo, addTrauma, zoomPunch, flash, burst, popup, banner, bannerLines,
  label, deathSeq, clapSeq, flyerSeq, edgeGlow, vignette, squashKick, badgeSlam, hop, poisonPulse, clearFx, reducedMotion,
} from './fx';
import {
  initRender, resizeCanvases, renderFrame, render, renderTime,
} from './render';
import * as A from './audio';
import * as UI from './ui';
import {
  MUSHROOMS, POISON, BELL, PSI, NORMAL_COUNT,
} from './data';
import { fmt, TAU } from './util';

const params = new URLSearchParams(window.location.search);
const DEBUG = params.has('debug');
const START_T = Number(params.get('t')) || 0;
const SEED = params.has('seed') ? Number(params.get('seed')) : null;

let state = 'BOOT';
let pausedFrom = null;
let raf = 0;
let last = 0;
let readyT = 0;
let goAt = T.goAt;
let goFired = false;
let firstRun = true;
let dyingT = 0;
let overArmAt = Infinity;
let againPressAt = -1;
let assetsReady = false;
let lastU = 0;
let lastW = 0;
const RAINBOW = ['#ff2a2a', '#ffa62b', '#ffe14d', '#5cff5c', '#3dd6ff', '#b44dff', '#ff2fa0'];
const rainbow = (i) => RAINBOW[i % RAINBOW.length];
const stageEl = document.getElementById('stage');

// ---------- layout ----------

let relayoutQueued = false;
const relayout = () => {
  relayoutQueued = false;
  const prevW = lastW;
  computeLayout();
  resizeCanvases();
  measureHud();
  if (assetsReady && Math.abs(L.U - lastU) / (lastU || 1) > 0.02) bakeSprites();
  if (assetsReady && L.dpr !== S.dpr) { bakeSprites(); S.dpr = L.dpr; }
  lastU = L.U;
  lastW = L.W;
  UI.show('rotate', L.phoneLandscape);
  if ((state === 'PLAYING' || state === 'READY') && (L.phoneLandscape || (prevW && prevW !== L.W))) pause(L.phoneLandscape ? 'rotate' : 'resize');
};
const queueRelayout = () => {
  if (relayoutQueued) return;
  relayoutQueued = true;
  requestAnimationFrame(relayout);
};

// ---------- states ----------

function startLoop() {
  if (raf) return;
  last = performance.now();
  raf = requestAnimationFrame(frame);
}

const toTitle = () => {
  state = 'TITLE';
  W.mode = 'title';
  input.enabled = false;
  input.basketX = 5;
  document.body.classList.remove('playing');
  stageEl.classList.remove('dying');
  UI.show('hud', false);
  UI.show('over', false);
  UI.show('pause', false);
  UI.show('ready', false);
  UI.show('title', true);
  UI.updateTitleBest();
  A.stopMusic(0.2);
  A.restoreBuses();
};

const startRun = () => {
  A.unlockAudio();
  resetRun(SEED === null ? (Date.now() >>> 0) : SEED, { t: START_T, showLabels: UI.store.games < 3 });
  clearFx();
  stageEl.classList.remove('dying');
  UI.show('title', false);
  UI.show('over', false);
  UI.show('pause', false);
  UI.show('hud', true);
  UI.resetHud(W.lives);
  measureHud();
  state = 'READY';
  W.mode = 'ready';
  input.enabled = true;
  input.basketX = 5;
  readyT = 0;
  goFired = false;
  UI.readyText('READY?', false);
  UI.show('ready', true);
  document.body.classList.add('playing');
  A.restoreBuses();
  if (firstRun) {
    A.music('sm64_here_we_go', 1);
    goAt = T.goAt;
  } else {
    A.music('sm64_here_we_go', 1, { offset: T.againOffset });
    goAt = T.goAt - T.againOffset;
  }
  firstRun = false;
  startLoop();
};

function pause(reason) {
  if (state !== 'PLAYING' && state !== 'READY') return;
  pausedFrom = state;
  state = 'PAUSED';
  A.suspendAudio();
  UI.saveStore();
  input.left = false;
  input.right = false;
  UI.showPause(reason === 'hidden' ? 'Welcome back!' : 'Mario is catching his breath.', W.score);
}

const resume = () => {
  if (state !== 'PAUSED' || L.phoneLandscape) return;
  A.unlockAudio();
  UI.show('pause', false);
  state = pausedFrom || 'PLAYING';
  if (state === 'PLAYING') {
    hitstop(600);
    banner([bannerLines.big('GO!', { size: 40 })], { hold: 0.4 });
  }
  last = performance.now();
  if (!raf) raf = requestAnimationFrame(frame);
};

const quit = () => {
  UI.show('pause', false);
  W.mode = 'title';
  toTitle();
  if (!raf) startLoop();
};

const toggleMute = () => {
  UI.store.muted = !UI.store.muted;
  A.setMuted(UI.store.muted);
  UI.setSoundLabels();
  UI.saveStore();
};

const showOver = () => {
  state = 'OVER';
  input.enabled = false;
  document.body.classList.remove('playing');
  const prevBest = UI.store.best;
  const newBest = W.score > prevBest;
  const s = UI.store;
  s.games += 1;
  if (newBest) s.best = W.score;
  s.bestCombo = Math.max(s.bestCombo, W.stats.bestCombo);
  s.maniaManias += W.stats.maniaManias;
  s.fullBaskets += W.stats.fullBaskets;
  W.stats.typeCounts.forEach((n, i) => { s.typeCounts[i] += n; });
  UI.saveStore();
  againPressAt = -1;
  overArmAt = performance.now() + 900;
  UI.showOver({
    score: W.score, prevBest, newBest, stats: W.stats, level: W.level, games: s.games - 1,
  }, (i) => A.blip(220 + i * 10, 0.04), (k) => A.blip(600 + 600 * k, 0.025, 0.06), null);
  if (newBest) {
    setTimeout(() => {
      if (state !== 'OVER') return;
      A.stopMusic(0.3);
      A.music('sm64_high_score', 2);
    }, 2600);
  }
};

const playAgain = () => {
  if (state !== 'OVER' || performance.now() < overArmAt) return;
  startRun();
};

// ---------- loop ----------

let govAcc = 0;
let govFrames = 0;
let govSlow = 0;
let fpsText = '';

const governor = (realDt) => {
  if (state !== 'PLAYING') { govAcc = 0; govFrames = 0; return; }
  govAcc += realDt;
  govFrames += 1;
  if (govAcc >= 1) {
    const avg = (govAcc / govFrames) * 1000;
    fpsText = `${Math.round(1000 / avg)} fps, ${avg.toFixed(1)} ms`;
    govSlow = avg > 20 ? govSlow + 1 : 0;
    govAcc = 0;
    govFrames = 0;
    if (govSlow >= 2 && render.quality < 3) {
      render.quality += 1;
      govSlow = 0;
      if (render.quality === 1) { resizeCanvases(); bakeSprites(); S.dpr = L.dpr; }
      if (render.quality === 2) fx.particleCap = 75;
    }
  }
};

const ambient = (dt) => {
  for (let i = 0; i < items.length; i += 1) {
    const it = items[i];
    if (!it.on || it.state !== FALL) continue;
    if (it.kind === PSI) {
      it.fx += dt;
      while (it.fx > 1 / 18) {
        it.fx -= 1 / 18;
        burst(itemX(it.x) + (Math.random() - 0.5) * L.U, itemY(it.p) + (Math.random() - 0.5) * L.U, '#ffe680', 1, {
          min: 0.2, max: 0.8, gravity: 0, spread: TAU, size: 0.08,
        });
      }
    } else if (it.kind === POISON) {
      it.fx += dt;
      if (it.fx > 0.25) {
        it.fx = 0;
        burst(itemX(it.x) + (Math.random() - 0.5) * 0.6 * L.U, itemY(it.p), '#7cff4f', 1, {
          min: 0.5, max: 1, gravity: -2, spread: 0.6, size: 0.1, lifeMin: 0.5, lifeMax: 0.8,
        });
      }
    }
  }
  if (W.mania.on && !reducedMotion) {
    const beat = Math.abs(Math.sin(TAU * renderTime()));
    fx.pump = (W.mania.level === 2 ? 0.03 : 0.015) * beat;
  } else fx.pump = 0;
};

function frame(now) {
  raf = 0;
  const realDt = Math.min((now - last) / 1000, 0.05);
  last = now;
  updateInput(realDt);
  const simDt = timeStep(realDt);

  if (state === 'READY') {
    readyT += realDt;
    if (!goFired && readyT >= goAt) {
      goFired = true;
      UI.readyText('GO!', true);
      state = 'PLAYING';
      W.mode = 'playing';
      setTimeout(() => { if (W.mode === 'playing' || state === 'PAUSED') UI.show('ready', false); }, 600);
    }
  }
  if (state === 'DYING') {
    dyingT += realDt;
    if (dyingT >= 1.8) showOver();
  }

  if (state !== 'PAUSED' && state !== 'OVER') {
    updateWorld(simDt, realDt);
    if (state === 'PLAYING' || state === 'TITLE') ambient(simDt);
  }
  updateFx(state === 'OVER' ? 0 : simDt, realDt);
  renderFrame(state === 'PAUSED' ? 0 : realDt, DEBUG);
  if (state !== 'TITLE' && state !== 'BOOT') UI.flushHud(realDt, W, UI.store.best);
  governor(realDt);
  if (DEBUG) {
    const d = directorInfo();
    let n = 0;
    items.forEach((it) => { if (it.on) n += 1; });
    UI.debugText(`${fpsText} | t ${W.t.toFixed(1)} LV ${W.level} | fall ${d.fall.toFixed(2)} rate ${d.rate.toFixed(2)} pP ${d.pPoison.toFixed(2)} pB ${d.pBell.toFixed(2)} | items ${n} | q${render.quality}${W.god ? ' | GOD' : ''}`);
  }
  if (state !== 'PAUSED') raf = requestAnimationFrame(frame);
}

// ---------- world events -> fx, audio, HUD ----------

const maniaOn = () => W.mania.on;
const basketPoint = () => [itemX(input.basketX), L.rimY];

events.on('catch', ({
  it, type, pts, isNew, word, combo,
}) => {
  const m = MUSHROOMS[type];
  const [bx, by] = basketPoint();
  const x = itemX(it.x);
  squashKick();
  if (maniaOn()) burst(x, by, rainbow, 12);
  else burst(x, by, m.color, 8);
  // During MANIA the rain is too thick for words: points only.
  let text = `+${fmt(pts)}`;
  if (type === 19) text += ' magic!';
  else if (!maniaOn() && word) text += ` ${m.desc}!`;
  if (isNew && !maniaOn()) text += ' NEW!';
  popup(text, x, by - 0.6 * L.U, { rainbow: maniaOn(), big: maniaOn() });
  addTrauma(maniaOn() ? 0.05 : 0.04);
  A.tick(combo, maniaOn());
  if (type !== 19) {
    const rate = (1 + 0.01 * Math.min(combo, 20)) * (maniaOn() ? 1.06 : 1);
    if (isNew) A.clip(m.key, 2, { rate });
    else if (Math.random() < (maniaOn() ? 0.2 : 0.5)) A.clip(m.key, 1, { rate });
  }
  if (isNew) UI.stripNew(type);
});

events.on('tierUp', ({ tier }) => {
  const [bx, by] = basketPoint();
  badgeSlam();
  popup(T.tierNames[tier - 1], bx, by - 1.3 * L.U, { color: '#ffd700', life: 0.9 });
  burst(bx, by - 0.4 * L.U, '#ffd700', 16, { spread: TAU, min: 2, max: 3.5, gravity: 4 });
  zoomPunch(1.02);
  addTrauma(0.15);
  if (tier >= 5) hop();
  if (tier <= 4) A.sfx('Bug_Sputnik', { rate: [1, 1.12, 1.25][tier - 2] || 1 });
  else A.sfx('Pancake_Crust', { rate: [1, 1.12, 1.25, 1.4][tier - 5] || 1.4 });
});

events.on('comboLost', ({ combo, x }) => {
  if (combo < 7) return;
  popup(`COMBO ${combo} LOST`, itemX(x), L.rimY - 1.5 * L.U, {
    color: '#bbbbbb', life: 0.8, rise: 0, fall: 10,
  });
  A.sfx('Pink_Disco', { rate: 0.55, dur: 0.4 });
});

events.on('dropped', ({ it }) => {
  popup('DROPPED!', itemX(it.x), L.rimY, { color: '#ff8a8a', size: 12 });
});

events.on('poison', ({
  it, killed, emptied, notch,
}) => {
  const [bx, by] = basketPoint();
  hitstop(70);
  vignette('green', 0.45);
  poisonPulse();
  squashKick();
  killed.forEach((t) => burst(bx, by, MUSHROOMS[t].color, 6, { spread: 2.4, min: 3, max: 6, gravity: 25 }));
  burst(bx, by, '#7cff4f', 10, { spread: TAU, min: 1, max: 3 });
  popup(emptied ? 'Oh, NO! Your basket is empty!' : 'Oh, NO! 2 mushrooms died!', bx, by - 1.0 * L.U, { color: '#b7ff9e', size: 12, life: 1.1 });
  popup(notch >= 3 ? 'Tiny basket!' : 'Basket shrank!', bx, by - 1.6 * L.U, { color: '#ffffff', size: 11, life: 1.1 });
  addTrauma(0.35);
  A.clip(MUSHROOMS[it.type].key, 3);
  UI.stripKilled(killed);
});

events.on('repair', () => {
  const [bx, by] = basketPoint();
  popup('Lifesaver! Basket fixed!', bx, by - 1.6 * L.U, { color: '#9dffc0', size: 12, life: 1 });
});

events.on('pretender', ({ it }) => popup('Just pretending!', itemX(it.x), L.rimY - 1.4 * L.U, { color: '#ffd7a8', size: 12 }));

events.on('shift', ({ it }) => burst(itemX(it.x), itemY(it.p), '#cccccc', 6, { spread: TAU, min: 1, max: 2, gravity: 0 }));

events.on('telegraph', ({ first }) => { if (first) A.sfx('Hairy_Nuts_Disco'); });

events.on('bellHit', () => {
  hitstop(200);
  slowmo(0.35, 400);
  flash('#ff0000', 0.5, 250);
  addTrauma(0.85);
  deathSeq('hit');
  banner([bannerLines.big('BOWSER GOT YOU!', { size: 28 }), bannerLines.pixel('DEADLY MUSHROOM', { size: 12 })], { hold: 1.1 });
  A.music('Funeral_Bell', 3, { offset: 0.063, dur: 1.45, fade: 0.25 });
  A.thump();
  A.duck(0.3, 1.7);
  setTimeout(() => { if (fx.death && fx.death.mode === 'hit') fx.death = null; }, 1300);
});

events.on('gameOver', () => {
  state = 'DYING';
  dyingT = 0;
  input.enabled = false;
  hitstop(350);
  deathSeq('over');
  slowmo(0.15, 1500);
  addTrauma(0.9);
  flash('#ff0000', 0.5, 300);
  if (render.quality < 3) stageEl.classList.add('dying');
  A.music('Funeral_Bell', 5);
  A.fadeAllButMusic(0.5);
});

events.on('basketFull', ({
  bonus, inMania, life, revenge,
}) => {
  const [bx, by] = basketPoint();
  if (inMania) {
    UI.stripSweep(30, (i) => A.blip(500 + i * 40, 0.03, 0.07), () => { if (life) A.sfx('Barometer_Earthstar'); });
    return;
  }
  hitstop(100);
  UI.stripSweep(40, null, null);
  clapSeq();
  const lines = [
    bannerLines.big('FULL BASKET!', { size: 30 }),
    bannerLines.body('You WIN! (keep going...)', { size: 22 }),
    bannerLines.pixel(`+${fmt(bonus)}`, { size: 16, color: '#ffd700' }),
  ];
  if (life) lines.push(bannerLines.pixel('+1 LIFE', { size: 14, color: '#9dffc0' }));
  if (revenge) lines.push(bannerLines.pixel("BOWSER'S REVENGE", { size: 11, color: '#ff8a8a' }));
  banner(lines, { hold: 1.8, y: 0.3 });
  for (let i = 0; i < 40; i += 1) burst(bx, by, MUSHROOMS[i % NORMAL_COUNT].color, 1, { spread: 2.2, min: 4, max: 9, size: 0.18, lifeMin: 0.8, lifeMax: 1.3 });
  addTrauma(0.45);
  A.music('sm64_high_score', 2);
  A.duck(0.3, 2.5);
  if (life) setTimeout(() => A.sfx('Barometer_Earthstar'), 900);
});

events.on('maniaStart', () => {
  const [bx, by] = basketPoint();
  hitstop(120);
  setTimeout(() => slowmo(0.3, 400), 120);
  flash('#ffffff', 0.6, 250);
  zoomPunch(1.06);
  addTrauma(0.6);
  fx.traumaFloor = reducedMotion ? 0 : 0.3;
  flyerSeq(bx, by);
  banner([
    bannerLines.big('MUSHROOM MANIA!', { size: 34, rainbow: true, stroke: '#3a0a0a' }),
    bannerLines.body('The magic mushroom finished filling the basket!', { size: 18 }),
    bannerLines.pixel('x5 POINTS!', { size: 16, color: '#ffd700' }),
  ], { hold: 1.4, y: 0.32 });
  A.music('Psilocybe', 4, { rate: 0.875 });
  A.clip('Destroying_Angel', 3);
  A.sweep(300, 4000, 0.4);
  A.busLevel('tick', 0.3 / 0.45);
  A.busLevel('clip', 0.6 / 0.8);
});

events.on('maniaMania', () => {
  addTrauma(0.8);
  fx.traumaFloor = reducedMotion ? 0 : 0.4;
  flash('#ffffff', 0.5, 200);
  banner([
    bannerLines.big('MUSHROOM MANIA', { size: 30, rainbow: true, stroke: '#3a0a0a' }),
    bannerLines.big('MANIA!!', { size: 40, rainbow: true, stroke: '#3a0a0a', rot: -7 * (Math.PI / 180) }),
    bannerLines.pixel('x10!!', { size: 18, color: '#ffd700' }),
  ], { hold: 1.4, y: 0.32 });
  A.music('Psilocybe', 4, { rate: 1 });
  A.clip('Whiskery_Milkcap', 3);
});

events.on('maniaEnd', ({ total }) => {
  fx.traumaFloor = 0;
  A.clip('Goblet_Parachute', 3);
  A.sweep(4000, 300, 0.4);
  A.restoreBuses();
  banner([bannerLines.pixel(`MANIA BONUS +${fmt(total)}`, { size: 16, color: '#ffd700' })], { hold: 1.6, y: 0.36 });
});

events.on('retyped', ({ it }) => burst(itemX(it.x), itemY(it.p), '#ffd700', 8, { spread: TAU, min: 1, max: 3, gravity: 0 }));

events.on('psiSpawn', ({ side }) => {
  edgeGlow(side);
  A.sfx('Cinnamon_Jellybaby', { rate: 1.3 });
});

events.on('psiMissed', ({ it }) => {
  popup('Missed the magic!', itemX(it.x), L.rimY - 0.8 * L.U, { color: '#ffd700', size: 12, life: 1.1 });
  A.sadTrombone();
});

events.on('mmMissed', ({ it }) => popup('so close!', itemX(it.x), L.rimY - 0.8 * L.U, { color: '#ffffff', size: 11 }));

events.on('levelUp', ({ level }) => {
  const text = level < LEVEL_BANNERS.length ? LEVEL_BANNERS[level] : `LEVEL ${level} - SUPER MUSHROOM MANIA`;
  if (!text) return;
  banner([bannerLines.pixel(`LEVEL ${level}`, { size: 12, color: '#ffd700' }), bannerLines.body(text, { size: 24 })], { mode: 'slide', hold: 1.3, y: 0.36 });
  A.sfx('Hairy_Parachute');
});

events.on('revenge', () => {
  banner([bannerLines.big("BOWSER'S REVENGE", { size: 26 }), bannerLines.body('no more 1-UPs!', { size: 22 })], { hold: 1.6, y: 0.36 });
  A.music('Funeral_Bell', 3, { offset: 0.063, dur: 1.45, rate: 0.8 });
});

events.on('shower', () => {
  banner([bannerLines.big('MUSHROOM SHOWER!', { size: 26 })], { hold: 1.0, y: 0.3 });
  A.sfx('Bonfire_Cauliflower', { rate: 1.25 });
});

events.on('perfectShower', () => {
  banner([bannerLines.pixel(`PERFECT SHOWER! +${fmt(T.perfectShower)}`, { size: 14, color: '#ffd700' })], { hold: 1.2, y: 0.36 });
});

events.on('pass', () => A.sfx('Mint_Mildew', { rate: 1.5, gain: 0.3 }));

events.on('splat', ({ it }) => burst(itemX(it.x), L.floorY - 0.25 * L.U, '#c99c6d', 4, { spread: 1.6, min: 1, max: 2.5, gravity: 15 }));

events.on('fizzle', ({ it }) => burst(itemX(it.x), L.floorY - 0.25 * L.U, MUSHROOMS[it.type].color, 6, { spread: TAU, min: 1, max: 2.5, gravity: 5 }));

events.on('firstLabel', ({ it }) => {
  const text = it.kind === POISON ? "POISON! Don't catch it!" : it.kind === BELL ? "FUNERAL BELL! Bowser's coming - DODGE!" : 'PSILOCYBE! CATCH IT!!';
  label(it, text);
});

input.onDust = () => {
  if (state !== 'PLAYING') return;
  burst(itemX(input.basketX), L.floorY - 0.1 * L.U, '#c99c6d', 4, { spread: 2.4, min: 1, max: 2.5, gravity: 10, size: 0.08 });
};

// ---------- DOM and lifecycle wiring ----------

const onClick = (id, fn) => document.getElementById(id).addEventListener('click', (e) => { e.preventDefault(); A.sfx('Mint_Mildew', { rate: 1.25, gain: 0.3 }); fn(e); });

const wireDom = () => {
  onClick('btn-go', () => { if (state === 'TITLE') startRun(); });
  onClick('btn-pause', () => pause('button'));
  onClick('btn-mute', () => { A.unlockAudio(); toggleMute(); });
  onClick('btn-resume', resume);
  onClick('btn-sound', () => { A.unlockAudio(); toggleMute(); });
  onClick('btn-quit', quit);
  const again = document.getElementById('btn-again');
  again.addEventListener('pointerdown', () => { againPressAt = performance.now(); });
  again.addEventListener('click', (e) => {
    e.preventDefault();
    if (againPressAt >= overArmAt || (againPressAt < 0 && performance.now() >= overArmAt)) playAgain();
  });

  initInput({
    anyGesture: () => { if (!A.isRunning() && state !== 'PAUSED') A.unlockAudio(); },
    pauseKey: () => { if (state === 'PAUSED') resume(); else pause('key'); },
    muteKey: toggleMute,
    confirmKey: () => {
      if (state === 'TITLE' && assetsReady) startRun();
      else if (state === 'PAUSED') resume();
      else if (state === 'OVER') playAgain();
    },
    otherKey: (e) => { if (DEBUG) debugAction(e.key); },
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pause('hidden'); A.suspendAudio(); UI.saveStore(); }
  });
  window.addEventListener('pagehide', () => { A.suspendAudio(); UI.saveStore(); });
  window.addEventListener('pageshow', (e) => { if (e.persisted && state === 'PLAYING') pause('hidden'); });
  window.addEventListener('blur', () => pause('blur'));
  window.addEventListener('resize', queueRelayout);
  window.addEventListener('orientationchange', queueRelayout);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', queueRelayout);

  // No scrolling, pinch-zoom or double-tap zoom while playing.
  const stop = (e) => e.preventDefault();
  ['gesturestart', 'gesturechange', 'gestureend', 'dblclick'].forEach((n) => document.addEventListener(n, stop, { passive: false }));
  document.addEventListener('touchmove', (e) => {
    if (e.target.closest && e.target.closest('.screen .scroll')) return;
    e.preventDefault();
  }, { passive: false });
};

// ---------- boot ----------

const boot = async () => {
  if (DEBUG) {
    document.getElementById('debug').classList.remove('hidden');
    window.mmm = {
      W, items, input, L, fx,
    };
  }
  UI.loadStore();
  UI.initUi();
  UI.setSoundLabels();
  UI.updateTitleBest();
  initRender();
  computeLayout();
  resizeCanvases();
  measureHud();
  lastU = L.U;
  lastW = L.W;
  UI.show('rotate', L.phoneLandscape);
  A.initAudio(UI.store.muted);
  wireDom();
  state = 'TITLE';
  W.mode = 'title';
  UI.setLoading(0, IMAGE_COUNT);
  startLoop();
  await Promise.all([loadFonts(), loadImages((n, total) => UI.setLoading(n, total))]);
  bakeSprites();
  S.dpr = L.dpr;
  assetsReady = true;
  UI.setLoading(IMAGE_COUNT, IMAGE_COUNT);
  setTimeout(bakeBackgroundVariants, 300);
  if (document.fonts && document.fonts.addEventListener) {
    document.fonts.addEventListener('loadingdone', () => { if (assetsReady) bakeSprites(); });
  }
};

boot();
