/* Tech Bros for Yeshua - motion and depth layer.
   Injected into previews (preview.html), client sites (site.html) and site exports.
   Adds: hero intro, scroll reveals with 3D tilt-in, image wipe + parallax, count-ups,
   card lift, pointer tilt, magnetic buttons with shine, dark-section spotlight, progress bar.
   Opt out per page with <html data-tb-motion="off">. Honors prefers-reduced-motion. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (window.__tbMotion) return;
  window.__tbMotion = true;

  // ---------- legibility guard: small text must reach 4.5:1, large text 3:1 ----------
  (function () {
    function parse(c) { var m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return null; var v = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; }
    function lin(x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }
    function L(c) { return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b); }
    function ratio(a, b) { var x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
    function over(top, base) { return { r: top.r * top.a + base.r * (1 - top.a), g: top.g * top.a + base.g * (1 - top.a), b: top.b * top.a + base.b * (1 - top.a), a: 1 }; }
    function mix(c, t, k) { return { r: c.r + (t - c.r) * k, g: c.g + (t - c.g) * k, b: c.b + (t - c.b) * k, a: c.a }; }
    function css(c) { return 'rgba(' + Math.round(c.r) + ',' + Math.round(c.g) + ',' + Math.round(c.b) + ',' + c.a + ')'; }
    // effective background, the element that paints it, or null when text sits on a photo
    function backdrop(el) {
      var layers = [], owner = null;
      for (var e = el; e; e = e.parentElement) {
        var s = getComputedStyle(e);
        if (s.backgroundImage !== 'none' && !/gradient/.test(s.backgroundImage)) return null;
        if (e !== document.body && e !== root && s.position !== 'static' && e.querySelector(':scope > img, :scope > picture, :scope > video')) return null;
        var c = parse(s.backgroundColor);
        if (c && c.a > 0) { if (!owner) owner = e; layers.push(c); if (c.a >= 0.95) break; }
        // a see-through fixed or sticky bar floats over changing content: leave it alone
        if (s.position === 'fixed' || s.position === 'sticky') return null;
      }
      var base = { r: 255, g: 255, b: 255, a: 1 };
      for (var i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
      return { c: base, owner: owner };
    }
    var all = document.querySelectorAll('body *');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (/^(SCRIPT|STYLE|SVG|svg|path|OPTION|TITLE)$/.test(el.tagName) || el.closest('[aria-hidden="true"], [data-tb-static]')) continue;
      var own = false;
      for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && n.nodeValue.trim()) { own = true; break; }
      if (!own) continue;
      var s = getComputedStyle(el), fg = parse(s.color);
      if (!fg || fg.a < 0.1 || /transparent|rgba\(0, 0, 0, 0\)/.test(s.webkitTextFillColor || '')) continue;
      var bd = backdrop(el); if (!bd) continue;
      var bg = bd.c, eff = over(fg, bg), size = parseFloat(s.fontSize), bold = parseFloat(s.fontWeight) >= 600;
      var need = (size >= 24 || (bold && size >= 18.66)) ? 3 : 4.5;
      if (ratio(eff, bg) >= need) continue;
      var lightText = L(eff) > L(bg), k;
      var ownerIsControl = bd.owner && bd.owner !== document.body && (bd.owner === el || el.closest('a, button') === bd.owner) && bd.owner.matches('a, button, [class*="btn"]');
      if (ownerIsControl && lightText) {
        // white text on a pale brand button: deepen the button rather than the text
        var b0 = parse(getComputedStyle(bd.owner).backgroundColor);
        for (k = 0.05; k <= 0.7; k += 0.05) { var nb = mix(b0, 0, k); if (ratio(over(fg, nb), nb) >= need) break; }
        var nbc = css(mix(b0, 0, Math.min(k, 0.7)));
        bd.owner.style.setProperty('background-color', nbc, 'important');
        if (getComputedStyle(bd.owner).borderColor === getComputedStyle(bd.owner).backgroundColor || parse(getComputedStyle(bd.owner).borderColor).a > 0) bd.owner.style.borderColor = nbc;
      } else {
        var target = L(bg) > 0.18 ? 0 : 255;
        for (k = 0.05; k <= 0.9; k += 0.05) if (ratio(over(mix(fg, target, k), bg), bg) >= need) break;
        el.style.setProperty('color', css(mix(fg, target, Math.min(k, 0.9))), 'important');
      }
    }
  })();

  // ---------- in-page links land below sticky or fixed top bars ----------
  function anchorOffset() {
    var bottom = 0;
    Array.prototype.forEach.call(document.querySelectorAll('body > *, body > * > *'), function (e) {
      var s = getComputedStyle(e);
      if (s.position !== 'fixed' && s.position !== 'sticky') return;
      var r = e.getBoundingClientRect();
      if (r.top <= 1 && r.height > 0 && r.height < 160 && r.width > innerWidth * 0.6) bottom = Math.max(bottom, r.bottom);
    });
    if (bottom) root.style.scrollPaddingTop = Math.round(bottom + 12) + 'px';
  }
  anchorOffset();
  window.addEventListener('scroll', function once() { anchorOffset(); window.removeEventListener('scroll', once); }, { passive: true });
  window.addEventListener('resize', anchorOffset);

  if (root.getAttribute('data-tb-motion') === 'off') return;
  if (!('IntersectionObserver' in window) || !window.requestAnimationFrame) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var EASE = 'cubic-bezier(.2,.7,.2,1)';

  // ---------- helpers ----------
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function cs(el) { return getComputedStyle(el); }
  function rgba(str) {
    var m = /rgba?\(([^)]+)\)/.exec(str || '');
    if (!m) return null;
    var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function lum(c) { return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255; }
  function inChrome(el) { return !!el.closest('header, nav, footer, .dock, [role="dialog"], [data-tb-static]'); }

  // accent colour: --accent, else first filled button, else neutral
  var accent = (cs(root).getPropertyValue('--accent') || '').trim();
  if (!accent) {
    $$('.btn, button, a[class*="btn"]').some(function (b) {
      var c = rgba(cs(b).backgroundColor);
      if (c && c.a > 0.5 && lum(c) > 0.08 && lum(c) < 0.92) { accent = cs(b).backgroundColor; return true; }
      return false;
    });
  }
  if (!accent) accent = '#888';
  var probe = document.createElement('i');
  probe.style.color = accent; document.body.appendChild(probe);
  var ac = rgba(cs(probe).color) || { r: 136, g: 136, b: 136 };
  probe.remove();
  var acRGB = ac.r + ',' + ac.g + ',' + ac.b;

  // ---------- styles ----------
  var css = '' +
    '[data-tbm]{transition:opacity .9s ' + EASE + ',transform 1.1s ' + EASE + ',filter .9s ' + EASE + ',clip-path 1.3s cubic-bezier(.7,0,.2,1)!important;will-change:opacity,transform}' +
    '[data-tbm="up"]{opacity:0;transform:translate3d(0,34px,0);filter:blur(6px)}' +
    '[data-tbm="tilt"]{opacity:0;transform:perspective(1000px) translate3d(0,46px,0) rotateX(16deg);transform-origin:50% 100%}' +
    '[data-tbm="side"]{opacity:0;transform:translate3d(-40px,0,0)}' +
    '[data-tbm="wipe"] img{clip-path:inset(100% 0 0 0);transition:clip-path 1.3s cubic-bezier(.7,0,.2,1),scale 1.6s ' + EASE + ',transform .7s ' + EASE + '!important}' +
    '[data-tbm="wipe"].tbm-in img{clip-path:inset(0 0 0 0)}' +
    '[data-tbm].tbm-in{opacity:1;transform:none;filter:none}' +
    '.tbm-px{scale:1.14;transition:scale 1.6s ' + EASE + ',transform .7s ' + EASE + '!important;will-change:translate}' +
    '[data-tbm="wipe"]:not(.tbm-in) .tbm-px{scale:1.38}' +
    '.tbm-w{display:inline-block;overflow:hidden;vertical-align:top;padding:0 .04em .14em;margin:0 -.04em -.14em}' +
    '.tbm-w>span{display:inline-block;transform:translate3d(0,108%,0) rotate(4deg);transform-origin:0 100%;transition:transform 1s ' + EASE + '}' +
    '.tbm-split.tbm-in .tbm-w>span{transform:none}' +
    '.tbm-lift{transition:transform .5s ' + EASE + ',box-shadow .5s ' + EASE + '}' +
    '.tbm-lift:hover{transform:translate3d(0,-8px,0);box-shadow:0 30px 60px -28px rgba(0,0,0,.38),0 10px 22px -16px rgba(0,0,0,.22)}' +
    '.tbm-tilt{transition:transform .6s ' + EASE + ',box-shadow .6s ' + EASE + ';transform-style:preserve-3d}' +
    '.tbm-tilt.tbm-on{transition:transform .12s linear,box-shadow .4s ' + EASE + ';box-shadow:0 40px 80px -36px rgba(0,0,0,.45)}' +
    '.tbm-btn{position:relative;overflow:hidden;isolation:isolate;transition-property:background,color,border-color,box-shadow,translate!important;transition-duration:.25s,.25s,.25s,.35s,.35s!important}' +
    '.tbm-btn:hover{box-shadow:0 14px 30px -14px rgba(' + acRGB + ',.75)}' +
    '.tbm-shine{position:absolute;top:0;bottom:0;left:-60%;width:45%;pointer-events:none;z-index:-1;background:linear-gradient(100deg,transparent,rgba(255,255,255,.38),transparent);transform:skewX(-18deg);transition:left .75s ' + EASE + '}' +
    '.tbm-btn:hover .tbm-shine{left:125%}' +
    '.tbm-bar{position:fixed;top:0;left:0;height:3px;width:100%;transform-origin:0 50%;transform:scaleX(0);background:linear-gradient(90deg,rgba(' + acRGB + ',.55),rgb(' + acRGB + '));z-index:2147483000;pointer-events:none;box-shadow:0 0 12px rgba(' + acRGB + ',.6)}' +
    '@media (pointer:coarse){a[href^="tel:"]:not([class*="btn"]),a[href^="mailto:"]:not([class*="btn"]){padding-block:10px;margin-block:-10px}}' +
    '@media print{[data-tbm],[data-tbm] img{opacity:1!important;transform:none!important;filter:none!important;clip-path:none!important}.tbm-bar{display:none}}';
  var style = document.createElement('style');
  style.setAttribute('data-tb-motion-css', '');
  style.textContent = css;
  (document.head || root).appendChild(style);

  // ---------- word split (keeps inline markup like <em>, <br>) ----------
  function split(el) {
    if (el.classList.contains('tbm-split') || el.textContent.length > 140) return false;
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.nodeValue.split(/(\s+)/), frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'tbm-w';
            var s = document.createElement('span'); s.textContent = p;
            s.style.transitionDelay = (i++ * 55) + 'ms';
            w.appendChild(s); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !/^(BR|SVG|IMG)$/.test(n.tagName)) walk(n);
      });
    })(el);
    el.classList.add('tbm-split');
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    return i;
  }

  // ---------- find hero and content ----------
  var scope = document.querySelector('main') || document.body;
  var sections = $$('section', scope).filter(function (s) { return !inChrome(s); });
  var hero = document.querySelector('.hero') || sections[0] || null;

  function clearLater(el, ms) {
    setTimeout(function () {
      el.removeAttribute('data-tbm');
      el.classList.remove('tbm-in');
      el.style.transitionDelay = '';
    }, ms);
  }
  function play(el, delay) {
    el.style.transitionDelay = delay + 'ms';
    if (el.getAttribute('data-tbm') === 'wipe') $$('img', el).forEach(function (i) { i.style.transitionDelay = delay + 'ms'; setTimeout(function () { i.style.transitionDelay = ''; }, delay + 1700); });
    el.classList.add('tbm-in');
    if (el.hasAttribute('data-tbm')) clearLater(el, delay + 1500);
  }

  // hero intro: headline words rise, then the rest follows
  if (hero) {
    var h1 = hero.querySelector('h1');
    var words = h1 ? split(h1) : 0;
    var t = words ? Math.min(words, 10) * 55 + 250 : 0;
    var follow = $$('h1 ~ *, .eyebrow, .kicker, [class*="sub"], [class*="lede"], .cta, [class*="proof"], [class*="trust"]', hero)
      .filter(function (el) { return el !== h1 && !el.contains(h1) && !(h1 && h1.contains(el)); });
    follow = follow.filter(function (el) { return !follow.some(function (o) { return o !== el && o.contains(el); }); });
    follow.forEach(function (el) { el.setAttribute('data-tbm', 'up'); });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (h1 && words) h1.classList.add('tbm-in');
        follow.forEach(function (el, n) { play(el, t + n * 110); });
      });
    });
  }

  // scroll reveals
  var TEXT = 'h2, h3, p, .kicker, blockquote, form, table';
  var CARD = 'article, details, figure, li, [class*="card"], [class*="step"], [class*="theme"], [class*="item"], [class*="tile"], [class*="opt"]';
  var picked = [];
  sections.forEach(function (sec) {
    if (sec === hero) return;
    var cands = $$(TEXT + ',' + CARD, sec);
    cands.forEach(function (el) {
      if (inChrome(el) || el.closest('.tbm-split')) return;
      // a wrapper around several cards is not a card: animate the cards instead
      if (el.matches(CARD) && $$(CARD, el).length >= 2) return;
      if (picked.some(function (p) { return p.contains(el); })) return;
      picked = picked.filter(function (p) { return !el.contains(p); });
      picked.push(el);
    });
  });
  picked.forEach(function (el) {
    var tag = el.tagName;
    if (tag === 'FIGURE' || (el.querySelector('img') && !el.textContent.trim())) el.setAttribute('data-tbm', 'wipe');
    else if (tag === 'H2' && split(el)) el.setAttribute('data-tbm-split', '');
    else if (el.matches(CARD)) el.setAttribute('data-tbm', 'tilt');
    else if (el.matches('.kicker')) el.setAttribute('data-tbm', 'side');
    else el.setAttribute('data-tbm', 'up');
  });

  var batch = [], flushing = false;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      batch.push(e.target);
    });
    if (!flushing && batch.length) {
      flushing = true;
      requestAnimationFrame(function () {
        batch.sort(function (a, b) {
          var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
          return (ra.top - rb.top) || (ra.left - rb.left);
        });
        batch.forEach(function (el, n) {
          if (el.hasAttribute('data-tbm-split')) { el.removeAttribute('data-tbm-split'); el.classList.add('tbm-in'); }
          else play(el, Math.min(n, 8) * 85);
        });
        batch = []; flushing = false;
      });
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  picked.forEach(function (el) { io.observe(el); });
  window.addEventListener('beforeprint', function () { picked.forEach(function (el) { el.classList.add('tbm-in'); }); });

  // ---------- parallax images (only where the frame clips them) ----------
  var px = [];
  $$('img').forEach(function (img) {
    if (inChrome(img)) return;
    var fit = cs(img).objectFit;
    if (fit !== 'cover') return;
    var frame = img.parentElement, ok = false;
    for (var k = 0; k < 2 && frame && frame !== document.body; k++, frame = frame.parentElement) {
      var o = cs(frame).overflow + ' ' + cs(frame).overflowY;
      if (/hidden|clip/.test(o)) { ok = true; break; }
    }
    if (!ok) return;
    img.classList.add('tbm-px');
    px.push({ el: img, frame: frame, on: false, k: 0.06 });
  });
  var pio = new IntersectionObserver(function (es) {
    es.forEach(function (e) { px.forEach(function (p) { if (p.frame === e.target) p.on = e.isIntersecting; }); });
    tick();
  });
  px.forEach(function (p) { pio.observe(p.frame); });

  // ---------- count-ups ----------
  var NUM = /^(\d{1,3}(?:,\d{3})*(?:\.\d+)?)(\+|%|\s?stars?|\s?★)?$/i;
  $$('strong, b, span, div, p, dt, dd, h3, h4').forEach(function (el) {
    if (el.children.length || inChrome(el) || el.closest('a')) return;
    var txt = el.textContent.trim(), m = NUM.exec(txt);
    if (!m || /^0\d/.test(m[1])) return;
    var target = parseFloat(m[1].replace(/,/g, ''));
    var dec = (m[1].split('.')[1] || '').length;
    if (!dec && target < 10) return;
    var suffix = m[2] || '';
    var cio = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      cio.disconnect();
      var start = performance.now(), dur = 1600;
      el.style.fontVariantNumeric = 'tabular-nums';
      (function step(now) {
        var q = Math.min(1, (now - start) / dur), v = target * (1 - Math.pow(1 - q, 4));
        el.textContent = (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US')) + suffix;
        if (q < 1) requestAnimationFrame(step); else el.textContent = txt;
      })(start);
    }, { threshold: 0.6 });
    cio.observe(el);
  });

  // ---------- cards: lift on hover ----------
  $$(CARD, scope).forEach(function (el) {
    if (inChrome(el) || el.tagName === 'FIGURE' || el.tagName === 'DETAILS') return;
    var s = cs(el), bg = rgba(s.backgroundColor);
    var boxed = (bg && bg.a > 0.05) || parseFloat(s.borderRadius) > 0 || s.boxShadow !== 'none';
    if (boxed && el.offsetWidth < (scope.clientWidth * 0.7)) el.classList.add('tbm-lift');
  });

  // ---------- pointer-only: tilt, magnetic buttons, spotlight ----------
  $$('.btn, button[type="submit"], a[class*="btn"]').forEach(function (b) {
    if (cs(b).position !== 'static' && cs(b).position !== 'relative') return;
    if (b.closest('.dock')) return;
    b.classList.add('tbm-btn');
    var sh = document.createElement('span'); sh.className = 'tbm-shine'; sh.setAttribute('aria-hidden', 'true');
    b.appendChild(sh);
    if (!fine) return;
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      b.style.translate = ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px';
    });
    b.addEventListener('pointerleave', function () { b.style.translate = ''; });
  });

  if (fine) {
    var tilts = $$('figure', scope).concat($$('.tbm-lift', scope)).filter(function (el) {
      return !inChrome(el) && el.offsetWidth > 120 && el.offsetWidth < scope.clientWidth * 0.75;
    });
    tilts.forEach(function (el) {
      el.classList.add('tbm-tilt');
      el.addEventListener('pointermove', function (e) {
        if (el.hasAttribute('data-tbm')) return;
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.classList.add('tbm-on');
        el.style.transform = 'perspective(900px) rotateX(' + (-y * 7).toFixed(2) + 'deg) rotateY(' + (x * 9).toFixed(2) + 'deg) translateZ(0)';
      });
      el.addEventListener('pointerleave', function () { el.classList.remove('tbm-on'); el.style.transform = ''; });
    });

    sections.forEach(function (sec) {
      var c = rgba(cs(sec).backgroundColor);
      if (!c || c.a < 0.5 || lum(c) > 0.3) return;
      var base = cs(sec).backgroundImage;
      var glow = 'radial-gradient(520px circle at var(--tbm-x,50%) var(--tbm-y,-20%), rgba(' + acRGB + ',.22), transparent 65%)';
      sec.style.backgroundImage = base && base !== 'none' ? glow + ',' + base : glow;
      sec.addEventListener('pointermove', function (e) {
        var r = sec.getBoundingClientRect();
        sec.style.setProperty('--tbm-x', (e.clientX - r.left) + 'px');
        sec.style.setProperty('--tbm-y', (e.clientY - r.top) + 'px');
      });
    });
  }

  // ---------- scroll progress + parallax loop ----------
  var bar = document.createElement('div');
  bar.className = 'tbm-bar'; bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var queued = false;
  function tick() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      var vh = window.innerHeight, max = root.scrollHeight - vh;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
      px.forEach(function (p) {
        if (!p.on) return;
        var r = p.frame.getBoundingClientRect();
        var mid = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
        p.el.style.translate = '0 ' + (-mid * r.height * p.k).toFixed(1) + 'px';
      });
    });
  }
  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', tick);
  tick();
})();
