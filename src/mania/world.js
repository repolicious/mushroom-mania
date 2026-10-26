// Game rules and simulation. Emits events; fx, audio and ui react to them.
import { T, curves } from './config';
import {
  MUSHROOMS, NORMAL, POISON, BELL, PSI, NORMAL_COUNT, MINT, PRETENDER, POISON_TYPES, BELL_TYPE, PSI_TYPE,
} from './data';
import { input, setBasketHalf } from './input';
import { L } from './layout';
import {
  Emitter, clamp, rand, TAU, DEG, easeOutBack, mulberry32,
} from './util';

export const events = new Emitter();

export const FALL = 0;
export const MISS = 1;
export const SLURP = 2;
export const BLAST = 3;
export const SPLAT = 4;
export const DEAD = 5;

const POOL = 72;
export const items = Array.from({ length: POOL }, () => ({ on: false }));
export const telegraphs = [];

export const W = {
  mode: 'title', // title | ready | playing | dying
  rng: Math.random,
  clock: 0,
  t: 0,
  level: 1,
  score: 0,
  combo: 0,
  tierMult: 1,
  comboTimer: 0,
  lives: T.lives,
  invuln: 0,
  qty: new Uint16Array(NORMAL_COUNT),
  types: 0,
  total: 0,
  notch: 0,
  pile: [],
  bw: T.basketW[0],
  bwFrom: T.basketW[0],
  bwTo: T.basketW[0],
  bwK: 1,
  mania: { on: false, level: 0, timer: 0, total: 0, mmRolled: false },
  maniaX: 1,
  revenge: false,
  showLabels: true,
  god: false,
  stats: null,
};

// Run-only director state.
const D = {};

const pointsFor = (type) => MUSHROOMS[type].pts;
const tierFor = (combo) => {
  let i = 0;
  while (i + 1 < T.tiers.length && T.tiers[i + 1] <= combo) i += 1;
  return i + 1;
};

const recount = () => {
  let types = 0;
  let total = 0;
  for (let i = 0; i < NORMAL_COUNT; i += 1) {
    if (W.qty[i] > 0) types += 1;
    total += W.qty[i];
  }
  W.types = types;
  W.total = total;
};

const targetWidth = () => {
  if (W.mania.on) return W.mania.level === 2 ? T.basketWMM : T.basketWMania;
  return T.basketW[W.notch];
};

const setWidth = () => {
  const to = targetWidth();
  if (to === W.bwTo) return;
  W.bwFrom = W.bw;
  W.bwTo = to;
  W.bwK = 0;
};

export const resetRun = (seed, opts = {}) => {
  W.rng = mulberry32(seed);
  W.clock = 0;
  W.t = opts.t || 0;
  W.level = curves.level(W.t);
  W.score = 0;
  W.combo = 0;
  W.tierMult = 1;
  W.comboTimer = 0;
  W.lives = T.lives;
  W.invuln = 0;
  W.qty.fill(0);
  recount();
  W.notch = 0;
  W.pile = [];
  W.mania = { on: false, level: 0, timer: 0, total: 0, mmRolled: false };
  W.maniaX = 1;
  W.revenge = W.t >= T.revengeAt;
  W.bw = T.basketW[0]; W.bwFrom = W.bw; W.bwTo = W.bw; W.bwK = 1;
  setBasketHalf(W.bw / 2);
  W.showLabels = opts.showLabels !== false;
  W.stats = {
    caught: 0, bestCombo: 0, fullBaskets: 0, manias: 0, maniaManias: 0, typeCounts: new Array(20).fill(0),
  };
  Object.assign(D, {
    nextSpawn: 0.3,
    spawnPause: 0,
    hazardFree: 0,
    postManiaGrace: 0,
    lastSpawnAt: -9,
    lastSpawnX: -9,
    lastNormal: -1,
    nextPsiAt: W.t > 0 ? W.t + rand(W.rng, 4, 8) : rand(W.rng, 22, 28),
    nextShowerAt: Math.max(38, W.t + 18),
    shower: null,
    showerId: 0,
    scriptedPoison: W.t > 7,
    scriptedBell: W.t > 15,
    lastGood: -9,
    firstSeen: {},
    pretenderSeen: false,
    lastWordAt: -9,
  });
  items.forEach((it) => { it.on = false; });
  telegraphs.length = 0;
};

// ---------- spawning ----------

