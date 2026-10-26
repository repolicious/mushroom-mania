// Touch: relative drag anywhere. Mouse: absolute. Keyboard: velocity with accel/decel.
// basketX (U) is the single source of truth; the last input used wins.
import { T } from './config';
import { L } from './layout';
import { clamp } from './util';

export const input = {
  basketX: 5,
  halfW: 1.35,
  enabled: false,
  vx: 0,
  lean: 0,
  keyV: 0,
  left: false,
  right: false,
  usingMouse: false,
  pointerId: null,
  lastX: 0,
  xPrev: 5,
  onDust: null,
  dustCooldown: 0,
  lastSign: 0,
};

const clampX = () => {
  input.basketX = clamp(input.basketX, input.halfW, 10 - input.halfW);
};

const isUi = (e) => e.target && e.target.closest && e.target.closest('button, a');

export const initInput = (handlers) => {
  window.addEventListener('pointerdown', (e) => {
    if (isUi(e)) return;
    handlers.anyGesture();
    if (!input.enabled) return;
    if (e.pointerType === 'mouse') {
      input.usingMouse = true;
      input.basketX = (e.clientX - L.fieldLeft) / L.U;
      clampX();
      return;
    }
    if (input.pointerId === null) {
      input.pointerId = e.pointerId;
      input.lastX = e.clientX;
    }
  });
  window.addEventListener('pointermove', (e) => {
    if (!input.enabled) return;
    if (e.pointerType === 'mouse') {
      input.usingMouse = true;
      input.basketX = (e.clientX - L.fieldLeft) / L.U;
      clampX();
      return;
    }
    if (e.pointerId !== input.pointerId) return;
    input.basketX += ((e.clientX - input.lastX) * T.touchGain) / L.U;
    input.lastX = e.clientX;
    clampX();
  }, { passive: true });
  const release = (e) => {
    if (e.pointerId === input.pointerId) input.pointerId = null;
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);

  window.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'ArrowRight' || k === ' ' || k === 'ArrowUp' || k === 'ArrowDown') e.preventDefault();
    handlers.anyGesture();
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') input.left = true;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') input.right = true;
    else if (k === 'p' || k === 'P' || k === 'Escape') handlers.pauseKey();
    else if (k === 'm' || k === 'M') handlers.muteKey();
    else if (k === 'Enter' || k === ' ') handlers.confirmKey(e);
    else handlers.otherKey(e);
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') input.left = false;
    if (k === 'ArrowRight' || k === 'd' || k === 'D') input.right = false;
  });
  window.addEventListener('blur', () => { input.left = false; input.right = false; input.pointerId = null; });
};

export const updateInput = (dt) => {
  if (input.enabled && (input.left || input.right)) {
    const target = input.left === input.right ? 0 : (input.right ? T.keyMax : -T.keyMax);
    const reversing = Math.sign(target) !== Math.sign(input.keyV) && input.keyV !== 0;
    const a = target === 0 || reversing ? T.keyDecel : T.keyAccel;
    const diff = target - input.keyV;
    input.keyV += clamp(diff, -a * dt, a * dt);
  } else {
    const diff = -input.keyV;
    input.keyV += clamp(diff, -T.keyDecel * dt, T.keyDecel * dt);
  }
  if (input.keyV !== 0 && input.enabled) {
    input.basketX += input.keyV * dt;
    clampX();
  }

  // Cosmetic feel: smoothed velocity, lean and reversal dust.
  if (dt > 0) {
    const raw = (input.basketX - input.xPrev) / dt;
    input.vx += (raw - input.vx) * (1 - Math.exp(-20 * dt));
    const targetLean = clamp(input.vx / 15, -1, 1) * 8;
    input.lean += (targetLean - input.lean) * (1 - Math.exp(-12 * dt));
    input.dustCooldown -= dt;
    const sign = Math.sign(input.vx);
    if (Math.abs(input.vx) > 6 && sign !== 0 && sign !== input.lastSign && input.lastSign !== 0 && input.dustCooldown <= 0) {
      input.dustCooldown = 0.15;
      if (input.onDust) input.onDust();
    }
    if (Math.abs(input.vx) > 6) input.lastSign = sign;
  }
  input.xPrev = input.basketX;
};

export const setBasketHalf = (half) => {
  input.halfW = half;
  clampX();
};
