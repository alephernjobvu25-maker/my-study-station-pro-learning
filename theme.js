/* Device-aware appearance. Auto mode follows OS theme changes without reload. */
(() => {
  const root = document.documentElement;
  const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const read = (key, fallback) => { try { return localStorage.getItem(key) || fallback; } catch (_) { return fallback; } };
  const apply = () => {
    const mode = read('mss-theme-mode', 'auto');
    const resolved = mode === 'auto' ? (media && media.matches ? 'dark' : 'light') : mode;
    root.dataset.theme = resolved;
    root.dataset.fontSize = read('mss-font-size', 'normal');
    root.dataset.contrast = read('mss-high-contrast', 'false') === 'true' ? 'high' : 'normal';
    root.dataset.reduceMotion = read('mss-reduce-motion', 'false') === 'true' ? 'true' : 'false';
  };
  apply();
  if (media) {
    const handler = () => { if (read('mss-theme-mode', 'auto') === 'auto') apply(); };
    if (media.addEventListener) media.addEventListener('change', handler);
    else if (media.addListener) media.addListener(handler);
  }
  window.MSSTheme = { apply };
})();
