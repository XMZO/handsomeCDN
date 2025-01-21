/*标题卖萌*/
var OriginTitile = document.title,
titleTime;
document.addEventListener("visibilitychange",
function() {
    if (document.hidden) {
        document.title = "网页已崩溃！";
        clearTimeout(titleTime)
    } else {
        document.title = "(/≧▽≦/)你又回来了！ " ;
        titleTime = setTimeout(function() {
            document.title = OriginTitile
        },
        2000)
    }
});