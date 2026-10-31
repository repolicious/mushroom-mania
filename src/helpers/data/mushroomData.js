import { mediaUrl, playSound } from '../media';

let basket = [];
const mushrooms = [
  {
    id: 'mushroom1',
    name: 'Psilocybe',
    description: 'magic',
    imgUrl: mediaUrl('images/Psilocybe.webp'),
    isMagic: true,
    isPoisonous: false,
    isDeadly: false,
    isNormal: false,
    sound: mediaUrl('sounds/Psilocybe.wav'),
  },
  {
    id: 'mushroom2',
    name: 'Purple Jellydisc',
    description: 'trippy',
    imgUrl: mediaUrl('images/Purple_Jellydisc.webp'),
    isMagic: false,
    isPoisonous: true,
    isDeadly: false,
    isNormal: false,
    sound: mediaUrl('sounds/Purple_Jellydisc.wav'),
  },
  {
    id: 'mushroom3',
    name: "Witches' Butter",
    description: 'psychedilic',
    // eslint-disable-next-line max-len
    imgUrl: mediaUrl('images/Witches_Butter.webp'),
    isMagic: false,
    isPoisonous: true,
    isDeadly: false,
    isNormal: false,
    sound: mediaUrl('sounds/Witches_Butter.wav'),
  },
  {
    id: 'mushroom4',
    name: 'Bitter Poisonpie',
    description: 'mind-expanding',
    imgUrl: mediaUrl('images/Bitter_Poisonpie.webp'),
    isMagic: false,
    isPoisonous: true,
    isDeadly: false,
    isNormal: false,
    sound: mediaUrl('sounds/Bitter_Poisonpie.wav'),
  },
  {
    id: 'mushroom5',
    name: 'Funeral Bell',
    description: 'death-dealing',
    imgUrl: mediaUrl('images/Funeral_Bell.webp'),
    isMagic: false,
    isPoisonous: false,
    isDeadly: true,
    isNormal: false,
    sound: mediaUrl('sounds/Funeral_Bell.wav'),
  },
  {
    id: 'mushroom6',
    name: 'Dewdrop Dapperling',
    description: 'friendly',
    imgUrl: mediaUrl('images/Dewdrop_Dapperling.webp'),
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: mediaUrl('sounds/Dewdrop_Dapperling.wav'),
  },
  {
    id: 'mushroom7',
    name: 'Pink Disco',
    description: 'pleasant',
    imgUrl: mediaUrl('images/Pink_Disco.webp'),
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: mediaUrl('sounds/Pink_Disco.wav'),
  },
  {
    id: 'mushroom8',
    name: 'Cinnamon Jellybaby',
    description: 'plain',
    imgUrl: mediaUrl('images/Cinnamon_Jellybaby.webp'),
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: mediaUrl('sounds/Cinnamon_Jellybaby.wav'),
  },
  {
    id: 'mushroom9',
    name: 'Barometer Earthstar',
    description: 'starry',
    imgUrl: mediaUrl('images/Barometer_Earthstar.webp'),
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: mediaUrl('sounds/Barometer_Earthstar.wav'),
  },
  {
    id: 'mushroom10',
    name: 'Bonfire Cauliflower',
    description: 'fiery',
    imgUrl: mediaUrl('images/Bonfire_Cauliflower.webp'),
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: mediaUrl('sounds/Bonfire_Cauliflower.wav'),
  },
  {
    id: 'mushroom11',
    name: 'Bug Sputnik',
    description: 'sad',
    imgUrl: mediaUrl('images/Bug_Sputnik.webp'),
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: mediaUrl('sounds/Bug_Sputnik.wav'),
  },
  {
    id: 'mushroom12',
    name: 'Hairy Parachute',
    description: 'falling',
    imgUrl: mediaUrl('images/Hairy_Parachute.webp'),
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: mediaUrl('sounds/Hairy_Parachute.wav'),
  },
  {
    id: 'mushroom13',
    name: 'Goblet Parachute',
    description: 'crafty',
    // eslint-disable-next-line max-len
    imgUrl: mediaUrl('images/Goblet_Parachute.webp'),
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: mediaUrl('sounds/Goblet_Parachute.wav'),
  },
  {
    id: 'mushroom14',
    name: 'Destroying Angel',
    description: 'saint',
    imgUrl: mediaUrl('images/Destroying_Angel.webp'),
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: mediaUrl('sounds/Destroying_Angel.wav'),
  },
  {
    id: 'mushroom15',
    name: 'Mint Mildew',
    description: 'lifesaver',
    imgUrl: mediaUrl('images/Mint_Mildew.webp'),
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: mediaUrl('sounds/Mint_Mildew.wav'),
  },
  {
    id: 'mushroom16',
    name: 'Whiskery Milkcap',
    description: 'fun',
    imgUrl: mediaUrl('images/Whiskery_Milkcap.webp'),
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: mediaUrl('sounds/Whiskery_Milkcap.wav'),
  },
  {
    id: 'mushroom17',
    name: 'The Pretender',
    description: 'shifty',
    imgUrl: mediaUrl('images/The_Pretender.webp'),
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: mediaUrl('sounds/The_Pretender.wav'),
  },
  {
    id: 'mushroom18',
    name: 'Chicken of the Woods',
    description: 'spooky',
    imgUrl: mediaUrl('images/Chicken_of_the_Woods.webp'),
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: mediaUrl('sounds/Chicken_of_the_Woods.wav'),
  },
  {
    id: 'mushroom19',
    name: 'Pancake Crust',
    description: 'playful',
    imgUrl: mediaUrl('images/Pancake_Crust.webp'),
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: mediaUrl('sounds/Pancake_Crust.wav'),
  },
  {
    id: 'mushroom20',
    name: 'Hairy Nuts Disco',
    description: 'nutty',
    imgUrl: mediaUrl('images/Hairy_Nuts_Disco.webp'),
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: mediaUrl('sounds/Hairy_Nuts_Disco.wav'),
  },
];
const getMushrooms = () => mushrooms;
const getBasket = () => basket;
const emptyBasket = () => {
  basket = [];
};
const getNormalMushrooms = () => {
  const normalMushrooms = [];
  const normalForestMushrooms = getMushrooms();
  normalForestMushrooms.forEach((mushroom) => {
    if (mushroom.isNormal === true) {
      normalMushrooms.push(mushroom);
    }
  });
  return normalMushrooms.length;
};
const getTotalInBasket = () => basket.reduce((total, mushroom) => total + mushroom.quantity, 0);
// The basket holds copies of the forest mushrooms, so `quantity` never ends up
// on the shared objects and emptying the basket fully resets a game.
const addToBasket = (mushroom) => {
  if (basket.some((x) => x.id === mushroom.id)) {
    basket = basket.map((x) => (x.id === mushroom.id ? { ...x, quantity: x.quantity + 1 } : x));
  } else {
    basket = [...basket, { ...mushroom, quantity: 1 }];
  }
};
const killAMushroom = () => {
  const mushroomToDie = basket[Math.floor(Math.random() * basket.length)];
  if (mushroomToDie.quantity > 1) {
    basket = basket.map((x) => (x.id === mushroomToDie.id ? { ...x, quantity: x.quantity - 1 } : x));
  } else {
    basket = basket.filter((x) => x.id !== mushroomToDie.id);
  }
};
// Two mushrooms in the basket die. With two or fewer in the basket, it empties.
const pickedPoisonousMushroom = () => {
  if (getTotalInBasket() >= 3) {
    killAMushroom();
    killAMushroom();
  } else {
    basket = [];
  }
};
const gathered = (mushroom) => {
  playSound(mushroom.sound);
  addToBasket(mushroom);
  const fullBasket = basket.length === getNormalMushrooms();
  if (fullBasket) {
    playSound(mediaUrl('sounds/sm64_high_score.wav'));
  }
  return fullBasket;
};
const pickedMagicMushroom = () => {
  mushrooms.forEach((mushroom) => {
    if (mushroom.isPoisonous === false && mushroom.isDeadly === false && mushroom.isMagic === false) {
      addToBasket(mushroom);
    }
  });
};
const pickAMushroom = () => {
  const pickedMushroom = mushrooms[Math.floor(Math.random() * mushrooms.length)];
  if (pickedMushroom.isPoisonous) {
    pickedPoisonousMushroom();
    playSound(pickedMushroom.sound);
  } else if (pickedMushroom.isDeadly) {
    playSound(pickedMushroom.sound);
    basket = [];
  } else if (pickedMushroom.isMagic) {
    pickedMagicMushroom();
    playSound(pickedMushroom.sound);
  } else {
    gathered(pickedMushroom);
  }
  return pickedMushroom;
};
export default
{
  getMushrooms,
  getBasket,
  pickAMushroom,
  getNormalMushrooms,
  gathered,
  emptyBasket,
};