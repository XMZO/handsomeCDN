/*标题卖萌*/
var OriginTitle = document.title,
    titleTime;
document.addEventListener("visibilitychange", function() {
    if (document.hidden) {
        titleTime = setTimeout(function() {
            document.title = "Σ( ° △ °|||)网页已崩溃!";
        }, 1000);
    } else {
        // 清除之前的定时器
        clearTimeout(titleTime);
        document.title = "(/≧▽≦/)你又回来了!";
        titleTime = setTimeout(function() {
            document.title = OriginTitle;
        }, 2000);
    }
});