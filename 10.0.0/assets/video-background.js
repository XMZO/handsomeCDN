/* 视频背景（完整版重写 + 详细注释）
 * 主要目标：
 * 1) 保留原有：随机选取 .webm 视频、结果缓存 1 小时、1% 概率“彩蛋”降级。
 * 2) 改进稳定性与可维护性：去掉 eval、限定选择器、不误伤 Linux 桌面、错误重试带退避、
 *    尊重用户“省流量/减少动态”偏好、可选注入最小 CSS、可访问性更好。
 *
 * 使用方式：
 * <script src="/path/video-background.js" defer></script>
 * 建议在你的全站 CSS 里添加 #DynamicWallpaper 的样式（也可让脚本注入最小 CSS，见 CFG.injectCSS）。
 */

(function () {
    'use strict';
  
    /** =========================
     *  配置区（按需调整）
     *  ========================= */
    const CFG = {
      // 背景视频资源列表（沿用你的 1..85，webm）
      sources: Array.from({ length: 85 }, (_, i) => `https://cdn.loli-con.cn/videos/background${i + 1}.webm`),
  
      // 结果缓存（本地存储）时长：1 小时
      cacheIntervalMs: 60 * 60 * 1000,
  
      // 1% 概率不放视频（彩蛋降级）
      eggProbability: 0.01,       // 桌面端彩蛋概率（1%）
      mobileEggProbability: 0.005,// 移动端彩蛋概率（0.5%）
      eggImage: 'https://cdn.loli-con.cn/imgs/H.webp',
      eggMessage: '🎉 恭喜发现彩蛋！🥵🥵🥵',
  
      // 仅当命中这些“特定视频”时，显示“解除静音”按钮（保持你原有逻辑）
      specialVideos: [60, 80, 81].map(n => `https://cdn.loli-con.cn/videos/background${n}.webm`),
  
      // 失败重试设置：最大次数 & 初始延迟（指数退避）
      retry: { maxAttempts: 20, baseDelayMs: 1000, maxDelayMs: 30000 },
  
      // 是否在脚本里注入最小 CSS（若你站点有严格 CSP 或已在站点 CSS 写好，可设为 false）
      injectCSS: false,
  
      // 是否尊重用户的“减少动态/省流量”偏好（建议 true）
      respectUserPreferences: true,
  
      // 是否在标签页不可见时暂停、可见时恢复（省资源）
      pauseOnHidden: true,
      
      // 'original' = 恢复原来白底圆形按钮样式
      uiStyle: 'original',
                    
      // 第一次点击页面就自动取消静音（只执行一次）
      autoUnmuteOnFirstClick: true,
      
      // 首次取消静音时弹出彩色提示条
      showFirstUnmuteBanner: true       
    };
  
    /** =========================
     *  运行前环境判断（更温和，不误伤 Linux 桌面）
     *  ========================= */
    const ua = navigator.userAgent || '';
    const isCrawler = /Googlebot|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|Chrome-Lighthouse|HeadlessChrome|PhantomJS|facebot|ia_archiver/i.test(ua);
    // 移动端/平板：尽量用 coarse 指针或 UA 关键词，不用平台名屏蔽 Linux 桌面（原代码会屏蔽 Linux 桌面）:contentReference[oaicite:1]{index=1}
    const isMobileOrTablet = (window.matchMedia && matchMedia('(pointer:coarse)').matches) || /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
  
    // 尊重用户偏好：减少动态 / 省流量
    const prefersReducedMotion = CFG.respectUserPreferences && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = CFG.respectUserPreferences && !!(navigator.connection && navigator.connection.saveData);
  
    if (isCrawler || prefersReducedMotion || saveData) {
      // 始终彩蛋
      showEgg(CFG.eggMessage, CFG.eggImage);
      return;
    }
    
    if (isMobileOrTablet) {
      // 移动端有概率彩蛋，否则走视频逻辑
      if (Math.random() < CFG.mobileEggProbability) {
        showEgg(CFG.eggMessage, CFG.eggImage);
        return;
      }
      // 不 return，后续继续尝试加载视频
    }
  
    /** =========================
     *  从缓存/随机获取视频
     *  ========================= */
    const cached = getCachedVideo();
    const selected = cached || pickAndCacheRandomVideo(CFG.sources, CFG.cacheIntervalMs);
  
    if (!selected) {
      // 命中彩蛋：不放视频
      showEgg(CFG.eggMessage, CFG.eggImage);
      return;
    }
  
    /** =========================
     *  可选注入最小 CSS（避免挡住内容 & 充满可视区）
     *  ========================= */
    if (CFG.injectCSS) {
      injectMinimalCSS();
    }
  
    /** =========================
     *  预加载提示（<link rel="preload" as="video">）
     *  ========================= */
    try {
      const preload = document.createElement('link');
      preload.rel = 'preload';
      preload.as = 'video';
      preload.href = selected;
      preload.type = 'video/webm';
      document.head.appendChild(preload);
    } catch (_) { /* 忽略 */ }
  
    /** =========================
     *  构建并挂载 <video id="DynamicWallpaper">
     *  ========================= */
    const videoEl = document.createElement('video');
    videoEl.id = 'DynamicWallpaper';
    videoEl.src = selected;
    videoEl.autoplay = true;
    videoEl.muted = true;          // 自动播放政策要求：初始静音
    videoEl.loop = true;
    videoEl.preload = 'auto';      // 也可考虑 'metadata' 来减轻首帧带宽
    videoEl.playsInline = true;
    videoEl.setAttribute('aria-hidden', 'true'); // 纯装饰，避免读屏干扰
    videoEl.disablePictureInPicture = true;
  
    // 提前尝试加载与播放（可能被策略拦下，但无碍）
    safeLoadAndPlay(videoEl);
  
    // 错误重试（带指数退避、最大次数）
    attachRetryWithBackoff(videoEl, CFG.retry);
  
    // 标签页可见性：隐藏暂停，返回播放（可选）
    if (CFG.pauseOnHidden) {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          try { videoEl.pause(); } catch (_) {}
        } else {
          // 返回页面后尽量恢复播放（若需用户手势，下面还有兜底）
          try { videoEl.play(); } catch (_) {}
        }
      });
    }
  
    // 用户交互兜底：任意点击尝试恢复播放（限定 #DynamicWallpaper，不会误操作其他 <video>）
    const clickToPlay = (ev) => {
      // 只要背景视频还在且暂停，就尝试播放
      if (videoEl.isConnected && videoEl.paused) {
        videoEl.play().catch(() => { /* 仍可能需要进一步交互，忽略 */ });
      }
    };
    document.addEventListener('click', clickToPlay, { passive: true });
  
    // 仅当命中“特定视频”才显示解除静音按钮（替换原来的 eval 混淆代码）:contentReference[oaicite:2]{index=2}
    if (CFG.specialVideos.includes(selected)) {
      mountUnmuteButton(videoEl);
    }
  
    // 最后挂载到页面
    document.body.appendChild(videoEl);
  
    /** =========================
     *  工具函数区域
     *  ========================= */
  
    function getCachedVideo() {
      try {
        const raw = localStorage.getItem('randomVideoData');
        if (!raw) return '';
        const { video, time } = JSON.parse(raw);
        if (!video || !time) return '';
        if (Date.now() - time > CFG.cacheIntervalMs) return '';
        return video;
      } catch (_) {
        return '';
      }
    }
  
    function pickAndCacheRandomVideo(sources, intervalMs) {
      // 1% 概率返回空串（彩蛋）
      const video = Math.random() < CFG.eggProbability ? '' : sources[Math.floor(Math.random() * sources.length)];
      try {
        localStorage.setItem('randomVideoData', JSON.stringify({ video, time: Date.now(), ttl: intervalMs }));
      } catch (_) { /* storage 可能因配额/Cookie 政策失败，忽略 */ }
      return video;
    }
  
    function injectMinimalCSS() {
      try {
        // 最小必要样式：充满屏幕、置底、穿透点击
        const css = `
          #DynamicWallpaper{
            position:fixed;
            inset:0;
            min-width:100vw;
            min-height:100vh;
            object-fit:cover;
            z-index:-1;
            pointer-events:none;
          }`;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
      } catch (_) { /* ignore */ }
    }
  
    function safeLoadAndPlay(video) {
      try { video.load(); } catch (_) {}
      // 尝试播放（可能因策略被拒绝，下面有兜底 clickToPlay）
      try { video.play(); } catch (_) {}
    }
  
    function attachRetryWithBackoff(video, retryCfg) {
      let attempts = 0;
      video.addEventListener('error', () => {
        attempts += 1;
        if (attempts > retryCfg.maxAttempts) {
          console.warn('[video-bg] 加载失败次数过多，停止重试。');
          return;
        }
        const delay = Math.min(retryCfg.maxDelayMs, retryCfg.baseDelayMs * Math.pow(2, attempts - 1));
        console.warn(`[video-bg] 加载错误，${delay}ms 后重试（第 ${attempts}/${retryCfg.maxAttempts} 次）…`);
        setTimeout(() => {
          safeLoadAndPlay(video);
        }, delay);
      });
    }
  
    function mountUnmuteButton(video) {
        // 切换静音
        let isFirstUnmute = true;
        let hasUnmutedOnceByDoc = false;
      
        function showFirstUnmuteBanner() {
          if (!CFG.showFirstUnmuteBanner || !isFirstUnmute) return;
          const n = document.createElement('div');
          n.textContent = '😮发现特殊动态背景，已开启声音！';
          n.style.cssText = [
            'position:fixed',
            'bottom:80px',
            'right:20px',
            'background:linear-gradient(135deg, rgba(255,0,0,0.2), rgba(0,255,0,0.2), rgba(0,0,255,0.2))',
            'backdrop-filter:blur(10px)',
            'color:#FF69B4',
            'padding:8px 16px',
            'border-radius:8px',
            'z-index:9999',
            'font-size:12px',
            'box-shadow:0 4px 15px rgba(0,0,0,0.2)',
            'border:1px solid rgba(255,255,255,0.2)'
          ].join(';');
          document.body.appendChild(n);
          setTimeout(() => n.remove(), 3000);
        }
      
        function toggleMute(ev) {
          if (ev) ev.stopPropagation();
          video.muted = !video.muted;
          btn.textContent = video.muted ? '🔇' : '🔊';
          btn.setAttribute('aria-pressed', String(!video.muted));
          if (!video.muted) {
            isFirstUnmute = false;
            // 浏览器多要求手势后才能有声播放
            video.play().catch(() => {});
            showFirstUnmuteBanner();
          }
        }
      
        // 创建按钮
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'DynamicWallpaperUnmute';
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', '切换背景视频静音状态');
        btn.textContent = video.muted ? '🔇' : '🔊';
      
        // “原样”视觉（白底、圆形、右侧 120px），或用我提供的极简风格
        if (CFG.uiStyle === 'original') {
          btn.style.cssText = [
            'position:fixed',
            'bottom:20px',
            'right:120px',
            'background:rgba(255,255,255,0.3)',
            'backdrop-filter:blur(10px)',
            'color:black',
            'border:none',
            'padding:8px 12px',
            'border-radius:50%',
            'cursor:pointer',
            'z-index:9999',
            'font-size:14px',
            'box-shadow:0 2px 10px rgba(0,0,0,0.1)',
            'transition:opacity .3s ease',
            'opacity:0.9'
          ].join(';');
          let hideTimeout;
          btn.addEventListener('mouseenter', () => { clearTimeout(hideTimeout); btn.style.opacity = '1'; });
          btn.addEventListener('mouseleave', () => { hideTimeout = setTimeout(() => { btn.style.opacity = '0'; }, 3000); });
        } else {
          // 极简深色风格
          btn.style.position = 'fixed';
          btn.style.bottom = '20px';
          btn.style.right = '20px';
          btn.style.background = 'rgba(0,0,0,0.5)';
          btn.style.color = '#fff';
          btn.style.border = '1px solid rgba(255,255,255,0.3)';
          btn.style.borderRadius = '8px';
          btn.style.padding = '8px 10px';
          btn.style.fontSize = '14px';
          btn.style.cursor = 'pointer';
          btn.style.zIndex = '9999';
          btn.style.backdropFilter = 'blur(4px)';
          btn.style.transition = 'opacity .3s ease';
          btn.style.opacity = '0.9';
          btn.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
          btn.addEventListener('mouseleave', () => { btn.style.opacity = '0.9'; });
        }
      
        // 点击按钮切换静音
        btn.addEventListener('click', toggleMute);
      
        // “第一次点击页面自动取消静音”（完全复原原逻辑）
        if (CFG.autoUnmuteOnFirstClick) {
          document.addEventListener('click', () => {
            if (video.muted && !hasUnmutedOnceByDoc) {
              hasUnmutedOnceByDoc = true;
              toggleMute();
            }
          }, { passive: true });
        }
      
        document.body.appendChild(btn);
      }      
  
    function showEgg(message, imageUrl) {
      // 保留你原逻辑：展示纯文本 + 图片的“彩蛋”降级
      const wrap = document.createElement('div');
      wrap.style.textAlign = 'center';
      wrap.style.marginTop = '20%';
  
      const p = document.createElement('p');
      p.textContent = message;
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = '彩蛋图片';
  
      wrap.appendChild(p);
      wrap.appendChild(img);
      document.body.appendChild(wrap);
    }
  })();
  