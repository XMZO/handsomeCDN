/* 视频背景（Canvas 防盗版 - 修复版）
 * 修复：
 * 1. 修复加载失败问题
 * 2. 加载失败不显示彩蛋
 * 3. 添加详细调试参数
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
    retry: { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 10000 },
    
    // 其他设置
    respectUserPreferences: true,
    pauseOnHidden: true,
    uiStyle: 'original',
    autoUnmuteOnFirstClick: true,
    showFirstUnmuteBanner: true,
    
    // Canvas 渲染帧率（30fps 省 CPU）
    renderFPS: 30,
    
    // ✅ 调试模式（开启后显示详细日志）
    debug: true
  };

  /** ========================= 调试工具 ========================= */
  const Logger = {
    log: function(...args) {
      if (CFG.debug) {
        console.log('[video-bg]', ...args);
      }
    },
    warn: function(...args) {
      console.warn('[video-bg]', ...args);
    },
    error: function(...args) {
      console.error('[video-bg]', ...args);
    },
    group: function(title) {
      if (CFG.debug) {
        console.group('[video-bg] ' + title);
      }
    },
    groupEnd: function() {
      if (CFG.debug) {
        console.groupEnd();
      }
    }
  };

  /** ========================= 环境判断 ========================= */
  Logger.group('环境检测');
  
  const ua = navigator.userAgent || '';
  const isCrawler = /Googlebot|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|Chrome-Lighthouse|HeadlessChrome|PhantomJS|facebot|ia_archiver/i.test(ua);
  const isMobileOrTablet = (window.matchMedia && matchMedia('(pointer:coarse)').matches) || /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
  const prefersReducedMotion = CFG.respectUserPreferences && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = CFG.respectUserPreferences && !!(navigator.connection && navigator.connection.saveData);

  Logger.log('User Agent:', ua);
  Logger.log('是否爬虫:', isCrawler);
  Logger.log('是否移动端:', isMobileOrTablet);
  Logger.log('减少动态偏好:', prefersReducedMotion);
  Logger.log('省流量模式:', saveData);
  
  Logger.groupEnd();

  if (isCrawler) {
    Logger.log('✅ 检测到爬虫，跳过加载');
    return;
  }
  
  if (prefersReducedMotion || saveData) {
    Logger.log('✅ 用户偏好设置，跳过加载');
    return;
  }
  
  if (isMobileOrTablet) {
    Logger.log('✅ 移动端设备');
    if (Math.random() < CFG.mobileEggProbability) {
      Logger.log('🎉 命中移动端彩蛋');
      showEgg(CFG.eggMessage, CFG.eggImage);
    }
    return;
  }

  /** ========================= 选择视频 ========================= */
  Logger.group('视频选择');
  
  const cached = getCachedVideo();
  const selected = cached !== null ? cached : pickAndCacheRandomVideo(CFG.sources, CFG.cacheIntervalMs);

  Logger.log('缓存视频:', cached);
  Logger.log('最终选择:', selected);
  
  Logger.groupEnd();

  if (!selected) {
    Logger.log('🎉 命中桌面端彩蛋');
    showEgg(CFG.eggMessage, CFG.eggImage);
    return;
  }

  /** ========================= 加载视频（Canvas 版本）========================= */
  loadVideoWithCanvas(selected);

  /** ========================= 核心函数：Canvas 加载 ========================= */
  async function loadVideoWithCanvas(videoPath) {
    Logger.group('Canvas 加载流程');
    Logger.log('🎬 开始加载视频:', videoPath);
    
    try {
      // 1. 获取带 Token 的 URL
      Logger.log('📡 步骤 1/7: 获取视频 Token...');
      Logger.log('API 端点:', CFG.apiEndpoint);
      Logger.log('请求参数:', { path: videoPath });
      
      const tokenResponse = await fetch(CFG.apiEndpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path: videoPath })
      });
      
      Logger.log('Token 响应状态:', tokenResponse.status);
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        Logger.error('Token 获取失败:', errorText);
        throw new Error(`Token API failed: ${tokenResponse.status} - ${errorText}`);
      }
      
      const tokenData = await tokenResponse.json();
      Logger.log('✅ Token 获取成功:', tokenData);
      
      // 2. 下载视频
      Logger.log('📡 步骤 2/7: 下载视频...');
      Logger.log('视频 URL:', tokenData.url);
      
      const videoResponse = await fetch(tokenData.url);
      Logger.log('视频响应状态:', videoResponse.status);
      Logger.log('视频 Content-Type:', videoResponse.headers.get('content-type'));
      Logger.log('视频大小:', videoResponse.headers.get('content-length'), 'bytes');
      
      if (!videoResponse.ok) {
        const errorText = await videoResponse.text();
        Logger.error('视频下载失败:', errorText);
        throw new Error(`Video download failed: ${videoResponse.status} - ${errorText}`);
      }
      
      const blob = await videoResponse.blob();
      Logger.log('✅ 视频下载完成, Blob 大小:', blob.size, 'bytes');
      
      const blobUrl = URL.createObjectURL(blob);
      Logger.log('Blob URL:', blobUrl);
      
      // 3. 创建隐藏的 video 元素
      Logger.log('📡 步骤 3/7: 创建隐藏 video 元素...');
      const hiddenVideo = document.createElement('video');
      hiddenVideo.id = 'DynamicWallpaper-Hidden';
      hiddenVideo.src = blobUrl;
      hiddenVideo.autoplay = true;
      hiddenVideo.muted = true;
      hiddenVideo.loop = true;
      hiddenVideo.playsInline = true;
      hiddenVideo.setAttribute('aria-hidden', 'true');
      hiddenVideo.disablePictureInPicture = true;
      hiddenVideo.style.cssText = 'display:none !important;position:absolute;top:-9999px;left:-9999px;';
      
      // 4. 创建 Canvas 元素
      Logger.log('📡 步骤 4/7: 创建 Canvas 元素...');
      const canvas = document.createElement('canvas');
      canvas.id = 'DynamicWallpaper';
      const ctx = canvas.getContext('2d', { alpha: false });
      
      if (!ctx) {
        throw new Error('Canvas context creation failed');
      }
      
      Logger.log('✅ Canvas context 创建成功');
      
      // 5. 等待视频元数据加载
      Logger.log('📡 步骤 5/7: 等待视频元数据加载...');
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          Logger.error('视频元数据加载超时');
          reject(new Error('Video metadata load timeout'));
        }, 30000);
        
        hiddenVideo.onloadedmetadata = () => {
          clearTimeout(timeout);
          Logger.log('✅ 视频元数据加载完成');
          Logger.log('视频尺寸:', hiddenVideo.videoWidth, 'x', hiddenVideo.videoHeight);
          Logger.log('视频时长:', hiddenVideo.duration, '秒');
          resolve();
        };
        
        hiddenVideo.onerror = (e) => {
          clearTimeout(timeout);
          Logger.error('视频加载错误:', e);
          Logger.error('视频错误代码:', hiddenVideo.error?.code);
          Logger.error('视频错误信息:', hiddenVideo.error?.message);
          reject(new Error(`Video load error: ${hiddenVideo.error?.message || 'Unknown'}`));
        };
      });
      
      // 6. 设置 Canvas 尺寸
      Logger.log('📡 步骤 6/7: 设置 Canvas 尺寸...');
      canvas.width = hiddenVideo.videoWidth;
      canvas.height = hiddenVideo.videoHeight;
      Logger.log('✅ Canvas 尺寸:', canvas.width, 'x', canvas.height);
      
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Invalid canvas dimensions');
      }
      
      // 7. 挂载到页面
      Logger.log('📡 步骤 7/7: 挂载到页面...');
      document.body.appendChild(hiddenVideo);
      document.body.appendChild(canvas);
      Logger.log('✅ 元素挂载完成');
      
      // 8. 禁用右键菜单
      canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        Logger.log('🚫 右键菜单已禁用');
      });
      
      // 9. 开始渲染循环
      Logger.log('📡 启动渲染循环...');
      let lastFrameTime = 0;
      const frameInterval = 1000 / CFG.renderFPS;
      let animationId = null;
      let frameCount = 0;
      
      function renderFrame(timestamp) {
        if (timestamp - lastFrameTime >= frameInterval) {
          try {
            ctx.drawImage(hiddenVideo, 0, 0, canvas.width, canvas.height);
            lastFrameTime = timestamp;
            frameCount++;
            
            // 每 100 帧输出一次日志
            if (frameCount % 100 === 0) {
              Logger.log('📊 已渲染', frameCount, '帧');} catch (e) {
            Logger.warn('渲染错误:', e);
          }
        }
        animationId = requestAnimationFrame(renderFrame);
      }
      
      // 10. 开始播放
      Logger.log('📡 开始播放视频...');
      await hiddenVideo.play();
      Logger.log('✅ 视频播放成功');
      requestAnimationFrame(renderFrame);
      
      Logger.groupEnd();
      Logger.log('🎉 视频背景加载完成！');
      
      // 11. 标签页可见性控制
      if (CFG.pauseOnHidden) {
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) {
            Logger.log('⏸️ 标签页隐藏，暂停播放');
            try { 
              hiddenVideo.pause();
              if (animationId) cancelAnimationFrame(animationId);
            } catch (_) {}
          } else {
            Logger.log('▶️ 标签页显示，恢复播放');
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
          Logger.log('👆 用户点击，尝试恢复播放');
          hiddenVideo.play().catch(() => {});
        }
      }, { passive: true });
      
      // 13. 特定视频显示解除静音按钮
      if (CFG.specialVideos.includes(videoPath)) {
        Logger.log('🔊 特定视频，显示解除静音按钮');
        mountUnmuteButton(hiddenVideo);
      }
      
      // 14. 错误监听
      hiddenVideo.addEventListener('error', (e) => {
        Logger.error('❌ 视频播放错误:', e);
        Logger.error('错误代码:', hiddenVideo.error?.code);
        Logger.error('错误信息:', hiddenVideo.error?.message);
      });
      
    } catch (error) {
      Logger.groupEnd();
      Logger.error('❌ 加载失败:', error);
      Logger.error('错误堆栈:', error.stack);
      // ✅ 加载失败不显示彩蛋，只显示错误提示
      showErrorMessage('视频背景加载失败，请刷新页面重试');
    }
  }

  /** ========================= 工具函数 ========================= */
  
  function getCachedVideo() {
    try {
      const raw = localStorage.getItem('randomVideoData');
      if (!raw) {
        Logger.log('缓存为空');
        return null;
      }
      
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
        Logger.log('缓存已过期');
        return null;
      }
      
      Logger.log('使用缓存视频:', video);
      return video;
      
    } catch (err) {
      Logger.warn('缓存异常，已清理:', err.message);
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
    const isEgg = Math.random() < CFG.eggProbability;
    const video = isEgg ? '' : sources[Math.floor(Math.random() * sources.length)];
    
    Logger.log('随机选择:', isEgg ? '彩蛋' : video);
    
    if (video) {
      try {
        localStorage.setItem('randomVideoData', JSON.stringify({
          video,
          time: Date.now(),
          ttl: intervalMs
        }));
        Logger.log('✅ 缓存已保存');
      } catch (err) {
        Logger.warn('缓存失败:', err.message);
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
      Logger.log('🔊 静音状态:', video.muted ? '静音' : '有声');
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

  // ✅ 显示彩蛋（只在命中彩蛋时调用）
  function showEgg(message, imageUrl) {
    Logger.log('🎉 显示彩蛋');
    const wrap = document.createElement('div');
    wrap.style.cssText = 'text-align:center;margin-top:20%;';

    const p = document.createElement('p');
    p.textContent = message;
    p.style.cssText = 'font-size:24px;color:#FF69B4;margin-bottom:20px;';
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = '彩蛋图片';
    img.style.cssText = 'max-width:80%;height:auto;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.2);';

    wrap.appendChild(p);
    wrap.appendChild(img);
    document.body.appendChild(wrap);
  }
  
  // ✅ 显示错误提示（加载失败时调用）
  function showErrorMessage(message) {
    Logger.log('⚠️ 显示错误提示:', message);
    const wrap = document.createElement('div');
    wrap.style.cssText = [
      'position:fixed',
      'top:20px',
      'right:20px',
      'background:rgba(255,0,0,0.1)',
      'backdrop-filter:blur(10px)',
      'color:#ff4444',
      'padding:12px 20px',
      'border-radius:8px',
      'z-index:9999',
      'font-size:14px',
      'box-shadow:0 4px 15px rgba(0,0,0,0.2)',
      'border:1px solid rgba(255,0,0,0.3)',
      'max-width:300px'
    ].join(';');
    
    wrap.textContent = message;
    document.body.appendChild(wrap);
    
    // 10秒后自动消失
    setTimeout(() => wrap.remove(), 10000);
  }
})();