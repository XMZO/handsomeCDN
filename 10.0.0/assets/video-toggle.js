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

    // 注入关键帧动画
    if (!document.getElementById('video-toggle-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'video-toggle-styles';
      styleEl.textContent = `
        @keyframes breathe {
          0%, 100% { box-shadow: 0 4px 16px rgba(0,0,0,0.15), 0 0 0 0 rgba(255,255,255,0.1); }
          50% { box-shadow: 0 4px 16px rgba(0,0,0,0.15), 0 0 8px 2px rgba(255,255,255,0.2); }
        }
      `;
      document.head.appendChild(styleEl);
    }

    toggleBtn.style.cssText = `
      position: fixed;
      bottom: ${CFG.bottom}px;
      right: ${CFG.right}px;
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08));
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 50%;
      cursor: pointer;
      z-index: 10000;
      color: rgba(255,255,255,0.9);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2);
      opacity: 0.5;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      animation: breathe 3s ease-in-out infinite;
    `;
    document.body.appendChild(toggleBtn);

    // SVG 图标（深色描边 + 发光效果）
    const svgStyle = 'filter: drop-shadow(0 0 1px rgba(0,0,0,0.8)) drop-shadow(0 0 3px rgba(255,255,255,0.3));';
    const SVG_PLAY = `<svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.3)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="${svgStyle}"><polygon points="6 3 20 12 6 21 6 3"/></svg>`;
    const SVG_PAUSE = `<svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.3)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="${svgStyle}"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`;

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
      toggleBtn.style.background = "linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.15))";
      toggleBtn.style.transform = "scale(1.08)";
      toggleBtn.style.boxShadow = "0 6px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4), 0 0 12px rgba(255,255,255,0.15)";
      toggleBtn.style.borderColor = "rgba(255,255,255,0.5)";
      toggleBtn.style.animation = "none";

    });
    toggleBtn.addEventListener("mouseleave", () => {
      toggleBtn.style.opacity = "0.5";
      toggleBtn.style.background = "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))";
      toggleBtn.style.transform = "scale(1)";
      toggleBtn.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)";
      toggleBtn.style.borderColor = "rgba(255,255,255,0.25)";
      toggleBtn.style.animation = "breathe 3s ease-in-out infinite";
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