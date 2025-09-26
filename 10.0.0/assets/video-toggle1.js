(function () {
  'use strict';

  function initToggle() {
    const video = document.getElementById("DynamicWallpaper");
    if (!video) {
      console.log("[video-toggle] 未找到 DynamicWallpaper，可能是移动端，不显示开关");
      return;
    }

    // 创建小开关按钮
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = "🎬"; // 初始图标：视频开启
    toggleBtn.style.cssText = `
      position: fixed;
      bottom: 80px; /* 往上调，避免和静音按钮重合 */
      right: 20px;
      background: rgba(255,255,255,0.3);
      backdrop-filter: blur(10px);
      border: none;
      padding: 6px 10px;
      border-radius: 50%;
      cursor: pointer;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      opacity: 0.3;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(toggleBtn);

    // 悬停时亮起来
    toggleBtn.addEventListener("mouseenter", () => {
      toggleBtn.style.opacity = "1";
    });
    toggleBtn.addEventListener("mouseleave", () => {
      toggleBtn.style.opacity = "0.3";
    });

    // 状态切换
    let videoEnabled = true;
    toggleBtn.addEventListener("click", () => {
      if (videoEnabled) {
        video.pause();
        video.style.display = "none";
        toggleBtn.textContent = "🖼️"; // 静态背景
      } else {
        video.style.display = "block";
        video.play();
        toggleBtn.textContent = "🎬"; // 视频模式
      }
      videoEnabled = !videoEnabled;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initToggle, { once: true });
  } else {
    initToggle();
  }
})();