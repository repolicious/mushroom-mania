// Small shared helpers: seeded RNG, maths, easing, number formatting, events, springs.

export const mulberry32 = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, k) => a + (b - a) * k;
export const easeOutCubic = (k) => 1 - (1 - k) ** 3;
export const easeOutBack = (k) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (k - 1) ** 3 + c1 * (k - 1) ** 2;
};
export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

export const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });

export class Emitter {
  constructor() { this.handlers = {}; }

  on(name, fn) { (this.handlers[name] || (this.handlers[name] = [])).push(fn); }

  emit(name, data) {
    const list = this.handlers[name];
    if (list) list.forEach((fn) => fn(data));
  }
}

// Damped spring, semi-implicit Euler.
export class Spring {
  constructor(value, k, d) {
    this.v = value; this.vel = 0; this.target = value; this.k = k; this.d = d;
  }

  step(dt) {
    this.vel += (this.k * (this.target - this.v) - this.d * this.vel) * dt;
    this.v += this.vel * dt;
  }
}

// Random helpers bound to an rng.
export const rand = (rng, lo, hi) => lo + (hi - lo) * rng();
