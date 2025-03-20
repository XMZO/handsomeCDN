/* 视频背景 */
(function(){
    const isMobileOrTablet = document.body.clientWidth < 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isCrawler = /Googlebot|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|Chrome-Lighthouse|HeadlessChrome|PhantomJS|facebot|ia_archiver/i.test(navigator.userAgent);
    // 获取平台信息（通过 sec-ch-ua-platform）
    const platform = navigator.userAgentData ? navigator.userAgentData.platform : navigator.platform;
    // 判断是否是 Android、Linux 或 苹果设备
    const isAndroidOrLinuxOrApple = /Android|Linux|iPhone|iPad|iPod/i.test(platform);
    if (isMobileOrTablet || isCrawler || isAndroidOrLinuxOrApple) return; // 移动设备、爬虫或指定平台直接退出
const videoConfig={
        sources:Array.from({length:85},(_,i)=>`https://cdn.loli-moe.com/videos/background${i+1}.webm`),
        interval:3600000, // 1小时
        eggImage:"https://cdn.loli-moe.com/imgs/H.webp",
        eggMessage:"🎉 恭喜发现彩蛋！🥵🥵🥵",
        specialVideos: [60, 80, 81].map(num => `https://cdn.loli-moe.com/videos/background${num}.webm`)
    };
    const getRandomVideo=sources=>Math.random()<0.01?"":sources[Math.floor(Math.random()*sources.length)];
    const loadVideoData=(sources,interval)=>{
        const storedData=JSON.parse(localStorage.getItem("randomVideoData")||"{}");
        const currentTime=Date.now();
        if(!storedData.video||currentTime-storedData.time>interval){
            const video=getRandomVideo(sources);
            localStorage.setItem("randomVideoData",JSON.stringify({video,time:currentTime}));
            return video;
        }
        return storedData.video;
    };
    const video=loadVideoData(videoConfig.sources,videoConfig.interval);
    if(video){

        // 预加载视频资源
        const preloadLink = document.createElement("link");
        preloadLink.rel = "preload";
        preloadLink.as = "video";
        preloadLink.href = video;
        document.head.appendChild(preloadLink);

        const DynamicWallpaper=document.createElement("video");
        DynamicWallpaper.id="DynamicWallpaper";
        DynamicWallpaper.src=video;
        DynamicWallpaper.autoplay=true;
        DynamicWallpaper.muted=true;
        DynamicWallpaper.loop=true;
        DynamicWallpaper.preload="auto";
        DynamicWallpaper.playbackRate=1;
        DynamicWallpaper.load();
        DynamicWallpaper.play();

// 只有特定视频才添加点击解除静音的功能
// 当时怎么想的搞这个逆天加密😅现在自己都不敢动了
eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('8 $d=$d||{};$d.X={};$d.Y=5(a){g a.s=a};$d.Z=5(a,b){a.s=b;g a};t(10.11.12(13)){8 k=5(){9.c=!9.c;4.l=9.c?"\\e\\u":"\\e\\v";t(!9.c&&m){8 a=f.w("14");a.l="\\e\\15 \\16\\17\\18\\19\\1a\\1b\\1c\\1d\\1e\\1f\\1g\\1h\\1i\\1j\\1k";a.h.x="y:A;B:1l;C:D;E:1m-1n(1o,7(6,0,0,0.2),7(0,6,0,0.2),7(0,0,6,0.2));F-G:H(n);I:#1p;J:o 1q;i-K:o;z-L:M;N-O:P;Q-R:0 1r 1s 7(0,0,0,0.2);i:1t 1u 7(6,6,6,0.2);";f.S.T(a);U(5(){g a.1v()},V);m=!1}},4=f.w("1w");4.l=9.c?"\\e\\u":"\\e\\v";4.h.x="y:A;B:D;C:1x;E:7(6,6,6,0.3);F-G:H(n);I:1y;i:1z;J:o P;i-K:1A%;1B:1C;z-L:M;N-O:1D;Q-R:0 1E n 7(0,0,0,0.1);1F:p 0.1G 1H;";f.S.T(4);8 q;4.j("1I",5(){1J(q);4.h.p="1"});4.j("1K",5(){q=U(5(){g 4.h.p="0"},V)});8 m=!0;4.j("W",5(a){a.1L();k()});8 r=!1;f.j("W",5(){9.c&&!r&&(k(),r=!0)})};',62,110,'||||muteButton|function|255|rgba|var|DynamicWallpaper|||muted|jscomp|ud83d|document|return|style|border|addEventListener|toggleMute|textContent|isFirstUnmute|10px|8px|opacity|hideTimeout|hasUnmuted|raw|if|udd07|udd0a|createElement|cssText|position||fixed|bottom|right|20px|background|backdrop|filter|blur|color|padding|radius|index|9999|font|size|12px|box|shadow|body|appendChild|setTimeout|3E3|click|scope|createTemplateTagFirstArg|createTemplateTagFirstArgWithRaw|videoConfig|specialVideos|includes|video|div|ude2e|u53d1|u73b0|u7279|u6b8a|u52a8|u6001|u80cc|u666f|uff0c|u5df2|u5f00|u542f|u58f0|u97f3|uff01|80px|linear|gradient|135deg|FF69B4|16px|4px|15px|1px|solid|remove|button|120px|black|none|50|cursor|pointer|14px|2px|transition|3s|ease|mouseenter|clearTimeout|mouseleave|stopPropagation'.split('|'),0,{}))
// 解除静音功能结束

// 点击任何地方播放视频的功能
document.addEventListener('click', function() {
    // 获取视频元素
    const videoElement = document.querySelector('video');
    if (videoElement && videoElement.paused) {
        videoElement.play(); // 播放视频
    }
});
// 播放视频功能结束

        DynamicWallpaper.addEventListener("error",()=>{
            console.log("网络波动，重新加载视频...");
            DynamicWallpaper.load();
            DynamicWallpaper.play();
        });
        document.body.appendChild(DynamicWallpaper);
    }else{
        console.log("🎉 彩蛋：本次无视频壁纸！🥳");
        const eggElement=document.createElement("div");
        eggElement.innerHTML=`<p>${videoConfig.eggMessage}</p><img src='${videoConfig.eggImage}' alt='彩蛋图片'>`;
        eggElement.style.textAlign="center";
        eggElement.style.marginTop="20%";
        document.body.appendChild(eggElement);
    }
})();
/* 视频背景 END */