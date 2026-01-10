(function () {
  'use strict';
  const CFG = {
    manifest: 'https://raw.loliloli.mom/imgs/bg-manifest.json',
    base: 'https://raw.loliloli.mom/imgs/',
    fallbackColor: '#6A6B6F',
    mobileQuery: '(max-width: 767px)',
    cacheKey: 'bgMixCache',
    cacheIntervalMs: 30 * 60 * 1000  // 30分钟缓存
  };

  // 获取缓存的背景图
  function getCachedBg() {
    try {
      const raw = localStorage.getItem(CFG.cacheKey);
      if (!raw) return null;

      const data = JSON.parse(raw);
      if (typeof data !== 'object' || data === null) return null;

      const { url, time, isMobile } = data;
      if (typeof url !== 'string' || !url) return null;
      if (typeof time !== 'number' || time <= 0) return null;

      // 检查是否过期
      if (Date.now() - time > CFG.cacheIntervalMs) return null;

      // 检查设备类型是否匹配（防止手机/电脑切换时用错图）
      const currentMobile = window.matchMedia(CFG.mobileQuery).matches;
      if (isMobile !== currentMobile) return null;

      return url;
    } catch (err) {
      console.warn('[bg-mix] 缓存读取异常:', err.message);
      try { localStorage.removeItem(CFG.cacheKey); } catch (_) { }
      return null;
    }
  }

  // 保存背景图到缓存
  function cacheBg(url) {
    try {
      const isMobile = window.matchMedia(CFG.mobileQuery).matches;
      localStorage.setItem(CFG.cacheKey, JSON.stringify({
        url,
        time: Date.now(),
        isMobile
      }));
    } catch (err) {
      console.warn('[bg-mix] 缓存保存失败:', err.message);
    }
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

  function applyBg(url) {
    const css = `
      html.bg {
        background: url(${JSON.stringify(url)}) center center no-repeat fixed ${CFG.fallbackColor};
        background-size: cover;
      }
      .cool-transparent .off-screen+#content {
        background: url(${JSON.stringify(url)}) center center no-repeat fixed ${CFG.fallbackColor};
        background-size: cover;
      }
    `;
    const styleTag = document.createElement('style');
    styleTag.textContent = css;
    document.head.appendChild(styleTag);
  }

  async function main() {
    // 优先使用缓存
    const cached = getCachedBg();
    if (cached) {
      applyBg(cached);
      return;
    }

    // 没有缓存，获取 manifest 并随机选择
    const list = await fetchManifest();
    if (!list.length) {
      console.warn('[bg-mix] manifest 为空，无法设置背景');
      return;
    }

    const isMobile = window.matchMedia(CFG.mobileQuery).matches;
    const filtered = list.filter(url =>
      isMobile ? url.includes('/mobile/') : url.includes('/pc/')
    );

    const pool = filtered.length ? filtered : list;
    const url = pool[Math.floor(Math.random() * pool.length)];

    // 应用并缓存
    applyBg(url);
    cacheBg(url);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main, { once: true });
  } else {
    main();
  }
})();
