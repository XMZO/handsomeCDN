/* 打字动效 */
(function webpackUniversalModuleDefinition(a, b) {
  if (typeof exports === "object" && typeof module === "object") {
    module.exports = b();
  } else {
    if (typeof define === "function" && define.amd) {
      define([], b);
    } else {
      if (typeof exports === "object") {
        exports["POWERMODE"] = b();
      } else {
        a["POWERMODE"] = b();
      }
    }
  }
})(this, function () {
  return (function (a) {
    var b = {};
    function c(e) {
      if (b[e]) {
        return b[e].exports;
      }
      var d = (b[e] = { exports: {}, id: e, loaded: false });
      a[e].call(d.exports, d, d.exports, c);
      d.loaded = true;
      return d.exports;
    }
    c.m = a;
    c.c = b;
    c.p = "";
    return c(0);
  })([
    function (c, g, b) {
      var d = document.createElement("canvas");
      d.width = window.innerWidth;
      d.height = window.innerHeight;
      d.style.cssText =
        "position:fixed;top:0;left:0;pointer-events:none;z-index:999999";
      window.addEventListener("resize", function () {
        d.width = window.innerWidth;
        d.height = window.innerHeight;
      });
      document.body.appendChild(d);
      d.style.display = 'none'; // <--- 新增：默认隐藏 canvas
      var a = d.getContext("2d");
      var n = [];
      var j = 0;
      var k = 120;
      var f = k;
      var p = false;
      o.shake = true;
      function l(r, q) {
        return Math.random() * (q - r) + r;
      }
      function m(r) {
        if (o.colorful) {
          var q = l(0, 360);
          return (
            "hsla(" +
            l(q - 10, q + 10) +
            ", 100%, " +
            l(50, 80) +
            "%, " +
            1 +
            ")"
          );
        } else {
          return window.getComputedStyle(r).color;
        }
      }
      function e() {
        var t = document.activeElement;
        var v;
        if (
          t.tagName === "TEXTAREA" ||
          (t.tagName === "INPUT" && t.getAttribute("type") === "text")
        ) {
          var u = b(1)(t, t.selectionStart);
          v = t.getBoundingClientRect();
          return { x: u.left + v.left, y: u.top + v.top, color: m(t) };
        }
        var s = window.getSelection();
        if (s.rangeCount) {
          var q = s.getRangeAt(0);
          var r = q.startContainer;
          if (r.nodeType === document.TEXT_NODE) {
            r = r.parentNode;
          }
          v = q.getBoundingClientRect();
          return { x: v.left, y: v.top, color: m(r) };
        }
        return { x: 0, y: 0, color: "transparent" };
      }
      function h(q, s, r) {
        return {
          x: q,
          y: s,
          alpha: 1,
          color: r,
          velocity: { x: -1 + Math.random() * 2, y: -3.5 + Math.random() * 2 },
        };
      }
      function o() {
        d.style.display = ''; // <--- 新增：显示 canvas (或者 'block'，取决于原始 display 值)
        var t = e();
        var s = 5 + Math.round(Math.random() * 10);
        while (s--) {
          n[j] = h(t.x, t.y, t.color);
          j = (j + 1) % 500;
        }
        f = k;
        if (!p) {
          requestAnimationFrame(i);
        }
        if (o.shake) {
          var r = 1 + 2 * Math.random();
          var q = r * (Math.random() > 0.5 ? -1 : 1);
          var u = r * (Math.random() > 0.5 ? -1 : 1);
          document.body.style.marginLeft = q + "px";
          document.body.style.marginTop = u + "px";
          setTimeout(function () {
            document.body.style.marginLeft = "";
            document.body.style.marginTop = "";
          }, 75);
        }
      }
      o.colorful = false;
      function i() {
        if (f > 0) {
          requestAnimationFrame(i);
          f--;
          p = true;
        } else {
          p = false;
          d.style.display = 'none'; // <--- 新增：动画结束时隐藏 canvas
        }
        a.clearRect(0, 0, d.width, d.height);
        for (var q = 0; q < n.length; ++q) {
          var r = n[q];
          if (r.alpha <= 0.1) {
            continue;
          }
          r.velocity.y += 0.075;
          r.x += r.velocity.x;
          r.y += r.velocity.y;
          r.alpha *= 0.96;
          a.globalAlpha = r.alpha;
          a.fillStyle = r.color;
          a.fillRect(Math.round(r.x - 1.5), Math.round(r.y - 1.5), 3, 3);
        }
      }
      requestAnimationFrame(i);
      c.exports = o;
    },
    function (b, a) {
      (function () {
        var d = [
          "direction",
          "boxSizing",
          "width",
          "height",
          "overflowX",
          "overflowY",
          "borderTopWidth",
          "borderRightWidth",
          "borderBottomWidth",
          "borderLeftWidth",
          "borderStyle",
          "paddingTop",
          "paddingRight",
          "paddingBottom",
          "paddingLeft",
          "fontStyle",
          "fontVariant",
          "fontWeight",
          "fontStretch",
          "fontSize",
          "fontSizeAdjust",
          "lineHeight",
          "fontFamily",
          "textAlign",
          "textTransform",
          "textIndent",
          "textDecoration",
          "letterSpacing",
          "wordSpacing",
          "tabSize",
          "MozTabSize",
        ];
        var e = window.mozInnerScreenX != null;
        function c(k, l, o) {
          var h = (o && o.debug) || false;
          if (h) {
            var i = document.querySelector(
              "#input-textarea-caret-position-mirror-div",
            );
            if (i) {
              i.parentNode.removeChild(i);
            }
          }
          var f = document.createElement("div");
          f.id = "input-textarea-caret-position-mirror-div";
          document.body.appendChild(f);
          var g = f.style;
          var j = window.getComputedStyle
            ? getComputedStyle(k)
            : k.currentStyle;
          g.whiteSpace = "pre-wrap";
          if (k.nodeName !== "INPUT") {
            g.wordWrap = "break-word";
          }
          g.position = "absolute";
          if (!h) {
            g.visibility = "hidden";
          }
          d.forEach(function (p) {
            g[p] = j[p];
          });
          if (e) {
            if (k.scrollHeight > parseInt(j.height)) {
              g.overflowY = "scroll";
            }
          } else {
            g.overflow = "hidden";
          }
          f.textContent = k.value.substring(0, l);
          if (k.nodeName === "INPUT") {
            f.textContent = f.textContent.replace(/\s/g, "\u00a0");
          }
          var n = document.createElement("span");
          n.textContent = k.value.substring(l) || ".";
          f.appendChild(n);
          var m = {
            top: n.offsetTop + parseInt(j["borderTopWidth"]),
            left: n.offsetLeft + parseInt(j["borderLeftWidth"]),
          };
          if (h) {
            n.style.backgroundColor = "#aaa";
          } else {
            document.body.removeChild(f);
          }
          return m;
        }
        if (typeof b != "undefined" && typeof b.exports != "undefined") {
          b.exports = c;
        } else {
          window.getCaretCoordinates = c;
        }
      })();
    },
  ]);
});
POWERMODE.colorful = true;
POWERMODE.shake = false;
document.body.addEventListener("input", POWERMODE);