const freeItem = () => {
  for (let i = 0; i < POOL; i += 1) if (!items[i].on) return items[i];
  return null;
};

const liveCount = (pred) => {
  let n = 0;
  for (let i = 0; i < POOL; i += 1) { const it = items[i]; if (it.on && it.state === FALL && pred(it)) n += 1; }
  return n;
};

const AMPLITUDE = { float: 1.0, zigzag: 1.4, psi: 0.6 };

export const spawnItem = (type, x, opts = {}) => {
  const it = freeItem();
  if (!it) return null;
  const m = MUSHROOMS[type];
  const motion = opts.motion || m.motion;
  const amp = AMPLITUDE[motion] || 0;
  const base = opts.fall || curves.fallTime(W.t);
  const factor = opts.fall ? 1 : ({
    drop: 1, float: 1.45, zigzag: 1.25, heavy: 0.72, shifty: 1, jelly: 0.95, bell: 1, psi: 1.4,
  }[motion] || 1);
  Object.assign(it, {
    on: true,
    kind: m.kind,
    type,
    motion,
    x0: clamp(x, 0.7 + amp, 9.3 - amp),
    x: 0,
    p: 0,
    pPrev: 0,
    fall: base * factor * (motion === 'drop' && !opts.fall ? rand(W.rng, 0.92, 1.08) : 1),
    age: 0,
    phase: rand(W.rng, 0, TAU),
    size: opts.size || 1,
    rot: 0,
    rotV: 0,
    sx: 1,
    sy: 1,
    state: FALL,
    st: 0,
    shiftAt: rand(W.rng, 0.35, 0.5),
    shifted: false,
    harmless: false,
    shower: opts.shower || 0,
    mm: !!opts.mm,
    bx: 0,
    by: 0,
    bvx: 0,
    bvy: 0,
    fx: 0,
    label: null,
  });
  it.x = it.x0;
  if (motion === 'drop' && m.spin !== false && !m.rock) it.rotV = rand(W.rng, -60, 60);
  if (m.spinFixed) it.rotV = m.spinFixed * (W.rng() < 0.5 ? -1 : 1);
  D.lastSpawnAt = W.clock;
  D.lastSpawnX = it.x0;
  if (m.kind !== NORMAL && W.showLabels && W.mode === 'playing' && !D.firstSeen[m.kind] && !it.mm) {
    D.firstSeen[m.kind] = true;
    it.label = m.kind;
    events.emit('firstLabel', { it });
  }
  return it;
};

const farX = (minDist) => {
  const bx = input.basketX;
  const lo = bx < 5 ? Math.max(0.9, bx + minDist) : 0.9;
  const hi = bx < 5 ? 9.1 : Math.min(9.1, bx - minDist);
  if (hi <= lo) return bx < 5 ? 9.1 : 0.9;
  return rand(W.rng, lo, hi);
};

const spacedX = (lo = 0.7, hi = 9.3) => {
  let x = rand(W.rng, lo, hi);
  for (let i = 0; i < 5 && W.clock - D.lastSpawnAt < 0.3 && Math.abs(x - D.lastSpawnX) < 1.0; i += 1) x = rand(W.rng, lo, hi);
  return x;
};

const hazardX = (aim, avoidPsi) => {
  for (let i = 0; i < 5; i += 1) {
    let x = W.rng() < aim ? input.basketX + rand(W.rng, -1, 1) : spacedX();
    x = clamp(x, 0.7, 9.3);
    let ok = true;
    for (let j = 0; j < POOL && ok; j += 1) {
      const o = items[j];
      if (o.on && o.state === FALL && (o.kind === NORMAL || o.kind === PSI) && o.p < 0.25 && Math.abs(o.x - x) < 1.2) ok = false;
      if (ok && avoidPsi && o.on && o.state === FALL && o.kind === PSI && Math.abs(o.x - x) < 1.6) ok = false;
    }
    if (ok && W.clock - D.lastSpawnAt < 0.3 && Math.abs(x - D.lastSpawnX) < 1.0) ok = false;
    if (ok) return x;
  }
  return null;
};

const pickNormal = () => {
  let sum = 0;
  const w = new Array(NORMAL_COUNT);
  for (let i = 0; i < NORMAL_COUNT; i += 1) {
    let v = i === D.lastNormal ? 0 : (W.qty[i] === 0 ? 3 : 1);
    if (i === MINT && W.notch > 0) v *= 2;
    w[i] = v;
    sum += v;
  }
  let r = W.rng() * sum;
  for (let i = 0; i < NORMAL_COUNT; i += 1) {
    r -= w[i];
    if (r <= 0) { D.lastNormal = i; return i; }
  }
  return 0;
};

