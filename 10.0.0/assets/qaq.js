/* 标题卖萌增强版：加最短离开时间判断 */
var OriginTitle = document.title;
var hiddenTimer, visibleTimer;
var isHidden = false;
var hideAt = 0; // 记录隐藏开始的时间戳
var MIN_HIDE_TIME = 3000; // 阈值，毫秒

document.addEventListener("visibilitychange", function() {
    if (document.hidden) {
        clearTimeout(visibleTimer);
        isHidden = true;
        hideAt = Date.now();
        hiddenTimer = setTimeout(function() {
            document.title = "Σ( ° △ °|||)网页已崩溃!";
        }, 1000);
    } else {
        clearTimeout(hiddenTimer);
        // 只有在显示过"崩溃"标题 或 隐藏时间超过阈值 时才显示"回来了"
        if (
            document.title === "Σ( ° △ °|||)网页已崩溃!" ||
            (isHidden && Date.now() - hideAt > MIN_HIDE_TIME)
        ) {
            document.title = "(/≧▽≦/)你又回来了!";
            visibleTimer = setTimeout(function() {
                document.title = OriginTitle;
            }, 1500);
        }
        isHidden = false;
    }
});
