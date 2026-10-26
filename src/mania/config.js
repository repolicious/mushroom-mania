// Every tunable number in one place. World units: U = field width / 10.
export const T = {
  // Input
  touchGain: 1.3,
  keyMax: 13,
  keyAccel: 110,
  keyDecel: 160,

  // Mario and the basket (U)
  marioH: 2.8,
  marioAnchor: { x: 0.75, y: 0.04 }, // the raised hand, as a fraction of Mario's sprite
  basketW: [2.7, 2.3, 1.95, 1.65], // by notch 0-3
  basketWMania: 3.8,
  basketWMM: 4.3,
  basketH: 0.8,

  // Item sizes: longest side in U
  sizes: [1.35, 1.35, 1.45, 1.7], // normal, poison, bell, psi
  mini: 0.6,
  confetti: 0.5,

  // Catch windows (U beyond half the basket width)
  goodReach: 0.40,
  psiReach: 0.55,
  dropReach: 1.5,

  // Scoring and combo
  tiers: [0, 3, 7, 12, 18, 25, 33, 42],
  tierNames: ['', 'Nice!', 'Wahoo!', 'Mamma mia!', "Let's-a go!", 'Super Mushroom!', 'So MANY mushrooms!', 'MAXIMUM MUSHROOM!'],
  tierColors: ['#ffffff', '#ffe14d', '#ffa62b', '#ff5a36', '#ff2fa0', '#b44dff', '#3dd6ff', '#ffffff'],
  newBonus: 250,
  fullBasket: 10000,
  revengeBonus: 5000,
  perfectShower: 5000,
  busyForgive: 0.30,

  // Lives
  lives: 3,
  maxLives: 5,
  invuln: 1.5,
  revengeAt: 300,

  // Director
  telegraph: 0.6,
  itemCap: 40,
  itemCapMania: 70,
  bellCap: 3,
  poisonCap: 4,
  goAt: 2.30, // "GO!" in sm64_here_we_go.wav
  againOffset: 1.85,

  // MANIA
  maniaTime: 6.5,
  mmTime: 5.7,
  mmChance: 0.4,
  maniaRate: 7,
  maniaFall: 1.6,
  mmRate: 10,
  mmFall: 1.3,
  postManiaGrace: 2.0,
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const parts = (t) => [Math.min(t / 150, 1), clamp01((t - 150) / 150), Math.max(0, t - 300) / 60];

export const curves = {
  fallTime(t) {
    const [d, o, r] = parts(t);
    return Math.max(0.80, 3.2 - 1.9 * d - 0.25 * o - 0.08 * r);
  },
  rate(t) {
    if (t < 6) return 0.8;
    const [d, o, r] = parts(t);
    return Math.min(4.2, 0.9 + 2.4 * d + 0.6 * o + 0.1 * r);
  },
  pPoison(t) {
    if (t < 7) return 0;
    const [d, o, r] = parts(t);
    return Math.min(0.28, 0.10 + 0.13 * d + 0.03 * o + 0.02 * r);
  },
  pBell(t) {
    if (t < 15) return 0;
    const [d, o, r] = parts(t);
    return Math.min(0.20, 0.05 + 0.10 * d + 0.03 * o + 0.02 * r);
  },
  aimBell(t) {
    return 0.30 + 0.40 * Math.min(t / 150, 1);
  },
  aimPoison(t) {
    return 0.20 * Math.min(t / 150, 1);
  },
  comboWindow(t) {
    return 2.6 - 1.0 * Math.min(t / 150, 1);
  },
  level(t) {
    return 1 + Math.floor(t / 20);
  },
};

export const LEVEL_BANNERS = [
  '', '',
  "It's raining 'shrooms!",
  'Heavier rain!',
  'Pick a mushroom if you dare',
  'Bowser is getting angry...',
  'Mushroom monsoon!',
  'MANIA-CAL!',
  'Is this even possible?!',
];

export const RANKS = [
  [3000000, 'MUSHROOM MANIA MANIA'],
  [1500000, 'MUSHROOM MANIAC'],
  [750000, "Toad's Best Friend"],
  [300000, 'Fungi Fanatic'],
  [100000, 'Basket Case'],
  [25000, 'Forest Forager'],
  [0, 'Mushroom Picker'],
];

export const TIPS = [
  'Tip: Bowser blinks at the top before every Funeral Bell.',
  'Tip: catch a Psilocybe during MANIA for MANIA MANIA.',
  'Tip: Mint Mildew is a lifesaver - it fixes a shrunken basket.',
  'Tip: a full basket gives you an extra life.',
  "Tip: misses far from Mario don't break your combo.",
  'Tip: nothing breaks your combo during MANIA.',
];