const spawnNormal = (x, opts) => spawnItem(pickNormal(), x === undefined ? spacedX() : x, opts);

const addTelegraph = (x) => {
  telegraphs.push({ x, age: 0, life: T.telegraph });
  if (!D.firstBellSeen) { D.firstBellSeen = true; events.emit('telegraph', { x, first: true }); } else events.emit('telegraph', { x, first: false });
};

const spawnRegular = () => {
  const cap = W.mania.on ? T.itemCapMania : T.itemCap;
  if (liveCount(() => true) >= cap) return;
  const hazardsOk = !D.shower && D.hazardFree <= 0 && !W.mania.on && D.postManiaGrace <= 0;
  const rho = W.rng();
  const pp = curves.pPoison(W.t);
  const pb = curves.pBell(W.t);
  if (hazardsOk && rho < pp && liveCount((o) => o.kind === POISON) < T.poisonCap) {
    const x = hazardX(curves.aimPoison(W.t), false);
    if (x !== null) { spawnItem(POISON_TYPES[Math.floor(W.rng() * 3)], x); return; }
  } else if (hazardsOk && rho < pp + pb && liveCount((o) => o.kind === BELL) + telegraphs.length < T.bellCap) {
    const x = hazardX(curves.aimBell(W.t), true);
    if (x !== null) { addTelegraph(x); return; }
  }
  spawnNormal();
};

const spawnPsi = () => {
  const bx = input.basketX;
  let x;
  if (bx < 5) {
    const lo = Math.max(1.5, bx + 3);
    x = lo <= 8.5 ? rand(W.rng, lo, 8.5) : 8.5;
  } else {
    const hi = Math.min(8.5, bx - 3);
    x = hi >= 1.5 ? rand(W.rng, 1.5, hi) : 1.5;
  }
  const it = spawnItem(PSI_TYPE, x);
  if (it) events.emit('psiSpawn', { x, side: x < 5 ? -1 : 1 });
};

const startShower = () => {
  D.showerId += 1;
  const fromRight = input.basketX < 5;
  D.shower = {
    id: D.showerId, x: fromRight ? 9.0 : 1.0, dir: fromRight ? -1 : 1, left: 8, timer: 0, caught: 0, resolved: 0,
  };
  D.hazardFree = Math.max(D.hazardFree, 1.28 + curves.fallTime(W.t));
  events.emit('shower', {});
};

// ---------- rules ----------

const breakCombo = (cause, x) => {
  if (W.mania.on) return;
  if (W.combo >= 3) events.emit('comboLost', { combo: W.combo, cause, x });
  W.combo = 0;
  W.tierMult = 1;
  W.comboTimer = 0;
};

const addCombo = () => {
  D.lastGood = W.clock;
  W.combo += 1;
  if (W.combo > W.stats.bestCombo) W.stats.bestCombo = W.combo;
  W.comboTimer = curves.comboWindow(W.t);
  const tier = tierFor(W.combo);
  if (tier > W.tierMult) {
    W.tierMult = tier;
    events.emit('tierUp', { tier });
  }
  W.tierMult = tier;
};

const fullBasket = (inMania) => {
  W.stats.fullBaskets += 1;
  const n = W.stats.fullBaskets;
  let bonus = T.fullBasket * n * W.maniaX;
  let life = false;
  if (W.revenge) bonus += T.revengeBonus * n;
  else if (W.lives < T.maxLives) { W.lives += 1; life = true; }
  W.score += bonus;
  if (W.mania.on) W.mania.total += bonus;
  W.notch = 0;
  setWidth();
  W.qty.fill(0);
  recount();
  events.emit('basketFull', {
    n, bonus, inMania, life, revenge: W.revenge,
  });
};

