(function () {
  'use strict';
  const CFG = {
    manifest: 'https://cdn.loli-con.cn/imgs/bg-manifest.json',
    base: 'https://cdn.loli-con.cn/imgs/',
    cacheMs: 3 * 60 * 1000, // 3分钟
    fallbackColor: '#6A6B6F',
    fadeMs: 400,
    mobileQuery: '(max-width: 767px)'
  };

  function readCache() {
    try {
      const raw = localStorage.getItem('bgMixData');
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !obj.url || Date.now() - obj.time > CFG.cacheMs) return null;
      return obj.url;
    } catch { return null; }
  }
  function writeCache(url) {
    try {
      localStorage.setItem('bgMixData', JSON.stringify({ url, time: Date.now() }));
    } catch {}
  }

  async function fetchManifest() {
    try {
      const res = await fetch(CFG.manifest);
      if (!res.ok) return [];
      const arr = await res.json();
      if (!Array.isArray(arr)) return [];
      return arr.map(x => x.startsWith('http') ? x : CFG.base + x);
    } catch {
      console.warn('[bg-mix] manifest 加载失败');
      return [];
    }
  }

  function preload(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.referrerPolicy = 'strict-origin-when-cross-origin';
      img.onload = () => resolve(url);
      img.onerror = reject;
      img.src = url;
    });
  }

  function applyBg(url) {
    // 清理已有层，避免叠加
    document.querySelectorAll('[data-bg-mix-layer]').forEach(el => el.remove());

    const layer = document.createElement('div');
    layer.setAttribute('data-bg-mix-layer', '1');
    layer.style.cssText = `
      position:fixed;inset:0;z-index:-1;pointer-events:none;
      background:url(${JSON.stringify(url)}) center center no-repeat fixed ${CFG.fallbackColor};
      background-size:cover;opacity:0;
      transition:opacity ${CFG.fadeMs}ms ease;
    `;
    document.body.appendChild(layer);
    requestAnimationFrame(() => { layer.style.opacity = '1'; });
  }

  async function main() {
    const cached = readCache();
    if (cached) { applyBg(cached); return; }

    const list = await fetchManifest();
    if (!list.length) {
      console.warn('[bg-mix] manifest 为空，无法设置背景');
      return;
    }

    const isMobile = window.matchMedia(CFG.mobileQuery).matches;
    const filtered = list.filter(url => 
      isMobile ? url.includes('/mobile/') : url.includes('/pc/')
    );

    if (!filtered.length) {
      console.warn('[bg-mix] 没有匹配当前设备的背景，使用所有图片随机');
    }

    const pool = filtered.length ? filtered : list;
    let url = pool[Math.floor(Math.random() * pool.length)];

    try {
      await preload(url);
    } catch (e) {
      console.warn('[bg-mix] 加载失败，尝试用第一张:', e);
      url = pool[0];
    }
    applyBg(url);
    writeCache(url);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main, { once: true });
  } else {
    main();
  }
})();
