(function () {
  'use strict';

  function initToggle() {
    const video = document.getElementById("DynamicWallpaper");
    if (!video) {
      console.log("[video-toggle] 未找到 DynamicWallpaper，可能是移动端或视频未加载");
      return;
    }

    // 创建小开关按钮
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = "🎬"; // 初始图标：视频开启
    toggleBtn.title = "切换视频背景"; // Tooltip 提示
    toggleBtn.style.cssText = `
      position: fixed;
      bottom: 120px; /* 再往上，避免和静音按钮重合 */
      right: 20px;   /* 靠右边 */
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
        toggleBtn.textContent = "🖼️"; 
        toggleBtn.title = "恢复视频背景"; // 更新 tooltip
      } else {
        video.style.display = "block";
        video.play();
        toggleBtn.textContent = "🎬"; 
        toggleBtn.title = "关闭视频背景"; // 更新 tooltip
      }
      videoEnabled = !videoEnabled;
    });
  }

  // 延迟检测，确保 video-background.js 已经插入元素
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