const catchNormal = (it) => {
  addCombo();
  const isNew = W.qty[it.type] === 0;
  W.qty[it.type] += 1;
  recount();
  W.stats.caught += 1;
  W.stats.typeCounts[it.type] += 1;
  const pts = pointsFor(it.type) * W.tierMult * W.maniaX + (isNew ? T.newBonus * W.maniaX : 0);
  W.score += pts;
  if (W.mania.on) W.mania.total += pts;
  W.pile.push(it.type);
  if (W.pile.length > 5) W.pile.shift();
  const word = isNew || W.clock - D.lastWordAt >= 0.5;
  if (word) D.lastWordAt = W.clock;
  events.emit('catch', {
    it, type: it.type, pts, isNew, word, combo: W.combo,
  });
  if (it.type === MINT && W.notch > 0) {
    W.notch -= 1;
    setWidth();
    events.emit('repair', { notch: W.notch });
  }
  if (it.type === PRETENDER && !D.pretenderSeen) {
    D.pretenderSeen = true;
    events.emit('pretender', { it });
  }
  if (it.shower && D.shower && it.shower === D.shower.id) D.shower.caught += 1;
  if (W.types === NORMAL_COUNT) fullBasket(false);
};

const startMania = () => {
  W.mania = {
    on: true, level: 1, timer: T.maniaTime, total: 0, mmRolled: false,
  };
  W.maniaX = 5;
  W.stats.manias += 1;
  W.comboTimer = curves.comboWindow(W.t);
  telegraphs.length = 0;
  for (let i = 0; i < POOL; i += 1) {
    const it = items[i];
    if (it.on && it.state === FALL && (it.kind === POISON || it.kind === BELL)) {
      const type = pickNormal();
      Object.assign(it, {
        kind: NORMAL, type, motion: 'drop', x0: it.x, rotV: rand(W.rng, -60, 60), sx: 1, sy: 1, rot: 0,
      });
      events.emit('retyped', { it });
    }
  }
  setWidth();
  events.emit('maniaStart', {});
  for (let i = 0; i < NORMAL_COUNT; i += 1) W.qty[i] = Math.max(W.qty[i], 1);
  recount();
  fullBasket(true);
};

const startManiaMania = () => {
  W.mania.level = 2;
  W.mania.timer = T.mmTime;
  W.maniaX = 10;
  W.stats.maniaManias += 1;
  setWidth();
  events.emit('maniaMania', {});
};

const endMania = () => {
  const { total } = W.mania;
  W.mania = {
    on: false, level: 0, timer: 0, total: 0, mmRolled: false,
  };
  W.maniaX = 1;
  setWidth();
  D.spawnPause = Math.max(D.spawnPause, 1.0);
  D.postManiaGrace = T.postManiaGrace;
  D.nextPsiAt = W.t + rand(W.rng, 35, 50);
  W.comboTimer = curves.comboWindow(W.t);
  events.emit('maniaEnd', { total });
};

const catchPsi = (it) => {
  addCombo();
  W.stats.caught += 1;
  W.stats.typeCounts[PSI_TYPE] += 1;
  const pts = 1000 * W.tierMult * (it.mm ? 5 : 1);
  W.score += pts;
  if (W.mania.on) W.mania.total += pts;
  events.emit('catch', {
    it, type: PSI_TYPE, pts, isNew: false, word: true, combo: W.combo,
  });
  if (!W.mania.on) startMania();
  else if (it.mm && W.mania.level === 1) startManiaMania();
};

const catchPoison = (it) => {
  breakCombo('poison', it.x);
  W.notch = Math.min(3, W.notch + 1);
  setWidth();
  const killed = [];
  let emptied = false;
  if (W.total <= 2) {
    W.qty.fill(0);
    emptied = true;
  } else {
    for (let k = 0; k < 2; k += 1) {
      const present = [];
      for (let i = 0; i < NORMAL_COUNT; i += 1) if (W.qty[i] > 0) present.push(i);
      const t = present[Math.floor(W.rng() * present.length)];
      W.qty[t] -= 1;
      killed.push(t);
    }
  }
  recount();
  events.emit('poison', {
    it, killed, emptied, notch: W.notch,
  });
};

const blastHazards = () => {
  const bxPx = L.fieldLeft + input.basketX * L.U;
  for (let i = 0; i < POOL; i += 1) {
    const it = items[i];
    if (it.on && it.state === FALL && (it.kind === POISON || it.kind === BELL)) {
      it.state = BLAST;
      it.st = 0;
      it.bx = L.fieldLeft + it.x * L.U;
      it.by = L.spawnY + it.p * (L.rimY - L.spawnY);
      const dir = Math.sign(it.bx - bxPx) || 1;
      it.bvx = dir * 6 * L.U;
      it.bvy = -4 * L.U;
      it.rotV = dir * 540;
    }
  }
  telegraphs.length = 0;
};

