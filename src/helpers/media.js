// Media files live in public/media. Prefixing BASE_URL keeps the paths working
// whether the site is served from a domain root or from a subpath.
const mediaUrl = (path) => `${import.meta.env.BASE_URL}media/${path}`;

// play() rejects when the browser blocks audio or the file can't load.
// A missed sound should never break the game, so swallow the rejection.
const playSound = (url) => {
  const played = new Audio(url).play();
  if (played) {
    played.catch(() => {});
  }
};

export { mediaUrl, playSound };
