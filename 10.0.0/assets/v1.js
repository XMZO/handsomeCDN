/* 视频背景（Canvas 防盗版）
 * 改动：
 * 1. 用隐藏的 <video> 加载视频
 * 2. 用 <canvas> 渲染画面（防右键保存）
 * 3. 添加 Token 验证（防直接下载）
 * 4. 保留所有原有功能
 */

(function () {
    'use strict';
  
    /** ========================= 配置区 ========================= */
    const CFG = {
      // 背景视频资源列表（路径改为相对路径）
      sources: Array.from({ length: 85 }, (_, i) => `/videos/background${i + 1}.webm`),
      
      // CDN 基础 URL
      cdnBase: 'https://cdn.loli-con.cn',
      
      // Token API 端点
      apiEndpoint: 'https://cdn.loli-con.cn/__api__/video-token',
      
      // 结果缓存时长：1 小时
      cacheIntervalMs: 60 * 60 * 1000,
      
      // 彩蛋概率
      eggProbability: 0.01,
      mobileEggProbability: 0.005,
      eggImage: 'https://cdn.loli-con.cn/imgs/H.webp',
      eggMessage: '🎉 恭喜发现彩蛋！🥵🥵🥵',
      
      // 特定视频（显示解除静音按钮）
      specialVideos: [60, 80, 81].map(n => `/videos/background${n}.webm`),
      
      // 失败重试设置
      retry: { maxAttempts: 20, baseDelayMs: 1000, maxDelayMs: 30000 },
      
      // 其他设置
      respectUserPreferences: true,
      pauseOnHidden: true,
      uiStyle: 'original',
      autoUnmuteOnFirstClick: true,
      showFirstUnmuteBanner: true,
      
      // Canvas 渲染帧率（30fps 省 CPU）
      renderFPS: 30
    };
  
    /** ========================= 环境判断 ========================= */
    const ua = navigator.userAgent || '';
    const isCrawler = /Googlebot|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|Chrome-Lighthouse|HeadlessChrome|PhantomJS|facebot|ia_archiver/i.test(ua);
    const isMobileOrTablet = (window.matchMedia && matchMedia('(pointer:coarse)').matches) || /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    const prefersReducedMotion = CFG.respectUserPreferences && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = CFG.respectUserPreferences && !!(navigator.connection && navigator.connection.saveData);
  
    if (isCrawler) {
      console.info('[video-bg] 检测到爬虫，跳过加载');
      return;
    }
    
    if (prefersReducedMotion || saveData) {
      return;
    }
    
    if (isMobileOrTablet) {
      if (Math.random() < CFG.mobileEggProbability) {
        showEgg(CFG.eggMessage, CFG.eggImage);
      }
      return;
    }
  
    /** ========================= 选择视频 ========================= */
    const cached = getCachedVideo();
    const selected = cached !== null ? cached : pickAndCacheRandomVideo(CFG.sources, CFG.cacheIntervalMs);
  
    if (!selected) {
      showEgg(CFG.eggMessage, CFG.eggImage);
      return;
    }
  
    /** ========================= 加载视频（Canvas 版本）========================= */
    loadVideoWithCanvas(selected);
  
    /** ========================= 核心函数：Canvas 加载 ========================= */
    async function loadVideoWithCanvas(videoPath) {
      try {
        console.log('[video-bg] 🎬 开始加载视频:', videoPath);
        
        // 1. 获取带 Token 的 URL
        console.log('[video-bg] 📡 获取视频 Token...');
        const response = await fetch(CFG.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: videoPath })
        });
        
        if (!response.ok) {
          throw new Error('Failed to get token');
        }
        
        const data = await response.json();
        console.log('[video-bg] ✅ Token 获取成功');
        
        // 2. 下载视频
        console.log('[video-bg] ⬇️ 下载视频...');
        const videoResponse = await fetch(data.url);
        if (!videoResponse.ok) {
          throw new Error('Failed to load video');
        }
        
        const blob = await videoResponse.blob();
        const blobUrl = URL.createObjectURL(blob);
        console.log('[video-bg] ✅ 视频下载完成');
        
        // 3. 创建隐藏的 video 元素
        const hiddenVideo = document.createElement('video');
        hiddenVideo.id = 'DynamicWallpaper-Hidden';
        hiddenVideo.src = blobUrl;
        hiddenVideo.autoplay = true;
        hiddenVideo.muted = true;
        hiddenVideo.loop = true;
        hiddenVideo.playsInline = true;
        hiddenVideo.setAttribute('aria-hidden', 'true');
        hiddenVideo.disablePictureInPicture = true;
        hiddenVideo.style.display = 'none';
        
        // 4. 创建 Canvas 元素
        const canvas = document.createElement('canvas');
        canvas.id = 'DynamicWallpaper';
        const ctx = canvas.getContext('2d', { alpha: false });
        
        // 5. 等待视频元数据加载
        await new Promise((resolve, reject) => {
          hiddenVideo.onloadedmetadata = resolve;
          hiddenVideo.onerror = reject;
          setTimeout(() => reject(new Error('Timeout')), 30000);
        });
        
        // 6. 设置 Canvas 尺寸
        canvas.width = hiddenVideo.videoWidth;
        canvas.height = hiddenVideo.videoHeight;
        console.log('[video-bg] 📐 Canvas 尺寸:', canvas.width, 'x', canvas.height);
        
        // 7. 挂载到页面
        document.body.appendChild(hiddenVideo);
        document.body.appendChild(canvas);
        
        // 8. 禁用右键菜单
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // 9. 开始渲染循环
        let lastFrameTime = 0;
        const frameInterval = 1000 / CFG.renderFPS;
        let animationId = null;
        
        function renderFrame(timestamp) {
          if (timestamp - lastFrameTime >= frameInterval) {
            try {
              ctx.drawImage(hiddenVideo, 0, 0, canvas.width, canvas.height);
              lastFrameTime = timestamp;
            } catch (e) {
              console.warn('[video-bg] 渲染错误:', e);
            }
          }
          animationId = requestAnimationFrame(renderFrame);
        }
        
        // 10. 开始播放
        hiddenVideo.play().then(() => {
          console.log('[video-bg] ▶️ 开始播放');
          requestAnimationFrame(renderFrame);
        }).catch((e) => {
          console.error('[video-bg] 播放失败:', e);
        });
        
        // 11. 标签页可见性控制
        if (CFG.pauseOnHidden) {
          document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
              try { 
                hiddenVideo.pause();
                if (animationId) cancelAnimationFrame(animationId);
              } catch (_) {}
            } else {
              try { 
                hiddenVideo.play();
                requestAnimationFrame(renderFrame);
              } catch (_) {}
            }
          });
        }
        
        // 12. 用户交互兜底
        document.addEventListener('click', () => {
          if (hiddenVideo.paused) {
            hiddenVideo.play().catch(() => {});
          }
        }, { passive: true });
        
        // 13. 特定视频显示解除静音按钮
        if (CFG.specialVideos.includes(videoPath)) {
          mountUnmuteButton(hiddenVideo);
        }
        
        // 14. 错误重试
        let errorCount = 0;
        hiddenVideo.addEventListener('error', () => {
          errorCount++;
          if (errorCount > CFG.retry.maxAttempts) {
            console.error('[video-bg] 加载失败次数过多，放弃加载');
            canvas.remove();
            hiddenVideo.remove();
            showEgg('视频加载失败 😢', CFG.eggImage);
            return;
          }
          
          const delay = Math.min(CFG.retry.maxDelayMs, CFG.retry.baseDelayMs * Math.pow(2, errorCount - 1));
          console.warn(`[video-bg] 加载错误，${delay}ms 后重试（第 ${errorCount}/${CFG.retry.maxAttempts} 次）…`);
          
          setTimeout(() => {
            canvas.remove();
            hiddenVideo.remove();
            loadVideoWithCanvas(videoPath);
          }, delay);
        });
        
      } catch (error) {
        console.error('[video-bg] ❌ 加载失败:', error);
        showEgg('视频加载失败 😢', CFG.eggImage);
      }
    }
  
    /** ========================= 工具函数 ========================= */
    
    function getCachedVideo() {
      try {
        const raw = localStorage.getItem('randomVideoData');
        if (!raw) return null;
        
        const data = JSON.parse(raw);
        if (typeof data !== 'object' || data === null) {
          throw new Error('Invalid data');
        }
        
        const { video, time } = data;
        
        if (typeof video !== 'string' || !video) {
          throw new Error('Invalid video');
        }
        
        if (!isValidVideoUrl(video)) {
          throw new Error('Invalid URL format');
        }
  
        if (typeof time !== 'number' || time <= 0) {
          throw new Error('Invalid time');
        }
  
        if (time - Date.now() > 30 * 24 * 60 * 60 * 1000) {
          throw new Error('Clock skew too large');
        }
        
        if (Date.now() - time > CFG.cacheIntervalMs) {
          return null;
        }
        
        return video;
        
      } catch (err) {
        console.warn('[video-bg] 缓存异常，已清理:', err.message);
        try { 
          localStorage.removeItem('randomVideoData'); 
        } catch(_) {}
        return null;
      }
    }
    
    function isValidVideoUrl(url) {
      if (typeof url !== 'string') return false;
      
      // 改为相对路径匹配
      const pattern = /^\/videos\/background(\d{1,2})\.webm$/;
      const match = url.match(pattern);
      if (!match) return false;
      
      const num = parseInt(match[1], 10);
      if (num < 1 || num > 85) return false;
      
      if (/[\x00-\x1F\x7F-\x9F\uFFFD]/.test(url)) return false;
      if (url.length > 500) return false;
      
      return true;
    }
  
    function pickAndCacheRandomVideo(sources, intervalMs) {
      const video = Math.random() < CFG.eggProbability 
        ? '' 
        : sources[Math.floor(Math.random() * sources.length)];
      
      if (video) {
        try {
          localStorage.setItem('randomVideoData', JSON.stringify({
            video,
            time: Date.now(),
            ttl: intervalMs
          }));
        } catch (err) {
          console.warn('[video-bg] 缓存失败:', err.message);
        }
      }
      
      return video;
    }
  
    function mountUnmuteButton(video) {
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
          video.play().catch(() => {});
          showFirstUnmuteBanner();
        }
      }
    
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'DynamicWallpaperUnmute';
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', '切换背景视频静音状态');
      btn.textContent = video.muted ? '🔇' : '🔊';
    
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
      }
    
      btn.addEventListener('click', toggleMute);
    
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
  