const catchBell = (it) => {
  breakCombo('bell', it.x);
  if (W.god || W.lives > 1) {
    if (!W.god) W.lives -= 1;
    W.invuln = T.invuln + 0.2;
    D.spawnPause = Math.max(D.spawnPause, 1.4);
    D.hazardFree = Math.max(D.hazardFree, 2.0);
    blastHazards();
    events.emit('bellHit', { it, lives: W.lives });
  } else {
    W.lives = 0;
    W.mode = 'dying';
    telegraphs.length = 0;
    events.emit('gameOver', { it });
  }
};

const passThrough = (it) => {
  it.harmless = true;
  events.emit('pass', { it });
};

// ---------- per-frame ----------

const moveItem = (it, dt) => {
  const m = MUSHROOMS[it.type];
  it.age += dt;
  const a = it.age;
  switch (it.motion) {
    case 'float':
      it.x = it.x0 + 1.0 * Math.sin(TAU * 0.55 * a + it.phase);
      it.rot = 12 * Math.cos(TAU * 0.55 * a + it.phase) + (m.floatSpin ? m.floatSpin * Math.sin(TAU * 0.3 * a) : 0);
      break;
    case 'zigzag':
      it.x = it.x0 + 1.4 * Math.sin(TAU * 0.9 * a + it.phase);
      it.sy = 0.9 + 0.1 * Math.abs(Math.cos(TAU * 4 * a));
      break;
    case 'shifty':
      if (it.p >= it.shiftAt && !it.shifted) {
        it.st += dt;
        it.x = it.x0 + 0.08 * Math.sin(TAU * 30 * a);
        if (it.st >= 0.25) {
          const dir = it.x0 < 5 ? 1 : -1;
          it.x0 = clamp(it.x0 + dir * rand(W.rng, 1.8, 2.5), 0.7, 9.3);
          it.x = it.x0;
          it.shifted = true;
          events.emit('shift', { it });
        }
      } else it.x = it.x0;
      it.rot += it.rotV * dt;
      break;
    case 'jelly':
      it.x = it.x0;
      it.sx = 1 + 0.08 * Math.sin(TAU * 4 * a);
      it.sy = 1 - 0.08 * Math.sin(TAU * 4 * a);
      break;
    case 'bell':
      it.x = it.x0;
      it.rot = 14 * Math.sin(TAU * 1.4 * a);
      break;
    case 'psi':
      it.x = it.x0 + 0.6 * Math.sin(TAU * 0.4 * a);
      it.sx = 0.25 + 0.75 * Math.abs(Math.cos((TAU * a) / 1.2));
      break;
    default: // drop, heavy
      it.x = it.x0;
      if (m.rock) it.rot = m.rock[0] * Math.sin(TAU * m.rock[1] * a + it.phase);
      else it.rot += it.rotV * dt;
  }
};

const resolveCrossing = (it) => {
  const dx = Math.abs(it.x - input.basketX);
  const half = W.bw / 2;
  if (it.kind === BELL) {
    if (dx <= Math.max(0.40, half - 0.15) && !it.harmless) {
      if (W.invuln > 0) passThrough(it); else { it.state = DEAD; it.on = false; catchBell(it); return; }
    }
    it.state = MISS;
    return;
  }
  if (it.kind === POISON) {
    if (dx <= Math.max(0.40, half - 0.20) && !it.harmless) {
      if (W.invuln > 0) passThrough(it);
      else {
        it.state = SLURP; it.st = 0; it.bx = L.fieldLeft + it.x * L.U; it.by = L.rimY;
        catchPoison(it);
        return;
      }
    }
    it.state = MISS;
    return;
  }
  const reach = it.kind === PSI ? T.psiReach : T.goodReach;
  if (dx <= half + reach) {
    it.state = SLURP;
    it.st = 0;
    it.bx = L.fieldLeft + it.x * L.U;
    it.by = L.rimY;
    if (it.kind === PSI) catchPsi(it); else catchNormal(it);
    return;
  }
  it.state = MISS;
  if (it.kind === PSI) {
    if (it.mm) events.emit('mmMissed', { it });
    else {
      D.nextPsiAt = W.t + rand(W.rng, 18, 25);
      events.emit('psiMissed', { it });
    }
  } else {
    if (dx <= half + T.dropReach && W.clock - D.lastGood > T.busyForgive) {
      if (W.combo >= 3 && !W.mania.on) events.emit('dropped', { it });
      breakCombo('dropped', it.x);
    }
  }
};

