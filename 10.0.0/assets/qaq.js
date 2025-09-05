/* 标题卖萌增强版 + 反油猴检测（无闪屏版） */
(function(){
    var OriginTitle = document.title;
    var hiddenTimer, visibleTimer;
    var MIN_HIDE_TIME = 3000;            // 你的阈值
    var SUSPECT = false;                  // 是否疑似被脚本拦截
    var STATE = { isHidden:false, hiddenAt:0 }; // 统一隐藏状态（事件/rAF 都改它）
  
    // —— 可疑性探测（同前）——
    try {
      var ok = false;
      var probe = function(){ ok = true; };
      document.addEventListener('visibilitychange', probe, { once:true, capture:true });
      try { document.dispatchEvent(new Event('visibilitychange')); } catch(_) {}
      var ownHidden = Object.getOwnPropertyDescriptor(document,'hidden');
      var ownVS     = Object.getOwnPropertyDescriptor(document,'visibilityState');
      SUSPECT = (!ok) || !!ownHidden || !!ownVS;
    } catch(_) { SUSPECT = true; }
  
    // —— 公用：进入/退出隐藏时做的事 —— 
    function scheduleCrashTitle(){
      clearTimeout(visibleTimer);
      clearTimeout(hiddenTimer);
      // 关键：只有“仍处于隐藏态”才允许把标题改成崩溃，避免回前台后补触发
      hiddenTimer = setTimeout(function(){
        if (STATE.isHidden) {
          document.title = "Σ( ° △ °|||)网页已崩溃!";
        }
      }, 1000);
    }
    function showBackTitle(suspect){
      clearTimeout(hiddenTimer);
      document.title = suspect ? "你开挂了？( ￢_￢ )" : "(/≧▽≦/)你又回来了!";
      visibleTimer = setTimeout(function(){
        if (document.visibilityState === 'visible') document.title = OriginTitle;
      }, 1500);
    }
  
    // —— 事件路径（正常环境下走这里）——
    document.addEventListener("visibilitychange", function() {
      if (document.hidden) {
        STATE.isHidden = true;
        STATE.hiddenAt = Date.now();
        scheduleCrashTitle();
      } else {
        var leftLongEnough = Date.now() - STATE.hiddenAt > MIN_HIDE_TIME;
        if (leftLongEnough || document.title === "Σ( ° △ °|||)网页已崩溃!") {
          showBackTitle(SUSPECT);
        }
        STATE.isHidden = false;
      }
    });
  
    // —— rAF 看门狗（可疑环境下启用）——
    if (SUSPECT) {
      var last = performance.now();
      var GAP_MS = 2000; // 相邻帧>2s 视为“后台/冻结”
      function loop(now){
        var gap = now - last;
        if (gap > GAP_MS) {
          STATE.isHidden = true;
          STATE.hiddenAt = now;
          scheduleCrashTitle();
        } else if (STATE.isHidden && (now - STATE.hiddenAt) > MIN_HIDE_TIME) {
          STATE.isHidden = false;
          showBackTitle(true); // 可疑环境：直接给“你开挂了？”
        }
        last = now;
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    }
  })();  