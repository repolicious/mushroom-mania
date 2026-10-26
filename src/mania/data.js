// Sarah's 20 mushrooms, with her names and descriptions (her "psychedilic" spelling included).
// kind: 0 normal, 1 poison, 2 deadly (Funeral Bell), 3 magic (Psilocybe).
// gain: per-clip loudness match (target about -18 dBFS mean, peaks under -1 dBFS).
export const NORMAL = 0;
export const POISON = 1;
export const BELL = 2;
export const PSI = 3;

export const MUSHROOMS = [
  { key: 'Dewdrop_Dapperling', name: 'Dewdrop Dapperling', desc: 'friendly', kind: NORMAL, motion: 'drop', pts: 100, color: '#d64132', gain: 0.62 },
  { key: 'Pink_Disco', name: 'Pink Disco', desc: 'pleasant', kind: NORMAL, motion: 'drop', pts: 100, color: '#e481a6', gain: 3.51 },
  { key: 'Cinnamon_Jellybaby', name: 'Cinnamon Jellybaby', desc: 'plain', kind: NORMAL, motion: 'drop', spin: false, pts: 100, color: '#d15750', gain: 2.43 },
  { key: 'Barometer_Earthstar', name: 'Barometer Earthstar', desc: 'starry', kind: NORMAL, motion: 'heavy', spinFixed: 360, pts: 250, color: '#d76b1e', gain: 0.80 },
  { key: 'Bonfire_Cauliflower', name: 'Bonfire Cauliflower', desc: 'fiery', kind: NORMAL, motion: 'drop', pts: 100, color: '#e27f2c', gain: 0.93 },
  { key: 'Bug_Sputnik', name: 'Bug Sputnik', desc: 'sad', kind: NORMAL, motion: 'drop', pts: 100, color: '#284fbc', gain: 0.85 },
  { key: 'Hairy_Parachute', name: 'Hairy Parachute', desc: 'falling', kind: NORMAL, motion: 'float', pts: 150, color: '#607f7c', gain: 1.55 },
  { key: 'Goblet_Parachute', name: 'Goblet Parachute', desc: 'crafty', kind: NORMAL, motion: 'float', floatSpin: 25, pts: 150, color: '#d69829', gain: 0.71 },
  { key: 'Destroying_Angel', name: 'Destroying Angel', desc: 'saint', kind: NORMAL, motion: 'zigzag', pts: 150, color: '#98654a', gain: 0.56 },
  { key: 'Mint_Mildew', name: 'Mint Mildew', desc: 'lifesaver', kind: NORMAL, motion: 'drop', pts: 100, color: '#58b87b', gain: 0.62 },
  { key: 'Whiskery_Milkcap', name: 'Whiskery Milkcap', desc: 'fun', kind: NORMAL, motion: 'drop', rock: [10, 2], pts: 100, color: '#e5b15f', gain: 0.49 },
  { key: 'The_Pretender', name: 'The Pretender', desc: 'shifty', kind: NORMAL, motion: 'shifty', pts: 200, color: '#cd4d17', gain: 0.62 },
  { key: 'Chicken_of_the_Woods', name: 'Chicken of the Woods', desc: 'spooky', kind: NORMAL, motion: 'drop', pts: 100, color: '#9b132a', gain: 0.44 },
  { key: 'Pancake_Crust', name: 'Pancake Crust', desc: 'playful', kind: NORMAL, motion: 'heavy', pts: 250, color: '#d93e2b', gain: 0.88 },
  { key: 'Hairy_Nuts_Disco', name: 'Hairy Nuts Disco', desc: 'nutty', kind: NORMAL, motion: 'drop', rock: [25, 3], pts: 100, color: '#d05625', gain: 2.45 },
  { key: 'Purple_Jellydisc', name: 'Purple Jellydisc', desc: 'trippy', kind: POISON, motion: 'jelly', pts: 0, color: '#7cff4f', gain: 0.56 },
  { key: 'Witches_Butter', name: "Witches' Butter", desc: 'psychedilic', kind: POISON, motion: 'jelly', pts: 0, color: '#7cff4f', gain: 0.55 },
  { key: 'Bitter_Poisonpie', name: 'Bitter Poisonpie', desc: 'mind-expanding', kind: POISON, motion: 'jelly', pts: 0, color: '#7cff4f', gain: 0.44 },
  { key: 'Funeral_Bell', name: 'Funeral Bell', desc: 'death-dealing', kind: BELL, motion: 'bell', pts: 0, color: '#8b0d0d', gain: 2.37 },
  { key: 'Psilocybe', name: 'Psilocybe', desc: 'magic', kind: PSI, motion: 'psi', pts: 1000, color: '#ffd700', gain: 2.34 },
];

export const NORMAL_COUNT = 15;
export const MINT = 9;
export const PRETENDER = 11;
export const POISON_TYPES = [15, 16, 17];
export const BELL_TYPE = 18;
export const PSI_TYPE = 19;

export const EXTRA_GAINS = { sm64_here_we_go: 1.57, sm64_high_score: 1.91 };

export const OTHER_IMAGES = ['Mario_Party_4', 'Mario_Clap', 'Death'];