const KIND_ORDER = [2, 1, 0, 0]; // bell first, then poison, then good
const crossing = [];

const updateItems = (dt, catching) => {
  crossing.length = 0;
  for (let i = 0; i < POOL; i += 1) {
    const it = items[i];
    if (!it.on) continue;
    if (it.state === FALL || it.state === MISS) {
      it.pPrev = it.p;
      it.p += dt / it.fall;
      moveItem(it, dt);
      if (W.mania.on && it.state === FALL && it.kind === NORMAL && it.p >= 0.45 && Math.abs(input.basketX - it.x) <= 3.5) {
        it.x0 += clamp((input.basketX - it.x) * 6, -6, 6) * dt;
      }
      if (it.state === FALL && it.pPrev < 1 && it.p >= 1) {
        if (catching) crossing.push(it);
        else it.state = MISS;
      }
      if (it.state === MISS && it.p >= L.pFloor) {
        it.state = SPLAT;
        it.st = 0;
        events.emit(it.kind === NORMAL ? 'splat' : 'fizzle', { it });
      }
    } else if (it.state === SLURP) {
      it.st += dt;
      if (it.st >= 0.09) { it.state = DEAD; it.on = false; }
    } else if (it.state === BLAST) {
      it.st += dt;
      it.bx += it.bvx * dt;
      it.by += it.bvy * dt;
      it.bvy += 10 * L.U * dt;
      it.rot += it.rotV * dt;
      if (it.st >= 0.5) { it.state = DEAD; it.on = false; }
    } else if (it.state === SPLAT) {
      it.st += dt;
      if (it.st >= 0.3) { it.state = DEAD; it.on = false; }
    }
  }
  if (crossing.length) {
    crossing.sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
    for (let i = 0; i < crossing.length && W.mode === 'playing'; i += 1) {
      const it = crossing[i];
      const wasShower = it.shower && D.shower && it.shower === D.shower.id;
      resolveCrossing(it);
      if (wasShower) {
        D.shower.resolved += 1;
        if (D.shower.resolved >= 8 && D.shower.left <= 0) {
          if (D.shower.caught >= 8) {
            W.score += T.perfectShower;
            events.emit('perfectShower', {});
          }
          D.shower = null;
        }
      }
    }
  }
};

const updateBasketWidth = (dt) => {
  if (W.bwK < 1) {
    W.bwK = Math.min(1, W.bwK + dt / 0.18);
    W.bw = W.bwFrom + (W.bwTo - W.bwFrom) * easeOutBack(W.bwK);
    setBasketHalf(Math.min(W.bw, W.bwTo) / 2);
  }
};

const updateDirector = (dt, realDt) => {
  if (W.mania.on) {
    W.mania.timer -= realDt;
    const lvl = W.mania.level;
    if (W.mania.timer > 0.6) {
      D.nextSpawn -= dt;
      if (D.nextSpawn <= 0) {
        D.nextSpawn = 1 / (lvl === 2 ? T.mmRate : T.maniaRate);
        if (liveCount(() => true) < T.itemCapMania) {
          const x = W.rng() < 0.5 ? rand(W.rng, 0.7, 9.3) : clamp(input.basketX + rand(W.rng, -3, 3), 0.7, 9.3);
          spawnNormal(x, { motion: 'drop', fall: lvl === 2 ? T.mmFall : T.maniaFall, size: rand(W.rng, 0.85, 1.25) });
        }
      }
    }
    if (lvl === 1 && !W.mania.mmRolled && W.mania.timer <= T.maniaTime - 2.0) {
      W.mania.mmRolled = true;
      const chance = W.stats.manias >= 2 && W.stats.maniaManias === 0 ? 1 : T.mmChance;
      if (W.rng() < chance) {
        const it = spawnItem(PSI_TYPE, farX(2.5), { fall: 1.9, mm: true });
        if (it) events.emit('psiSpawn', { x: it.x0, side: it.x0 < 5 ? -1 : 1, mm: true });
      }
    }
    if (W.mania.timer <= 0) endMania();
    return;
  }

  D.spawnPause -= dt;
  D.hazardFree -= dt;
  if (D.postManiaGrace > 0) D.postManiaGrace -= dt;

  // Scripted opening.
  if (!D.scriptedPoison && W.t >= 7) {
    D.scriptedPoison = true;
    spawnItem(POISON_TYPES[Math.floor(W.rng() * 3)], farX(2.5));
  }
  if (!D.scriptedBell && W.t >= 15) {
    D.scriptedBell = true;
    addTelegraph(farX(3));
  }

  // Psilocybe.
  if (W.t >= D.nextPsiAt && liveCount((o) => o.kind === PSI) === 0) {
    D.nextPsiAt = W.t + 999;
    spawnPsi();
  }

  // Showers.
  if (!D.shower && W.t >= D.nextShowerAt) {
    if (liveCount((o) => o.kind === PSI) > 0) D.nextShowerAt = W.t + 3;
    else {
      D.nextShowerAt = W.t + rand(W.rng, 18, 24);
      startShower();
    }
  }
  if (D.shower && D.shower.left > 0) {
    D.shower.timer -= dt;
    if (D.shower.timer <= 0) {
      D.shower.timer = 0.16;
      spawnItem(pickNormal(), D.shower.x, { motion: 'drop', shower: D.shower.id });
      D.shower.x += D.shower.dir * 1.1;
      D.shower.left -= 1;
      events.emit('showerSweep', {});
    }
  }

  if (D.spawnPause > 0) return;
  D.nextSpawn -= dt;
  if (D.nextSpawn <= 0) {
    D.nextSpawn = (1 / curves.rate(W.t)) * rand(W.rng, 0.6, 1.4);
    spawnRegular();
  }
};

