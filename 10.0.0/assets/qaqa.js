/*标题卖萌*/
var OriginTitle = document.title;
var hiddenTimer, visibleTimer;
var isHidden = false;

document.addEventListener("visibilitychange", function() {
    if (document.hidden) {
        // 清除可能存在的显示计时器
        clearTimeout(visibleTimer);
        
        // 设置标记并启动隐藏计时器
        isHidden = true;
        hiddenTimer = setTimeout(function() {
            document.title = "Σ( ° △ °|||)网页已崩溃!";
        }, 1000);
    } else {
        // 清除隐藏计时器
        clearTimeout(hiddenTimer);
        
        // 只有在真正显示了"崩溃"标题或处于隐藏状态时才显示"回来了"
        if (document.title === "Σ( ° △ °|||)网页已崩溃!" || isHidden) {
            document.title = "(/≧▽≦/)你又回来了!";
            
            visibleTimer = setTimeout(function() {
                document.title = OriginTitle;
            }, 500);
        }
        
        // 重置隐藏标记
        isHidden = false;
    }
});