(function () {
  'use strict';

  const CFG = {
    cacheKey: "videoEnabledState",       // localStorage 键名
    cacheMs: 3 * 60 * 60 * 1000,         // 缓存时长，默认 3 小时
    bottom: 180,                         // 距离底部 px
    right: 20                            // 距离右边 px
  };

  function initToggle() {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) return;

    const video = document.getElementById("DynamicWallpaper");
    if (!video) return;

    // 读取缓存
    function readCache() {
      try {
        const raw = localStorage.getItem(CFG.cacheKey);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        if (Date.now() - obj.time > CFG.cacheMs) return null; // 过期
        return obj.enabled;
      } catch {
        return null;
      }
    }

    // 写缓存
    function writeCache(enabled) {
      try {
        localStorage.setItem(CFG.cacheKey, JSON.stringify({
          enabled,
          time: Date.now()
        }));
      } catch { }
    }

    // 初始状态
    let videoEnabled = readCache();
    if (videoEnabled === null) videoEnabled = true;

    // 创建按钮
    const toggleBtn = document.createElement("button");
    toggleBtn.style.cssText = `
      position: fixed;
      bottom: ${CFG.bottom}px;
      right: ${CFG.right}px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.12);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 50%;
      cursor: pointer;
      z-index: 10000;
      font-size: 18px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      opacity: 0.35;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    document.body.appendChild(toggleBtn);

    // SVG 图标（Feather Icons 风格）
    const SVG_PLAY = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    const SVG_PAUSE = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;

    // 更新按钮 & 视频
    function updateButton() {
      if (videoEnabled) {
        delete video.dataset.userDisabled;  // 移除手动关闭标记
        video.preload = "auto";             // 恢复预加载
        video.style.display = "block";
        video.play();
        toggleBtn.innerHTML = SVG_PLAY;
        toggleBtn.title = "关闭视频背景";
      } else {
        video.pause();
        video.dataset.userDisabled = "true"; // 标记用户手动关闭
        video.preload = "none";              // 停止后台加载
        video.style.display = "none";
        toggleBtn.innerHTML = SVG_PAUSE;
        toggleBtn.title = "恢复视频背景";
      }
    }
    updateButton();

    // 悬停时显示
    toggleBtn.addEventListener("mouseenter", () => {
      toggleBtn.style.opacity = "1";
      toggleBtn.style.background = "rgba(255,255,255,0.25)";
      toggleBtn.style.transform = "scale(1.1)";
      toggleBtn.style.boxShadow = "0 6px 24px rgba(0,0,0,0.18)";
    });
    toggleBtn.addEventListener("mouseleave", () => {
      toggleBtn.style.opacity = "0.35";
      toggleBtn.style.background = "rgba(255,255,255,0.12)";
      toggleBtn.style.transform = "scale(1)";
      toggleBtn.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
    });

    // 点击切换
    toggleBtn.addEventListener("click", () => {
      videoEnabled = !videoEnabled;
      writeCache(videoEnabled);
      updateButton();
    });
  }

  function waitForVideo(attempts = 10) {
    const video = document.getElementById("DynamicWallpaper");
    if (video) {
      initToggle();
    } else if (attempts > 0) {
      setTimeout(() => waitForVideo(attempts - 1), 500);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => waitForVideo(), { once: true });
  } else {
    waitForVideo();
  }
})();