const updateTelegraphs = (dt) => {
  for (let i = telegraphs.length - 1; i >= 0; i -= 1) {
    const tg = telegraphs[i];
    tg.age += dt;
    if (tg.age >= tg.life) {
      telegraphs.splice(i, 1);
      if (W.mode === 'playing' && !W.mania.on) spawnItem(BELL_TYPE, tg.x);
    }
  }
};

let attractTimer = 0;

export const updateWorld = (dt, realDt) => {
  updateBasketWidth(realDt);
  if (W.mode === 'title') {
    attractTimer -= dt;
    if (attractTimer <= 0) {
      attractTimer = 1 / 0.6;
      const it = spawnItem(Math.floor(Math.random() * NORMAL_COUNT), 0.7 + Math.random() * 8.6, { fall: 4, motion: 'drop' });
      if (it) it.state = MISS;
    }
    updateItems(dt, false);
    return;
  }
  if (W.mode === 'playing') {
    W.clock += dt;
    if (!W.mania.on && D.postManiaGrace <= 0) W.t += dt;
    const lvl = curves.level(W.t);
    if (lvl !== W.level) {
      W.level = lvl;
      events.emit('levelUp', { level: lvl });
    }
    if (!W.revenge && W.t >= T.revengeAt) {
      W.revenge = true;
      events.emit('revenge', {});
    }
    if (W.invuln > 0) W.invuln -= dt;
    if (!W.mania.on && W.combo > 0) {
      W.comboTimer -= dt;
      if (W.comboTimer <= 0) breakCombo('timeout', input.basketX);
    }
    updateDirector(dt, realDt);
    updateTelegraphs(dt);
    updateItems(dt, true);
    return;
  }
  // ready / dying: things keep falling, nothing is caught.
  updateItems(dt, false);
};

// ---------- debug ----------

export const debugAction = (key) => {
  if (W.mode !== 'playing') return;
  if (key === '1') spawnPsi();
  if (key === '2') addTelegraph(spacedX());
  if (key === '3') spawnItem(POISON_TYPES[0], spacedX());
  if (key === '4') W.t += 20;
  if (key === '5') startShower();
  if (key === 'f' || key === 'F') {
    for (let i = 0; i < NORMAL_COUNT - 1; i += 1) W.qty[i] = Math.max(W.qty[i], 1);
    W.qty[NORMAL_COUNT - 1] = 0;
    recount();
    events.emit('stripReset', {});
  }
  if (key === 'x' || key === 'X') {
    if (!W.mania.on) startMania(); else if (W.mania.level === 1) startManiaMania();
  }
  if (key === 'g' || key === 'G') W.god = !W.god;
};

export const directorInfo = () => ({
  fall: curves.fallTime(W.t), rate: curves.rate(W.t), pPoison: curves.pPoison(W.t), pBell: curves.pBell(W.t),
});

export const itemRotation = (it) => it.rot * DEG;
