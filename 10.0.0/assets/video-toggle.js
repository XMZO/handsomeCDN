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
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(6px);
      border: none;
      padding: 5px 9px;
      border-radius: 50%;
      cursor: pointer;
      z-index: 10000;
      font-size: 13px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      opacity: 0.15;
      transition: opacity 0.3s ease, background 0.3s ease;
    `;
    document.body.appendChild(toggleBtn);

    // 更新按钮 & 视频
    function updateButton() {
      if (videoEnabled) {
        delete video.dataset.userDisabled;  // 移除手动关闭标记
        video.preload = "auto";             // 恢复预加载
        video.style.display = "block";
        video.play();
        toggleBtn.textContent = "🎬";
        toggleBtn.title = "关闭视频背景";
      } else {
        video.pause();
        video.dataset.userDisabled = "true"; // 标记用户手动关闭
        video.preload = "none";              // 停止后台加载
        video.style.display = "none";
        toggleBtn.textContent = "🖼️";
        toggleBtn.title = "恢复视频背景";
      }
    }
    updateButton();

    // 悬停时显示
    toggleBtn.addEventListener("mouseenter", () => {
      toggleBtn.style.opacity = "0.8";
      toggleBtn.style.background = "rgba(255,255,255,0.4)";
    });
    toggleBtn.addEventListener("mouseleave", () => {
      toggleBtn.style.opacity = "0.15";
      toggleBtn.style.background = "rgba(255,255,255,0.15)";
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