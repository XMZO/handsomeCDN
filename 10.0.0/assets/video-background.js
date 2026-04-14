/* 视频背景（HLS 版）
 * 通过 m3u8 + ts 分片加载背景视频，突破 GitHub 100MB 单文件限制。
 * Safari 走原生 HLS，其他浏览器通过 hls.js（动态加载）播放。
 */

(function () {
  'use strict';

  const CFG = {
    // ========== 视频源 ==========
    videoBase: 'https://raw.loliloli.mom/videos_hls/',   // 视频根路径（末尾带 /）
    videoCount: 85,                                       // 视频总数（background1 ~ background85）
    specialVideos: [60, 80, 81],                          // 有声视频编号（会显示解除静音按钮）

    // ========== hls.js ==========
    hlsJsUrl: 'https://lib.loliloli.mom/handsomeCDN@master/10.0.0/assets/hls.min.js',

    // ========== 缓存 ==========
    cacheKey: 'randomVideoData',                          // localStorage 键名
    cacheIntervalMs: 60 * 60 * 1000,                      // 缓存时长（1 小时）

    // ========== 彩蛋 ==========
    eggProbability: 0.01,                                 // 桌面端彩蛋概率（1%）
    mobileEggProbability: 0.005,                          // 移动端彩蛋概率（0.5%）
    eggImage: 'https://raw.loliloli.mom/imgs/H.webp',
    eggMessage: '🎉 恭喜发现彩蛋！🥵🥵🥵',

    // ========== Safari 重试 ==========
    retryMaxAttempts: 5,                                  // 最大重试次数
    retryBaseDelayMs: 1000,                               // 初始延迟
    retryMaxDelayMs: 30000,                               // 最大延迟

    // ========== 解除静音提示 ==========
    unmuteBannerText: '😮发现特殊动态背景，已开启声音！',
    unmuteBannerDurationMs: 3000,                         // 提示条显示时长

    // ========== 功能开关 ==========
    injectCSS: false,                                     // 是否注入最小 CSS
    respectUserPreferences: true,                         // 是否尊重 reduced-motion / save-data
    pauseOnHidden: false,                                 // 标签页不可见时暂停
    autoUnmuteOnFirstClick: true,                         // 首次点击页面自动取消静音（仅特殊视频）
    showFirstUnmuteBanner: true,                          // 首次取消静音时弹出提示条
    uiStyle: 'original',                                  // 解除静音按钮样式

    // ========== ORB 绕过 ==========
    // jsdelivr 把 .m3u8 当 text/plain 返回，Chrome 的 ORB 会拦截。
    // 解决：转换脚本生成 playlists.js（一份 JS 文件，包含所有 m3u8 内容），
    //      由 <script> 加载（JS 不受 ORB 限制），再以 Blob URL 喂给 hls.js。
    // 未来迁到可控 MIME 的 CDN（如 R2）后，把这里设为 false 即可关闭，
    // 然后就可以删除下面 "ORB 绕过 BEGIN ~ END" 之间的整段代码。
    useInlinePlaylists: true,
    playlistsJsPath: 'playlists.js'                       // 相对于 videoBase
  };

  // 由 CFG 派生的 URL 列表
  const sources = Array.from({ length: CFG.videoCount }, (_, i) =>
    CFG.videoBase + 'background' + (i + 1) + '/index.m3u8'
  );
  const specialVideoUrls = CFG.specialVideos.map(n =>
    CFG.videoBase + 'background' + n + '/index.m3u8'
  );

  /* ========================
   * 环境检测 & 提前退出
   * ======================== */
  const ua = navigator.userAgent || '';
  const isCrawler = /Googlebot|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|Chrome-Lighthouse|HeadlessChrome|PhantomJS|facebot|ia_archiver/i.test(ua);
  const isMobileOrTablet = (window.matchMedia && matchMedia('(pointer:coarse)').matches) || /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
  const prefersReducedMotion = CFG.respectUserPreferences && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = CFG.respectUserPreferences && !!(navigator.connection && navigator.connection.saveData);

  if (isCrawler) {
    console.info('[video-bg] 检测到爬虫，跳过加载');
    return;
  }
  if (prefersReducedMotion || saveData) return;
  if (isMobileOrTablet) {
    if (Math.random() < CFG.mobileEggProbability) showEgg(CFG.eggMessage, CFG.eggImage);
    return;
  }

  /* ========================
   * 视频选取（缓存 / 随机）
   * ======================== */
  const cached = getCachedVideo();
  const selected = cached !== null ? cached : pickAndCacheRandomVideo();

  if (!selected) {
    showEgg(CFG.eggMessage, CFG.eggImage);
    return;
  }

  if (CFG.injectCSS) injectMinimalCSS();

  /* ========================
   * 初始化（async：可能需要加载 hls.js）
   * ======================== */
  init(selected);

  async function init(url) {
    const videoEl = document.createElement('video');
    videoEl.id = 'DynamicWallpaper';
    videoEl.autoplay = true;
    videoEl.muted = true;
    videoEl.loop = true;
    videoEl.playsInline = true;
    videoEl.preload = 'auto';
    videoEl.setAttribute('aria-hidden', 'true');
    videoEl.disablePictureInPicture = true;

    const nativeHls = !!videoEl.canPlayType('application/vnd.apple.mpegurl');

    if (nativeHls) {
      // Safari：原生 HLS
      videoEl.src = url;
      attachNativeRetry(videoEl, url);
    } else {
      // Chrome / Firefox / Edge：需要 hls.js
      try {
        await loadScript(CFG.hlsJsUrl);
      } catch {
        console.warn('[video-bg] hls.js 加载失败');
        return;
      }
      if (!window.Hls || !Hls.isSupported()) {
        console.warn('[video-bg] 浏览器不支持 HLS');
        return;
      }
      // --- ORB 绕过 BEGIN ---
      // jsdelivr 把 .m3u8 当 text/plain 返回，Chrome 的 ORB 会拦截。
      // 解决：从预加载的 playlists.js 读取 m3u8 内容，以 Blob URL 喂给 hls.js。
      // 迁移到可控 MIME 的 CDN（如 R2）后，设 CFG.useInlinePlaylists = false，
      // 然后删除 BEGIN ~ END 之间的整段代码即可。
      var hlsSource = url;
      if (CFG.useInlinePlaylists) {
        try {
          var bustKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
          await loadScript(CFG.videoBase + CFG.playlistsJsPath + '?v=' + bustKey);
        } catch {
          console.warn('[video-bg] playlists.js 加载失败');
          return;
        }
        var num = extractVideoNumber(url);
        var m3u8Text = window.VIDEO_PLAYLISTS && window.VIDEO_PLAYLISTS[num];
        if (!m3u8Text) {
          console.warn('[video-bg] 未找到 playlist #' + num);
          return;
        }
        var base = url.substring(0, url.lastIndexOf('/') + 1);
        // 把所有相对路径改成绝对路径：
        //   - #EXT-X-MAP:URI="init..." (fMP4 初始化片段)
        //   - #EXT-X-KEY:URI="xxx.bin" (AES-128 密钥文件)
        //   - 分片行本身（.m4s / .ts / ...）
        var lines = m3u8Text.split('\n');
        for (var li = 0; li < lines.length; li++) {
          var line = lines[li];
          // 有 URI="..." 属性的标签
          if (line.indexOf('#EXT-X-MAP') === 0 || line.indexOf('#EXT-X-KEY') === 0) {
            var uriMatch = line.match(/URI="([^"]+)"/);
            if (uriMatch && !/^https?:/i.test(uriMatch[1])) {
              lines[li] = line.replace(uriMatch[0], 'URI="' + base + uriMatch[1] + '"');
            }
            continue;
          }
          if (!line || line.charAt(0) === '#') continue;
          if (/^https?:/i.test(line)) continue;
          lines[li] = base + line;
        }
        m3u8Text = lines.join('\n');
        var blob = new Blob([m3u8Text], { type: 'application/vnd.apple.mpegurl' });
        hlsSource = URL.createObjectURL(blob);
      }
      // --- ORB 绕过 END ---

      const hls = new Hls();
      hls.loadSource(hlsSource);
      hls.attachMedia(videoEl);

      hls.on(Hls.Events.ERROR, function (_, data) {
        if (!data.fatal) return;
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.warn('[video-bg] 网络错误，尝试恢复');
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.warn('[video-bg] 媒体错误，尝试恢复');
            hls.recoverMediaError();
            break;
          default:
            console.warn('[video-bg] 致命错误，放弃加载');
            hls.destroy();
            videoEl.remove();
            return;
        }
      });

      videoEl._hls = hls;
    }

    document.body.appendChild(videoEl);
    videoEl.play().catch(function () {});

    // 标签页可见性
    if (CFG.pauseOnHidden) {
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          try { videoEl.pause(); } catch (_) {}
        } else if (!videoEl.dataset.userDisabled) {
          videoEl.play().catch(function () {});
        }
      });
    }

    // 点击恢复播放
    document.addEventListener('click', function () {
      if (videoEl.dataset.userDisabled) return;
      if (videoEl.isConnected && videoEl.paused) {
        videoEl.play().catch(function () {});
      }
    }, { passive: true });

    // 特殊视频：挂载解除静音按钮
    if (specialVideoUrls.includes(url)) {
      mountUnmuteButton(videoEl);
    }
  }

  /* ========================
   * 工具函数
   * ======================== */

  var loadedScripts = {};
  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      if (loadedScripts[url]) { resolve(); return; }
      var s = document.createElement('script');
      s.src = url;
      s.onload = function () { loadedScripts[url] = true; resolve(); };
      s.onerror = function () { reject(new Error('Script load failed: ' + url)); };
      document.head.appendChild(s);
    });
  }

  // 从 m3u8 URL 提取视频编号: .../background12/index.m3u8 -> "12"
  function extractVideoNumber(url) {
    var m = url.match(/\/background(\d+)\/index\.m3u8$/);
    return m ? m[1] : null;
  }

  /** Safari 原生 HLS 的简单重试 */
  function attachNativeRetry(video, url) {
    var attempts = 0;
    video.addEventListener('error', function () {
      attempts++;
      if (attempts > CFG.retryMaxAttempts) {
        console.warn('[video-bg] 加载失败次数过多，放弃');
        video.remove();
        return;
      }
      var delay = Math.min(CFG.retryMaxDelayMs, CFG.retryBaseDelayMs * Math.pow(2, attempts - 1));
      console.warn('[video-bg] 加载错误，' + delay + 'ms 后重试（' + attempts + '/' + CFG.retryMaxAttempts + '）');
      setTimeout(function () {
        video.src = url;
        video.play().catch(function () {});
      }, delay);
    });
  }

  function getCachedVideo() {
    try {
      var raw = localStorage.getItem(CFG.cacheKey);
      if (!raw) return null;

      var data = JSON.parse(raw);
      if (typeof data !== 'object' || data === null) throw new Error('Invalid data');

      var video = data.video;
      var time = data.time;

      if (typeof video !== 'string' || !video) throw new Error('Invalid video');
      if (!isValidVideoUrl(video)) throw new Error('Invalid URL format');
      if (typeof time !== 'number' || time <= 0) throw new Error('Invalid time');
      if (time - Date.now() > 30 * 24 * 60 * 60 * 1000) throw new Error('Clock skew too large');
      if (Date.now() - time > CFG.cacheIntervalMs) return null;

      return video;
    } catch (err) {
      console.warn('[video-bg] 缓存异常，已清理:', err.message);
      try { localStorage.removeItem(CFG.cacheKey); } catch (_) {}
      return null;
    }
  }

  function isValidVideoUrl(url) {
    if (typeof url !== 'string') return false;

    // 从 CFG.videoBase 构建正则
    var escaped = CFG.videoBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var pattern = new RegExp('^' + escaped + 'background(\\d{1,3})\\/index\\.m3u8$');
    var match = url.match(pattern);
    if (!match) return false;

    var num = parseInt(match[1], 10);
    if (num < 1 || num > CFG.videoCount) return false;
    if (/[\x00-\x1F\x7F-\x9F\uFFFD]/.test(url)) return false;
    if (url.length > 500) return false;

    return true;
  }

  function pickAndCacheRandomVideo() {
    var video = Math.random() < CFG.eggProbability
      ? ''
      : sources[Math.floor(Math.random() * sources.length)];

    if (video) {
      try {
        localStorage.setItem(CFG.cacheKey, JSON.stringify({
          video: video,
          time: Date.now(),
          ttl: CFG.cacheIntervalMs
        }));
      } catch (err) {
        console.warn('[video-bg] 缓存失败:', err.message);
      }
    }
    return video;
  }

  function injectMinimalCSS() {
    try {
      var style = document.createElement('style');
      style.textContent =
        '#DynamicWallpaper{' +
        'position:fixed;inset:0;min-width:100vw;min-height:100vh;' +
        'object-fit:cover;z-index:-1;pointer-events:none}';
      document.head.appendChild(style);
    } catch (_) {}
  }

  /* ========================
   * 解除静音按钮（特殊视频）
   * ======================== */

  function mountUnmuteButton(video) {
    var isFirstUnmute = true;
    var hasUnmutedOnceByDoc = false;

    function showBanner() {
      if (!CFG.showFirstUnmuteBanner || !isFirstUnmute) return;
      var n = document.createElement('div');
      n.textContent = CFG.unmuteBannerText;
      n.style.cssText = [
        'position:fixed', 'bottom:80px', 'right:20px',
        'background:linear-gradient(135deg, rgba(255,0,0,0.2), rgba(0,255,0,0.2), rgba(0,0,255,0.2))',
        'backdrop-filter:blur(10px)', 'color:#FF69B4',
        'padding:8px 16px', 'border-radius:8px', 'z-index:9999',
        'font-size:12px', 'box-shadow:0 4px 15px rgba(0,0,0,0.2)',
        'border:1px solid rgba(255,255,255,0.2)'
      ].join(';');
      document.body.appendChild(n);
      setTimeout(function () { n.remove(); }, CFG.unmuteBannerDurationMs);
    }

    function toggleMute(ev) {
      if (ev) ev.stopPropagation();
      video.muted = !video.muted;
      btn.textContent = video.muted ? '🔇' : '🔊';
      btn.setAttribute('aria-pressed', String(!video.muted));
      if (!video.muted) {
        showBanner();
        video.play().catch(function () {});
        isFirstUnmute = false;
      }
    }

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'DynamicWallpaperUnmute';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', '切换背景视频静音状态');
    btn.textContent = video.muted ? '🔇' : '🔊';

    if (CFG.uiStyle === 'original') {
      btn.style.cssText = [
        'position:fixed', 'bottom:20px', 'right:120px',
        'background:rgba(255,255,255,0.3)', 'backdrop-filter:blur(10px)',
        'color:black', 'border:none', 'padding:8px 12px',
        'border-radius:50%', 'cursor:pointer', 'z-index:9999',
        'font-size:14px', 'box-shadow:0 2px 10px rgba(0,0,0,0.1)',
        'transition:opacity .3s ease', 'opacity:0.9'
      ].join(';');
      var hideTimeout;
      btn.addEventListener('mouseenter', function () { clearTimeout(hideTimeout); btn.style.opacity = '1'; });
      btn.addEventListener('mouseleave', function () { hideTimeout = setTimeout(function () { btn.style.opacity = '0'; }, 3000); });
    } else {
      btn.style.cssText = [
        'position:fixed', 'bottom:20px', 'right:20px',
        'background:rgba(0,0,0,0.5)', 'color:#fff',
        'border:1px solid rgba(255,255,255,0.3)', 'border-radius:8px',
        'padding:8px 10px', 'font-size:14px', 'cursor:pointer',
        'z-index:9999', 'backdrop-filter:blur(4px)',
        'transition:opacity .3s ease', 'opacity:0.9'
      ].join(';');
      btn.addEventListener('mouseenter', function () { btn.style.opacity = '1'; });
      btn.addEventListener('mouseleave', function () { btn.style.opacity = '0.9'; });
    }

    btn.addEventListener('click', toggleMute);

    if (CFG.autoUnmuteOnFirstClick) {
      document.addEventListener('click', function () {
        if (video.muted && !hasUnmutedOnceByDoc) {
          hasUnmutedOnceByDoc = true;
          toggleMute();
        }
      }, { passive: true });
    }

    document.body.appendChild(btn);
  }

  /* ========================
   * 彩蛋
   * ======================== */

  function showEgg(message, imageUrl) {
    var wrap = document.createElement('div');
    wrap.style.textAlign = 'center';
    wrap.style.marginTop = '20%';

    var p = document.createElement('p');
    p.textContent = message;
    var img = document.createElement('img');
    img.src = imageUrl;
    img.alt = '彩蛋图片';

    wrap.appendChild(p);
    wrap.appendChild(img);
    document.body.appendChild(wrap);
  }
})();
