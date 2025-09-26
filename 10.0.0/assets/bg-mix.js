(function () {
  'use strict';
  const CFG = {
    manifest: 'https://cdn.loli-con.cn/imgs/bg-manifest.json',
    base: 'https://cdn.loli-con.cn/imgs/',
    fallbackColor: '#6A6B6F',
    mobileQuery: '(max-width: 767px)'
  };

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

    applyBg(url);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main, { once: true });
  } else {
    main();
  }
})();
