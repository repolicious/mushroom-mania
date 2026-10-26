// DOM HUD, overlays and local storage. DOM is written only when a value changes.
import {
  T, RANKS, TIPS, curves,
} from './config';
import { MUSHROOMS, NORMAL_COUNT, MINT } from './data';
import maniaMedia from './media';
import { fmt } from './util';

const $ = (id) => document.getElementById(id);
const STORE_KEY = 'mmm.v1';

export const store = {
  best: 0, bestCombo: 0, games: 0, maniaManias: 0, fullBaskets: 0, typeCounts: new Array(20).fill(0), muted: false,
};

export const loadStore = () => {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) {
      const v = JSON.parse(raw);
      Object.keys(store).forEach((k) => { if (v[k] !== undefined) store[k] = v[k]; });
      if (!Array.isArray(store.typeCounts) || store.typeCounts.length !== 20) store.typeCounts = new Array(20).fill(0);
    }
  } catch (e) { /* storage unavailable: keep it in memory */ }
};

export const saveStore = () => {
  try { window.localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* in memory only */ }
};

export const rankFor = (score) => RANKS.find(([min]) => score >= min)[1];

const animate = (el, frames, ms) => {
  if (el && el.animate) {
    try { el.animate(frames, { duration: ms, easing: 'ease-out' }); } catch (e) { /* ignore */ }
  }
};

const els = {};
const state = {
  shown: 0, score: -1, lives: -1, sub: '', count: '', comboKey: '', maniaKey: '', lastPunch: 0, sweeping: false, stripQty: new Array(NORMAL_COUNT).fill(-1),
};

export const initUi = () => {
  ['score', 'sub', 'lives', 'strip-icons', 'strip-count', 'combo', 'combo-text', 'combo-fill', 'maniabar', 'mania-label', 'mania-fill',
    'btn-go', 'title-best', 'hud', 'ready', 'ready-text', 'pause', 'pause-msg', 'pause-score', 'btn-sound', 'over', 'over-title',
    'over-score', 'over-line', 'over-rank', 'over-stats', 'over-tip', 'over-bowser', 'over-clap', 'rotate', 'title', 'btn-mute', 'debug']
    .forEach((id) => { els[id] = $(id); });
  document.querySelectorAll('img[data-img]').forEach((img) => { img.src = maniaMedia(`images/${img.dataset.img}.webp`); });
  els['over-bowser'].src = maniaMedia('images/Death.webp');
  els['over-clap'].style.backgroundImage = `url(${maniaMedia('images/Mario_Clap.webp')})`;
  $('rotate-img').src = maniaMedia('images/Mario_Party_4.webp');
  els.icons = MUSHROOMS.slice(0, NORMAL_COUNT).map((m) => {
    const img = document.createElement('img');
    img.src = maniaMedia(`images/${m.key}.webp`);
    img.alt = m.name;
    img.draggable = false;
    els['strip-icons'].appendChild(img);
    return img;
  });
  const mintSrc = maniaMedia(`images/${MUSHROOMS[MINT].key}.webp`);
  els.lifeIcons = Array.from({ length: T.maxLives }, () => {
    const img = document.createElement('img');
    img.src = mintSrc;
    img.alt = '';
    img.draggable = false;
    els.lives.appendChild(img);
    return img;
  });
};

// ---------- screens ----------

export const show = (id, on) => {
  const el = els[id] || $(id);
  if (el) el.classList.toggle('hidden', !on);
};

export const setLoading = (n, total) => {
  const b = els['btn-go'];
  if (n < total) { b.disabled = true; b.textContent = `Picking mushrooms... ${n}/${total}`; } else { b.disabled = false; b.textContent = 'HERE WE GO!'; }
};

export const updateTitleBest = () => {
  const el = els['title-best'];
  el.classList.toggle('hidden', !store.best);
  if (store.best) el.textContent = `BEST ${fmt(store.best)} | ${rankFor(store.best)}`;
};

