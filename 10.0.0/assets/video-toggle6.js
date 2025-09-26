(function () {
  'use strict';

  function initToggle() {
    // 移动端直接退出（双重保险）
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) {
      console.log("[video-toggle] 移动端，不生成按钮");
      return;
    }

    const video = document.getElementById("DynamicWallpaper");
    if (!video) {
      console.log("[video-toggle] 未找到 DynamicWallpaper，可能未启用视频背景");
      return;
    }

    // 创建小开关按钮
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = "🎬";
    toggleBtn.title = "切换视频背景";
    toggleBtn.style.cssText = `
      position: fixed;
      bottom: 180px;
      right: 20px;
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

    toggleBtn.addEventListener("mouseenter", () => {
      toggleBtn.style.opacity = "0.8";
      toggleBtn.style.background = "rgba(255,255,255,0.4)";
    });
    toggleBtn.addEventListener("mouseleave", () => {
      toggleBtn.style.opacity = "0.15";
      toggleBtn.style.background = "rgba(255,255,255,0.15)";
    });

    let videoEnabled = true;
    toggleBtn.addEventListener("click", () => {
      if (videoEnabled) {
        video.pause();
        video.style.display = "none";
        toggleBtn.textContent = "🖼️";
        toggleBtn.title = "恢复视频背景";
      } else {
        video.style.display = "block";
        video.play();
        toggleBtn.textContent = "🎬";
        toggleBtn.title = "关闭视频背景";
      }
      videoEnabled = !videoEnabled;
    });
  }

  function waitForVideo(attempts = 10) {
    const video = document.getElementById("DynamicWallpaper");
    if (video) {
      initToggle();
    } else if (attempts > 0) {
      setTimeout(() => waitForVideo(attempts - 1), 500);
    } else {
      console.warn("[video-toggle] 超时，未检测到 DynamicWallpaper");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => waitForVideo(), { once: true });
  } else {
    waitForVideo();
  }
})();