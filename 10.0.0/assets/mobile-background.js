/* 移动端目录随机背景（全格式、无前缀/数量、短期缓存/每次刷新） */
(function () {
  'use strict';
  const CFG = {
    dirUrl: 'https://cdn.loli-con.cn/imgs/mobile/bg/',
    manifestUrl: 'https://cdn.loli-con.cn/imgs/mobile/bg/manifest.json',
    mediaQuery: '(max-width: 767px)',
    cacheMs: 0,
    imageExtRe: /\.(avif|webp|png|jpe?g|gif|bmp|heic|heif)$/i,
    targets: ['html.bg', '.cool-transparent .off-screen + #content'],
    fallbackColor: '#6A6B6F'
  };

  if (!(window.matchMedia && matchMedia(CFG.mediaQuery).matches)) return;

  function readCache() {
    try {
      const raw = localStorage.getItem('mobileBgAnyData');
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !obj.url || typeof obj.time !== 'number') return null;
      if (CFG.cacheMs > 0 && (Date.now() - obj.time) > CFG.cacheMs) return null;
      if (CFG.cacheMs === 0) return null;
      return obj.url;
    } catch (e) { return null; }
  }
  function writeCache(url) {
    try {
      localStorage.setItem('mobileBgAnyData', JSON.stringify({ url, time: Date.now() }));
    } catch (e) {}

  }
  async function fetchManifestList() {
    try {
      const res = await fetch(CFG.manifestUrl, { credentials: 'omit' });
      if (!res.ok) return [];
      const arr = await res.json();
      if (!Array.isArray(arr) || !arr.length) return [];
      return arr.map(x => x.startsWith('http') ? x : (CFG.dirUrl + x));
    } catch (e) { return []; }
  }
  async function fetchDirIndexList() {
    try {
      const res = await fetch(CFG.dirUrl, { credentials: 'omit' });
      if (!res.ok) return [];
      const html = await res.text();
      const urls = new Set();
      const re = /(href|src)\s*=\s*["']([^"']+)["']/ig;
      let m;
      while ((m = re.exec(html))) {
        const url = m[2];
        let full = url;
        if (!/^https?:\/\//i.test(url)) {
          full = (url.startsWith('/') ? url.slice(1) : url);
          full = CFG.dirUrl + full;
        }
        if (CFG.imageExtRe.test(full)) urls.add(full);
      }
      return Array.from(urls);
    } catch (e) { return []; }
  }
  function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function preload(url) { const img = new Image(); img.referrerPolicy = 'origin'; img.src = url; }
  function applyBg(url) {
    const bgDecl = `url(${JSON.stringify(url)}) center center no-repeat fixed ${CFG.fallbackColor};`;
    const css = `
@media ${CFG.mediaQuery}{
  ${CFG.targets.map(sel => `${sel}{background:${bgDecl}background-size:cover;}`).join('\n  ')}
}`;
    const style = document.createElement('style');
    style.setAttribute('data-mobile-any-bg', '1');
    style.textContent = css;
    document.head.appendChild(style);
  }
  async function main() {
    const cached = readCache();
    if (cached) { preload(cached); applyBg(cached); return; }
    let list = await fetchManifestList();
    if (!list.length) list = await fetchDirIndexList();
    if (!list.length) return;
    const url = pickRandom(list);
    if (CFG.cacheMs > 0) writeCache(url);
    preload(url); applyBg(url);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main, { once: true });
  } else { main(); }
})();