export const setSoundLabels = () => {
  els['btn-sound'].textContent = store.muted ? 'SOUND: OFF' : 'SOUND: ON';
  els['btn-mute'].innerHTML = store.muted ? '&#xf6a9;' : '&#xf028;';
  els['btn-mute'].setAttribute('aria-label', store.muted ? 'Unmute' : 'Mute');
};

export const readyText = (text, slam) => {
  const el = els['ready-text'];
  el.textContent = text;
  if (slam) animate(el, [{ transform: 'scale(3)', opacity: 0.2 }, { transform: 'scale(1)', opacity: 1 }], 300);
};

export const showPause = (msg, score) => {
  els['pause-msg'].textContent = msg;
  els['pause-score'].textContent = fmt(score);
  show('pause', true);
};

// ---------- HUD ----------

export const resetHud = (lives) => {
  state.shown = 0;
  state.score = -1;
  state.lives = -1;
  state.stripQty.fill(-1);
  state.sweeping = false;
  els.lifeIcons.forEach((img) => img.classList.remove('lost'));
  setLives(lives);
};

export function setLives(n) {
  if (n === state.lives) return;
  const prev = state.lives;
  els.lifeIcons.forEach((img, i) => {
    img.style.display = i < n || (prev > n && i < prev) ? '' : 'none';
    if (prev > n && i >= n && i < prev) {
      img.classList.add('lost');
      setTimeout(() => { img.classList.remove('lost'); img.style.display = 'none'; }, 600);
    } else if (i < n && i >= prev && prev >= 0) {
      animate(img, [{ transform: 'scale(2)' }, { transform: 'scale(1)' }], 300);
    }
  });
  state.lives = n;
}

export const syncStrip = (qty, types) => {
  if (state.sweeping) return;
  for (let i = 0; i < NORMAL_COUNT; i += 1) {
    const has = qty[i] > 0 ? 1 : 0;
    if (state.stripQty[i] !== has) {
      els.icons[i].classList.toggle('got', !!has);
      state.stripQty[i] = has;
    }
  }
  const c = `${types}/15`;
  if (c !== state.count) { els['strip-count'].textContent = c; state.count = c; }
};

export const stripNew = (type) => animate(els.icons[type], [{ transform: 'scale(1.6)' }, { transform: 'scale(1)' }], 200);

