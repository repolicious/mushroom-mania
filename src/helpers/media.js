// Media files live in public/media at the site root. This page is served from
// /classic/, so resolve from the script's own location (built scripts live in
// assets/, one level below the root) rather than the page. The dev server serves
// the root at /. Works at a domain root or under any subpath.
const ROOT = import.meta.env.DEV ? '/' : new URL(/* @vite-ignore */ '../', import.meta.url).href;
const mediaUrl = (path) => `${ROOT}media/${path}`;

// Sounds fetched ahead of time, as blob: URLs keyed by their media URL. Playing
// from memory means a tap's sound starts at once instead of after a download.
const warmed = new Map();
// WebKit 15.4 and 15.4.1 cut blob: audio over 64 KB short without an error event
// (fixed in Safari 15.5), so those versions play the plain files.
let warmedSoundsPlay = !/OS 15_4(_\d+)? like Mac OS X|Version\/15\.4(\.\d+)? /.test(navigator.userAgent);

// Three downloads at a time, so a sound tapped during warm-up isn't stuck
// behind all of them on a slow connection.
const warmSounds = (urls) => {
  const queue = urls.filter((url) => !warmed.has(url));
  const next = () => {
    const url = queue.shift();
    if (!url) {
      return;
    }
    fetch(url)
      .then((response) => (response.ok ? response.blob() : Promise.reject()))
      .then((blob) => warmed.set(url, URL.createObjectURL(new Blob([blob], { type: 'audio/wav' }))))
      .catch(() => {})
      .then(next);
  };
  [1, 2, 3].forEach(next);
};

// play() rejects when the browser blocks audio or the file can't load.
// A missed sound should never break the game, so swallow the rejection.
const playSound = (url) => {
  const warmedUrl = warmedSoundsPlay && warmed.get(url);
  const audio = new Audio(warmedUrl || url);
  if (warmedUrl) {
    // If this browser can't play a warmed sound, go back to the plain files.
    audio.addEventListener('error', () => { warmedSoundsPlay = false; }, { once: true });
  }
  const played = audio.play();
  if (played) {
    played.catch(() => {});
  }
};

export { mediaUrl, playSound, warmSounds };
