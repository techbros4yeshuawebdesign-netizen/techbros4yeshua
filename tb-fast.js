/* Tech Bros for Yeshua - page speed pass, run on a page's HTML before it is shown.
   Unsplash photos get responsive sizes (phones download small files, big screens get sharp ones),
   a tiny placeholder for an instant blurred first paint, and the hero photo is preloaded. */
(function () {
  'use strict';
  var WIDTHS = [480, 768, 1080, 1440, 1920];
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }

  window.tbOptimize = function (html) {
    if (typeof html !== 'string' || !html) return html;
    var first = true, preload = '';
    html = html.replace(/<img\b[^>]*>/gi, function (tag) {
      var m = /\ssrc=(["'])(https:\/\/images\.unsplash\.com\/[^"']+)\1/i.exec(tag);
      var isFirst = first; first = false;
      if (!m || /\ssrcset=/i.test(tag)) return tag;
      var u;
      try { u = new URL(m[2].replace(/&amp;/g, '&')); } catch (e) { return tag; }
      var w0 = parseInt(u.searchParams.get('w'), 10) || 0, h0 = parseInt(u.searchParams.get('h'), 10) || 0;
      var hero = /fetchpriority\s*=\s*["']?high/i.test(tag) || (isFirst && !/loading\s*=\s*["']?lazy/i.test(tag));
      if (!u.searchParams.get('auto')) u.searchParams.set('auto', 'format');
      if (!u.searchParams.get('fit')) u.searchParams.set('fit', 'crop');
      u.searchParams.set('q', '72');
      function at(w, q) {
        var v = new URL(u.toString());
        v.searchParams.set('w', String(w));
        if (q) v.searchParams.set('q', String(q));
        if (h0 && w0) v.searchParams.set('h', String(Math.round(h0 * w / w0)));
        return v.toString();
      }
      var set = WIDTHS.map(function (w) { return at(w) + ' ' + w + 'w'; }).join(', ');
      var sizes = hero ? '100vw' : '(max-width: 760px) 100vw, 50vw';
      var extra = ' srcset="' + esc(set) + '" sizes="' + sizes + '" data-tb-tiny="' + esc(at(24, 30)) + '"';
      if (hero) {
        extra += ' data-tb-hero';
        if (!/fetchpriority/i.test(tag)) extra += ' fetchpriority="high"';
        if (!preload) preload = '<link rel="preload" as="image" imagesrcset="' + esc(set) + '" imagesizes="100vw" fetchpriority="high">';
      }
      return tag.replace(/\s*(\/?)>$/, function (_, slash) { return extra + slash + '>'; });
    });
    var head = '<link rel="preconnect" href="https://images.unsplash.com">' + preload;
    if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, function (h) { return h + head; });
    return head + html;
  };
})();