export const stripKilled = (types) => {
  types.forEach((t) => animate(els.icons[t], [{ transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], 300));
  animate(els['strip-count'], [{ color: '#ff2a2a', transform: 'scale(1.4)' }, { color: '#fff', transform: 'scale(1)' }], 400);
};

// Light every icon in turn, then clear (FULL BASKET and the MANIA fill).
export const stripSweep = (stepMs, onStep, onDone) => {
  state.sweeping = true;
  els.icons.forEach((img, i) => {
    setTimeout(() => {
      img.classList.add('got');
      animate(img, [{ transform: 'scale(1.6)' }, { transform: 'scale(1)' }], 160);
      if (onStep) onStep(i);
    }, i * stepMs);
  });
  setTimeout(() => {
    state.sweeping = false;
    state.stripQty.fill(-1);
    if (onDone) onDone();
  }, NORMAL_COUNT * stepMs + 250);
};

export const flushHud = (dt, W, best) => {
  if (W.score !== state.score) {
    if (W.score > state.score && state.score >= 0) {
      const now = performance.now();
      if (now - state.lastPunch > 120) {
        state.lastPunch = now;
        animate(els.score, [{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], 160);
      }
    }
    state.score = W.score;
  }
  if (state.shown !== W.score) {
    state.shown += (W.score - state.shown) * (1 - Math.exp(-12 * dt));
    if (Math.abs(W.score - state.shown) < 1) state.shown = W.score;
    els.score.textContent = fmt(state.shown);
  }
  const sub = `BEST ${fmt(Math.max(best, W.score))} | LV ${W.level}`;
  if (sub !== state.sub) { els.sub.textContent = sub; state.sub = sub; }
  setLives(W.lives);
  syncStrip(W.qty, W.types);
  if (W.mania.on !== state.mania) { state.mania = W.mania.on; els.hud.classList.toggle('mania', W.mania.on); }

  // Combo row, or the MANIA bar while MANIA is on.
  if (W.mania.on) {
    const label = W.mania.level === 2 ? 'MUSHROOM MANIA MANIA!! x10' : 'MUSHROOM MANIA! x5';
    const total = W.mania.level === 2 ? T.mmTime : T.maniaTime;
    const frac = Math.max(0, W.mania.timer / total);
    const key = `${label}|${Math.round(frac * 200)}|${W.mania.timer < 1.5}`;
    if (key !== state.maniaKey) {
      state.maniaKey = key;
      els['mania-label'].textContent = label;
      els['mania-fill'].style.transform = `scaleX(${frac.toFixed(3)})`;
      els.maniabar.classList.toggle('blink', W.mania.timer < 1.5);
    }
    els.maniabar.classList.remove('hidden');
    els.combo.classList.add('hidden');
  } else {
    els.maniabar.classList.add('hidden');
    state.maniaKey = '';
    const showCombo = W.combo >= 3 && W.mode === 'playing';
    els.combo.classList.toggle('hidden', !showCombo);
    if (showCombo) {
      const tier = W.tierMult;
      const color = tier >= 8 ? T.tierColors[Math.floor(performance.now() / 120) % 7] : T.tierColors[tier - 1];
      const key = `${W.combo}|${tier}|${color}`;
      if (key !== state.comboKey) {
        state.comboKey = key;
        els['combo-text'].textContent = `${W.combo} COMBO x${tier}`;
        els['combo-text'].style.color = color;
      }
      const frac = Math.max(0, Math.min(1, W.comboTimer / curves.comboWindow(W.t)));
      els['combo-fill'].style.transform = `scaleX(${frac.toFixed(3)})`;
    }
  }
};

// ---------- game over ----------

export const showOver = (o, onLetter, onCount, done) => {
  const title = els['over-title'];
  title.innerHTML = '';
  'GAME OVER'.split('').forEach((ch, i) => {
    const s = document.createElement('span');
    s.textContent = ch === ' ' ? ' ' : ch;
    s.style.animationDelay = `${i * 60}ms`;
    title.appendChild(s);
    if (ch !== ' ') setTimeout(() => onLetter(i), i * 60);
  });
  els['over-bowser'].classList.toggle('hidden', o.newBest);
  els['over-clap'].classList.toggle('hidden', !o.newBest);
  if (o.newBest) els['over-line'].textContent = 'NEW HIGH SCORE!';
  else if (o.prevBest > 0 && o.score >= o.prevBest * 0.75) els['over-line'].textContent = `Only ${fmt(o.prevBest - o.score)} to beat your best!`;
  else els['over-line'].textContent = `BEST ${fmt(o.prevBest)}`;
  els['over-rank'].textContent = rankFor(o.score);
  const s = o.stats;
  els['over-stats'].textContent = `Mushrooms caught ${s.caught} | Best combo ${s.bestCombo} | Full baskets ${s.fullBaskets} | Manias ${s.manias} | MANIA MANIA ${s.maniaManias} | LV ${o.level}`;
  els['over-tip'].textContent = TIPS[o.games % TIPS.length];
  show('over', true);
  const start = performance.now();
  const scoreEl = els['over-score'];
  let lastTick = 0;
  const step = () => {
    const k = Math.min(1, (performance.now() - start) / 1200);
    scoreEl.textContent = fmt(o.score * (1 - (1 - k) ** 2));
    if (k - lastTick > 0.04 && k < 1) { lastTick = k; onCount(k); }
    if (k < 1) requestAnimationFrame(step); else if (done) done();
  };
  requestAnimationFrame(step);
};

export const debugText = (text) => {
  if (els.debug) els.debug.textContent = text;
};
