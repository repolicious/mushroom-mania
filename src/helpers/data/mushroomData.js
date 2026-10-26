let basket = [];
const mushrooms = [
  {
    id: 'mushroom1',
    name: 'Psilocybe',
    description: 'magic',
    imgUrl: 'media/images/Psilocybe.png',
    isMagic: true,
    isPoisonous: false,
    isDeadly: false,
    isNormal: false,
    sound: 'media/sounds/Psilocybe.wav',
  },
  {
    id: 'mushroom2',
    name: 'Purple Jellydisc',
    description: 'trippy',
    imgUrl: 'media/images/Purple_Jellydisc.png',
    isMagic: false,
    isPoisonous: true,
    isDeadly: false,
    isNormal: false,
    sound: 'media/sounds/Purple_Jellydisc.wav',
  },
  {
    id: 'mushroom3',
    name: "Witches' Butter",
    description: 'psychedilic',
    // eslint-disable-next-line max-len
    imgUrl: 'media/images/Witches_Butter.png',
    isMagic: false,
    isPoisonous: true,
    isDeadly: false,
    isNormal: false,
    sound: 'media/sounds/Witches_Butter.wav',
  },
  {
    id: 'mushroom4',
    name: 'Bitter Poisonpie',
    description: 'mind-expanding',
    imgUrl: 'media/images/Bitter_Poisonpie.png',
    isMagic: false,
    isPoisonous: true,
    isDeadly: false,
    isNormal: false,
    sound: 'media/sounds/Bitter_Poisonpie.wav',
  },
  {
    id: 'mushroom5',
    name: 'Funeral Bell',
    description: 'death-dealing',
    imgUrl: 'media/images/Funeral_Bell.png',
    isMagic: false,
    isPoisonous: false,
    isDeadly: true,
    isNormal: false,
    sound: 'media/sounds/Funeral_Bell.wav',
  },
  {
    id: 'mushroom6',
    name: 'Dewdrop Dapperling',
    description: 'friendly',
    imgUrl: 'media/images/Dewdrop_Dapperling.png',
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: 'media/sounds/Dewdrop_Dapperling.wav',
  },
  {
    id: 'mushroom7',
    name: 'Pink Disco',
    description: 'pleasant',
    imgUrl: 'media/images/Pink_Disco.png',
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: 'media/sounds/Pink_Disco.wav',
  },
  {
    id: 'mushroom8',
    name: 'Cinnamon Jellybaby',
    description: 'plain',
    imgUrl: 'media/images/Cinnamon_Jellybaby.png',
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: 'media/sounds/Cinnamon_Jellybaby.wav',
  },
  {
    id: 'mushroom9',
    name: 'Barometer Earthstar',
    description: 'starry',
    imgUrl: 'media/images/Barometer_Earthstar.png',
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: 'media/sounds/Barometer_Earthstar.wav',
  },
  {
    id: 'mushroom10',
    name: 'Bonfire Cauliflower',
    description: 'fiery',
    imgUrl: 'media/images/Bonfire_Cauliflower.png',
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: 'media/sounds/Bonfire_Cauliflower.wav',
  },
  {
    id: 'mushroom11',
    name: 'Bug Sputnik',
    description: 'sad',
    imgUrl: 'media/images/Bug_Sputnik.png',
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: 'media/sounds/Bug_Sputnik.wav',
  },
  {
    id: 'mushroom12',
    name: 'Hairy Parachute',
    description: 'falling',
    imgUrl: 'media/images/Hairy_Parachute.png',
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: 'media/sounds/Hairy_Parachute.wav',
  },
  {
    id: 'mushroom13',
    name: 'Goblet Parachute',
    description: 'crafty',
    // eslint-disable-next-line max-len
    imgUrl: 'media/images/Goblet_Parachute.png',
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: 'media/sounds/Goblet_Parachute.wav',
  },
  {
    id: 'mushroom14',
    name: 'Destroying Angel',
    description: 'saint',
    imgUrl: 'media/images/Destroying_Angel.png',
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: 'media/sounds/Destroying_Angel.wav',
  },
  {
    id: 'mushroom15',
    name: 'Mint Mildew',
    description: 'lifesaver',
    imgUrl: 'media/images/Mint_Mildew.png',
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: 'media/sounds/Mint_Mildew.wav',
  },
  {
    id: 'mushroom16',
    name: 'Whiskery Milkcap',
    description: 'fun',
    imgUrl: 'media/images/Whiskery_Milkcap.png',
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: 'media/sounds/Whiskery_Milkcap.wav',
  },
  {
    id: 'mushroom17',
    name: 'The Pretender',
    description: 'shifty',
    imgUrl: 'media/images/The_Pretender.png',
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: 'media/sounds/The_Pretender.wav',
  },
  {
    id: 'mushroom18',
    name: 'Chicken of the Woods',
    description: 'spooky',
    imgUrl: 'media/images/Chicken_of_the_Woods.png',
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: 'media/sounds/Chicken_of_the_Woods.wav',
  },
  {
    id: 'mushroom19',
    name: 'Pancake Crust',
    description: 'playful',
    imgUrl: 'media/images/Pancake_Crust.png',
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: 'media/sounds/Pancake_Crust.wav',
  },
  {
    id: 'mushroom20',
    name: 'Hairy Nuts Disco',
    description: 'nutty',
    imgUrl: 'media/images/Hairy_Nuts_Disco.png',
    isMagic: false,
    isPoisonous: false,
    isDeadly: false,
    isNormal: true,
    sound: 'media/sounds/Hairy_Nuts_Disco.wav',
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
const pickedPoisonousMushroom = (passedInTotal) => {
  const total = passedInTotal;
  if (total >= 3) {
    const mushroomToDie1 = basket[Math.floor(Math.random() * basket.length)];
    const mushroomToDieIndex1 = basket.indexOf(mushroomToDie1);
    if (mushroomToDie1.quantity > 1) {
      mushroomToDie1.quantity -= 1;
      const mushroomToDie2 = basket[Math.floor(Math.random() * basket.length)];
      const mushroomToDieIndex2 = basket.indexOf(mushroomToDie2);
      if (mushroomToDie2.quantity > 1) {
        mushroomToDie2.quantity -= 1;
      } else {
        basket.splice(mushroomToDieIndex2, 1);
      }
    } else {
      basket.splice(mushroomToDieIndex1, 1);
      const mushroomToDie2 = basket[Math.floor(Math.random() * basket.length)];
      const mushroomToDieIndex2 = basket.indexOf(mushroomToDie2);
      if (mushroomToDie2.quantity > 1) {
        mushroomToDie2.quantity -= 1;
      } else {
        basket.splice(mushroomToDieIndex2, 1);
      }
    }
  } else {
    basket = [];
  }
};
const gathered = (mushroom) => {
  new Audio(mushroom.sound).play();
  const selectedMushroom = mushroom;
  const totalNormalMushrooms = getNormalMushrooms();
  let fullBasket = false;
  const findSelected = basket.findIndex((x) => x.id === selectedMushroom.id);
  if (findSelected >= 0) {
    basket[findSelected].quantity += 1;
  } else {
    selectedMushroom.quantity = 1;
    basket.push(selectedMushroom);
  }
  if (basket.length === totalNormalMushrooms) {
    fullBasket = true;
    new Audio('media/sounds/sm64_high_score.wav').play();
  }
  return fullBasket;
};
const pickedMagicMushroom = () => {
  mushrooms.forEach((mushroom) => {
    if (mushroom.isPoisonous === false && mushroom.isDeadly === false && mushroom.isMagic === false) {
      const findSelected = basket.findIndex((x) => x.id === mushroom.id);
      if (findSelected >= 0) {
        basket[findSelected].quantity += 1;
      } else {
        const newMush = mushroom;
        newMush.quantity = 1;
        basket.push(mushroom);
      }
    }
  });
};
const pickAMushroom = () => {
  const forestMushrooms = mushrooms.length;
  const totalInBasket = basket.length;
  const pickedMushroom = mushrooms[Math.floor(Math.random() * forestMushrooms)];
  if (pickedMushroom.isPoisonous) {
    pickedPoisonousMushroom(totalInBasket);
    new Audio(pickedMushroom.sound).play();
  } else if (pickedMushroom.isDeadly) {
    new Audio(pickedMushroom.sound).play();
    basket = [];
  } else if (pickedMushroom.isMagic) {
    pickedMagicMushroom();
    new Audio(pickedMushroom.sound).play();
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