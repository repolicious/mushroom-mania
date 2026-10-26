import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles/index.scss';
import App from './App/App';
import mushroomData from './helpers/data/mushroomData';
import { mediaUrl, warmSounds } from './helpers/media';

// iOS Safari only applies :active (the pressed button shade) when a touch listener exists.
document.addEventListener('touchstart', () => {}, { passive: true });

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
);

// Once the page has loaded, fetch the sounds and the GAME OVER / You WIN! art in
// the background, so they're ready the moment they're needed.
// Keeping the images in an array stops the browser dropping them from its cache.
const modalArt = [];
window.addEventListener('load', () => {
  ['images/Death.webp', 'images/Mario_Clap.webp'].forEach((path) => {
    const img = new Image();
    img.src = mediaUrl(path);
    modalArt.push(img);
  });
  warmSounds([
    ...mushroomData.getMushrooms().map((mushroom) => mushroom.sound),
    mediaUrl('sounds/sm64_here_we_go.wav'),
    mediaUrl('sounds/sm64_high_score.wav'),
  ]);
});
