// The shared public/media folder sits at the site root. Vite's relative base ('./')
// would resolve against this page's /mania/ URL, so build URLs from the script's own
// location instead: built scripts live in assets/, one level below the root.
const ROOT = import.meta.env.DEV ? '/' : new URL(/* @vite-ignore */ '../', import.meta.url).href;

const maniaMedia = (path) => `${ROOT}media/${path}`;

export default maniaMedia;
