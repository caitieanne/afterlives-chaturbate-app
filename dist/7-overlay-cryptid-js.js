// The cryptid's console: a bubbly see-through plastic handheld that the cryptid lives inside, in one of seven shapes (coffin, crescent moon,
// heart, star, box, diamond, circle) and ten colors (the same ones as the Afterlives game's console). Drawn by this script as SVG, no images.
// Each shape is the outline of the screen; the plastic is that same outline drawn with a thick, round-jointed stroke, so every shape gets
// an even, bubbly band of plastic all round, however pointy it is.
// The screen shows a placeholder dusk sky for now: the official screen art goes in the BACKDROP part below.

var AfterlivesConsole = (function () {
  // ---- colors (names and plastic tones from the game's console colors) ----
  var COLORS = [
    { id: 'cauldron', hex: '#2b2b36', dark: true },
    { id: 'nessie', hex: '#18b2c6' },
    { id: 'gloomberry', hex: '#3f64e0' },
    { id: 'coven', hex: '#8a47d6' },
    { id: 'ghoul_gum', hex: '#ff6fb5' },
    { id: 'vampire', hex: '#e93d58' },
    { id: 'pumpkin', hex: '#ff8a1f' },
    { id: 'slime', hex: '#7fd02e' },
    { id: 'tombstone', hex: '#6d7280' },
    { id: 'ghost', hex: '#bfe4ff' },
  ];

  function hexToHsl(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255;
    var g = parseInt(hex.slice(3, 5), 16) / 255;
    var b = parseInt(hex.slice(5, 7), 16) / 255;
    var mx = Math.max(r, g, b);
    var mn = Math.min(r, g, b);
    var l = (mx + mn) / 2;
    var h = 0;
    var s = 0;
    var d = mx - mn;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  }
  function hslToRgb(h, s, l) {
    var S = s / 100;
    var L = l / 100;
    var a = S * Math.min(L, 1 - L);
    function f(n) {
      var k = (n + h / 30) % 12;
      return Math.round((L - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))) * 255);
    }
    return [f(0), f(8), f(4)];
  }
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }
  function rgba(c, a) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }
  function mix(a, b, t) {
    return [Math.round(a[0] * t + b[0] * (1 - t)), Math.round(a[1] * t + b[1] * (1 - t)), Math.round(a[2] * t + b[2] * (1 - t))];
  }

  /** A color by its name ("coven", "ghoul gum", "Ghoul_Gum" all work), or Coven. */
  function colorOf(name) {
    var key = String(name || '').toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_|_$/g, '');
    for (var i = 0; i < COLORS.length; i++) if (COLORS[i].id === key) return COLORS[i];
    return COLORS[3];
  }

  /** The plastic's tones for a color: highlight, mid and shadow (see-through), the rim, and the deep bezel color. */
  function tonesFor(color) {
    var hsl = hexToHsl(color.hex);
    var s = color.dark ? 12 : hsl.s;
    var l = color.dark ? 24 : hsl.l;
    var hi = hslToRgb(hsl.h, s, clamp(l + 24, 0, 96));
    var mid = hslToRgb(hsl.h, s, l);
    var lo = hslToRgb(hsl.h, s, clamp(l - 20, 4, 100));
    var deep = hslToRgb(hsl.h, s, clamp(l - 38, 6, 24));
    return { hi: rgba(hi, 0.86), mid: rgba(mid, 0.76), lo: rgba(lo, 0.88), ring: rgba(mix(hi, [255, 255, 255], 0.78), 0.9), deep: rgba(deep, 1), glow: rgba(mid, 0.55) };
  }

  // ---- shapes ----
  // Paths are lists of commands and numbers (['M', x, y, 'L', x, y, ...]) in the shape's own units, so they can be scaled to any size.

  /** A closed path through corners, each corner rounded by up to `r`. */
  function poly(pts, r) {
    var out = [];
    var n = pts.length;
    for (var i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n];
      var p1 = pts[i];
      var p2 = pts[(i + 1) % n];
      var l1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      var l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      var rr = Math.min(r, l1 / 2.2, l2 / 2.2);
      if (rr < 0.5) {
        out.push(i === 0 ? 'M' : 'L', p1[0], p1[1]);
        continue;
      }
      out.push(i === 0 ? 'M' : 'L', p1[0] + ((p0[0] - p1[0]) / l1) * rr, p1[1] + ((p0[1] - p1[1]) / l1) * rr);
      out.push('Q', p1[0], p1[1], p1[0] + ((p2[0] - p1[0]) / l2) * rr, p1[1] + ((p2[1] - p1[1]) / l2) * rr);
    }
    out.push('Z');
    return out;
  }

  /** A fat crescent: a disc with a smaller disc bitten out of its upper right. */
  function crescent() {
    var c1 = [50, 50, 50];
    var c2 = [80, 30, 38];
    var outer = [];
    var inner = [];
    var N = 96;
    var a0 = Math.atan2(c2[1] - c1[1], c2[0] - c1[0]);
    for (var i = 0; i <= N; i++) {
      var a = a0 + (i / N) * Math.PI * 2;
      var x = c1[0] + Math.cos(a) * c1[2];
      var y = c1[1] + Math.sin(a) * c1[2];
      if (Math.hypot(x - c2[0], y - c2[1]) > c2[2]) outer.push([x, y]);
    }
    var b0 = Math.atan2(c1[1] - c2[1], c1[0] - c2[0]) + Math.PI;
    for (var j = 0; j <= N; j++) {
      var b = b0 + (j / N) * Math.PI * 2;
      var bx = c2[0] + Math.cos(b) * c2[2];
      var by = c2[1] + Math.sin(b) * c2[2];
      if (Math.hypot(bx - c1[0], by - c1[1]) < c1[2]) inner.push([bx, by]);
    }
    // the bite runs back from where the outer edge ends to where it began
    var last = outer[outer.length - 1];
    if (Math.hypot(inner[0][0] - last[0], inner[0][1] - last[1]) > Math.hypot(inner[inner.length - 1][0] - last[0], inner[inner.length - 1][1] - last[1])) inner.reverse();
    return poly(outer.concat(inner), 0);
  }

  function star() {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + (i * Math.PI) / 5;
      var r = i % 2 ? 29 : 50;
      pts.push([50 + Math.cos(a) * r - 2.45, 50 + Math.sin(a) * r]);
    }
    return poly(pts, 4);
  }

  // safe: where the cryptid fits wholly inside the screen [left, top, right, bottom] as fractions; pill: where the name pill's middle sits
  var SHAPES = {
    coffin: { w: 78, h: 100, path: poly([[21, 0], [57, 0], [78, 25], [61.6, 100], [16.4, 100], [0, 25]], 7), safe: [0.22, 0.12, 0.78, 0.74], pill: [0.5, 0.85] },
    moon: { w: 100, h: 100, path: crescent(), safe: [0.12, 0.47, 0.45, 0.81], pill: [0.5, 0.9] },
    heart: {
      w: 100,
      h: 90,
      path: ['M', 50, 88, 'C', 20, 66, 2, 48, 2, 28, 'C', 2, 12, 14, 2, 28, 2, 'C', 38, 2, 46, 8, 50, 16, 'C', 54, 8, 62, 2, 72, 2, 'C', 86, 2, 98, 12, 98, 28, 'C', 98, 48, 80, 66, 50, 88, 'Z'],
      safe: [0.24, 0.16, 0.76, 0.62],
      pill: [0.5, 0.72],
    },
    star: { w: 95.1, h: 90.5, path: star(), safe: [0.33, 0.36, 0.67, 0.73], pill: [0.5, 0.82] },
    box: { w: 100, h: 76, path: ['M', 14, 0, 'L', 86, 0, 'Q', 100, 0, 100, 14, 'L', 100, 62, 'Q', 100, 76, 86, 76, 'L', 14, 76, 'Q', 0, 76, 0, 62, 'L', 0, 14, 'Q', 0, 0, 14, 0, 'Z'], safe: [0.12, 0.08, 0.88, 0.76], pill: [0.5, 0.87] },
    diamond: { w: 84, h: 100, path: poly([[42, 0], [84, 50], [42, 100], [0, 50]], 9), safe: [0.29, 0.26, 0.71, 0.66], pill: [0.5, 0.75] },
    circle: { w: 100, h: 100, path: ['M', 0, 50, 'A', 50, 50, 0, 1, 0, 100, 50, 'A', 50, 50, 0, 1, 0, 0, 50, 'Z'], safe: [0.2, 0.14, 0.8, 0.7], pill: [0.5, 0.8] },
  };
  var SHAPE_NAMES = { crescent: 'moon', crescent_moon: 'moon', moon: 'moon', square: 'box', box: 'box', round: 'circle' };

  /** A shape by its name, or null for "none" (the cryptid on its own, no console). Unknown names give the coffin. */
  function shapeOf(name) {
    var key = String(name === undefined || name === null || name === '' ? 'coffin' : name).toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_|_$/g, '');
    if (key === 'none' || key === 'off') return null;
    return SHAPES[SHAPE_NAMES[key] || key] || SHAPES.coffin;
  }

  /** A path as SVG text, scaled by k and moved by (dx, dy). Arc commands keep their flags as they are. */
  function pathText(cmds, k, dx, dy) {
    var out = '';
    var cmd = '';
    var argi = 0;
    for (var i = 0; i < cmds.length; i++) {
      var v = cmds[i];
      if (typeof v === 'string') {
        cmd = v;
        argi = 0;
        out += v + ' ';
        continue;
      }
      var val;
      if (cmd === 'A') {
        // rx ry rotation large-arc sweep x y
        var slot = argi % 7;
        val = slot < 2 ? v * k : slot < 5 ? v : slot === 5 ? v * k + dx : v * k + dy;
      } else {
        val = argi % 2 === 0 ? v * k + dx : v * k + dy;
      }
      argi++;
      out += Math.round(val * 100) / 100 + ' ';
    }
    return out.trim();
  }

  /** How big the shape is drawn on a page of `w` by `h`: the screen's box on the page, and the scale. */
  var BAND = 9; // plastic all round the screen, in the shape's units
  var RIM = 2;
  var BEZEL = 2.6;
  function layout(shape, w, h) {
    var m = 6;
    var k = Math.max(0.2, Math.min((w - m * 2) / (shape.w + (BAND + RIM) * 2), (h - m * 2) / (shape.h + (BAND + RIM) * 2)));
    var sw = shape.w * k;
    var sh = shape.h * k;
    return { k: k, x: (w - sw) / 2, y: (h - sh) / 2, w: sw, h: sh };
  }

  // ---- putting it on the page ----
  var SVGNS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    var e = document.createElementNS(SVGNS, tag);
    for (var a in attrs) e.setAttribute(a, attrs[a]);
    if (parent) parent.appendChild(e);
    return e;
  }

  /** Builds the console on `stage` and moves the cryptid's canvas into its screen. Returns where effects should go (the screen), or null when
   * the broadcaster picked no console. */
  function mount(stage, settings, canvas, tagEl) {
    var shape = shapeOf(settings.console_shape);
    if (!shape) return null;
    var t = tonesFor(colorOf(settings.console_color));

    var svg = el('svg', { id: 'shell', style: 'position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible' });
    stage.insertBefore(svg, stage.firstChild);
    var defs = el('defs', {}, svg);
    var grad = el('linearGradient', { id: 'plastic', x1: '0.2', y1: '0', x2: '0.8', y2: '1' }, defs);
    el('stop', { offset: '0', 'stop-color': t.hi }, grad);
    el('stop', { offset: '0.5', 'stop-color': t.mid }, grad);
    el('stop', { offset: '1', 'stop-color': t.lo }, grad);
    var gloss = el('linearGradient', { id: 'gloss', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    el('stop', { offset: '0', 'stop-color': '#ffffff', 'stop-opacity': '0.55' }, gloss);
    el('stop', { offset: '0.35', 'stop-color': '#ffffff', 'stop-opacity': '0' }, gloss);
    var glow = el('path', { fill: 'none', stroke: t.glow, 'stroke-linejoin': 'round', style: 'filter:blur(8px)' }, svg);
    var ring = el('path', { fill: 'none', stroke: t.ring, 'stroke-linejoin': 'round' }, svg);
    var base = el('path', { fill: '#0c0c12', stroke: '#0c0c12', 'stroke-linejoin': 'round' }, svg);
    var plastic = el('path', { fill: 'url(#plastic)', stroke: 'url(#plastic)', 'stroke-linejoin': 'round' }, svg);
    var shine = el('path', { fill: 'none', stroke: 'url(#gloss)', 'stroke-linejoin': 'round' }, svg);
    var bezel = el('path', { fill: t.deep, stroke: t.deep, 'stroke-linejoin': 'round' }, svg);
    var lip = el('path', { fill: 'none', stroke: 'rgba(255,255,255,0.28)', 'stroke-linejoin': 'round' }, svg);

    // the screen: the shape cut out, with the backdrop, the cryptid and the effects inside it
    var screen = document.createElement('div');
    screen.id = 'screen';
    screen.style.cssText = 'position:absolute;overflow:hidden;';
    // BACKDROP: a placeholder dusk sky with stars. The official screen art replaces this (an image uploaded to the app, as its background).
    var backdrop = document.createElement('div');
    backdrop.style.cssText = 'position:absolute;left:0;top:0;right:0;bottom:0;background:radial-gradient(ellipse at 50% 115%, #6b3f8f 0%, #3a2160 38%, #1b1233 75%, #120c22 100%);';
    screen.appendChild(backdrop);
    for (var i = 0; i < 18; i++) {
      var s = document.createElement('div');
      var big = i % 5 === 0;
      s.style.cssText = 'position:absolute;width:' + (big ? 3 : 2) + 'px;height:' + (big ? 3 : 2) + 'px;background:#f3e9ff;border-radius:1px;left:' + ((i * 37) % 97) + '%;top:' + ((i * 53) % 61) + '%;animation:twinkle ' + (2 + (i % 4)) + 's ease-in-out ' + (i % 7) * 0.4 + 's infinite;';
      backdrop.appendChild(s);
    }
    var glass = document.createElement('div');
    glass.style.cssText = 'position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;background:linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 22%, transparent 23%);';
    stage.insertBefore(screen, svg.nextSibling);
    screen.appendChild(canvas);
    screen.appendChild(glass);

    function place() {
      var W = stage.clientWidth || window.innerWidth;
      var H = stage.clientHeight || window.innerHeight;
      var L = layout(shape, W, H);
      var d = pathText(shape.path, L.k, L.x, L.y);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var band = BAND * L.k;
      [glow, ring, base, plastic, shine, bezel, lip].forEach(function (p) {
        p.setAttribute('d', d);
      });
      glow.setAttribute('stroke-width', (band + RIM * L.k) * 2 + 6);
      ring.setAttribute('stroke-width', (band + RIM * L.k) * 2);
      base.setAttribute('stroke-width', band * 2);
      plastic.setAttribute('stroke-width', band * 2);
      shine.setAttribute('stroke-width', band * 2);
      bezel.setAttribute('stroke-width', BEZEL * L.k * 2);
      lip.setAttribute('stroke-width', Math.max(1, L.k * 0.8));
      screen.style.left = L.x + 'px';
      screen.style.top = L.y + 'px';
      screen.style.width = L.w + 'px';
      screen.style.height = L.h + 'px';
      screen.style.clipPath = "path('" + pathText(shape.path, L.k, 0, 0) + "')";
      // the cryptid stands at the bottom of the space where all of it shows
      var sx = shape.safe[0] * L.w;
      var sy = shape.safe[1] * L.h;
      var sw = (shape.safe[2] - shape.safe[0]) * L.w;
      var sh = (shape.safe[3] - shape.safe[1]) * L.h;
      var size = Math.min(sw, sh);
      canvas.style.left = sx + (sw - size) / 2 + 'px';
      canvas.style.top = sy + sh - size + 'px';
      canvas.style.bottom = 'auto';
      canvas.style.marginLeft = '0';
      canvas.style.width = size + 'px';
      canvas.style.height = size + 'px';
      // the name and the hearts float on a pill near the bottom of the screen
      if (tagEl) {
        tagEl.style.left = L.x + shape.pill[0] * L.w + 'px';
        tagEl.style.top = L.y + shape.pill[1] * L.h + 'px';
        tagEl.style.bottom = 'auto';
        tagEl.style.transform = 'translate(-50%, -50%)';
        tagEl.style.fontSize = clamp(L.h * 0.055, 12, 30) + 'px';
        tagEl.style.background = 'rgba(18,10,30,0.74)';
        tagEl.style.borderColor = t.ring;
        tagEl.style.boxShadow = '0 3px 10px rgba(0,0,0,0.45)';
      }
    }
    place();
    window.addEventListener('resize', place);
    return screen;
  }

  return { COLORS: COLORS, SHAPES: SHAPES, colorOf: colorOf, shapeOf: shapeOf, tonesFor: tonesFor, pathText: pathText, layout: layout, mount: mount };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = AfterlivesConsole;

// Broadcast Overlay "cryptid" JS.
// A little cam cryptid on a see-through page, drawn in pixel art by this script (no images, no outside files, as the app rules ask). It
// reacts to the events the app sends with $overlay.emit('react', { kind, user, amount }): wink, kiss, dance, party, hello.
// Three to choose from in the app's settings: "lumi" (a ring-light moth), "boo" (a cam ghost) and "bigfoot" (a blurry influencer).

(function () {
  var W = 64;
  var canvas = document.getElementById('pet');
  var ctx = canvas.getContext('2d');
  var bubble = document.getElementById('bubble');
  var stage = document.getElementById('stage');
  var menuEl = document.getElementById('menu');
  var tagEl = document.getElementById('tag');

  // ---- settings (read only here) ----
  var settings = typeof $settings === 'object' && $settings ? $settings : {};
  var CHARACTER = ['lumi', 'boo', 'bigfoot'].indexOf(settings.character) >= 0 ? settings.character : 'lumi';
  var NAME = String(settings.pet_name || { lumi: 'Lumi', boo: 'Boo', bigfoot: 'Bigfoot' }[CHARACTER]).slice(0, 16);
  // the console it lives in (see console.js); effects go inside its screen. With console_shape "none" it stands on the stream by itself.
  var fx = (typeof AfterlivesConsole === 'object' && AfterlivesConsole.mount(stage, settings, canvas, tagEl)) || stage;

  // ---- drawing helpers (everything is whole pixels on a 64 x 64 canvas) ----
  function rect(x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }
  function dot(x, y, c) {
    rect(x, y, 1, 1, c);
  }
  function disc(cx, cy, rx, ry, c) {
    ctx.fillStyle = c;
    for (var y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (var x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        var dx = (x + 0.5 - cx) / rx;
        var dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  // a disc with a darker edge all round it
  function blob(cx, cy, rx, ry, fill, edge) {
    disc(cx, cy, rx + 1, ry + 1, edge);
    disc(cx, cy, rx, ry, fill);
  }
  function ring(cx, cy, rx, ry, th, c, yMax) {
    ctx.fillStyle = c;
    for (var y = Math.floor(cy - ry); y <= Math.ceil(cy + ry) && (yMax === undefined || y <= yMax); y++) {
      for (var x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        var dx = (x + 0.5 - cx) / rx;
        var dy = (y + 0.5 - cy) / ry;
        var d = dx * dx + dy * dy;
        var inner = Math.pow((rx - th) / rx, 2);
        if (d <= 1 && d >= inner) ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  function line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy;
    for (;;) {
      dot(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  var HEART = ['.X.X.', 'XXXXX', 'XXXXX', '.XXX.', '..X..'];
  function heart(cx, cy, c) {
    for (var r = 0; r < 5; r++) for (var q = 0; q < 5; q++) if (HEART[r][q] === 'X') dot(cx - 2 + q, cy - 2 + r, c);
  }
  // a 3-row smile, a small o, or a big open mouth
  function mouth(cx, cy, kind, ink) {
    if (kind === 'kiss') {
      rect(cx - 1, cy, 2, 2, '#d0507c');
    } else if (kind === 'open') {
      rect(cx - 2, cy, 5, 1, ink);
      rect(cx - 1, cy + 1, 3, 1, ink);
      rect(cx - 1, cy + 1, 3, 1, '#d0507c');
    } else {
      dot(cx - 2, cy, ink);
      rect(cx - 1, cy + 1, 3, 1, ink);
      dot(cx + 2, cy, ink);
    }
  }

  // ---- what the cryptid is doing right now ----
  var react = null; // { kind, t0 }
  var DUR = { wink: 1.4, kiss: 1.8, dance: 3.2, party: 4.4, hello: 2.0 };
  var hearts = []; // the hearts a kiss sends flying: { x, y, vx, vy, t0 }

  function pose(t) {
    var s = { jump: 0, sway: 0, mouth: 'smile', winkR: false, flare: 0, wave: 0, sharp: false, kissing: false };
    s.blink = Math.floor(t * 10) % 47 === 0;
    if (react) {
      var r = t - react.t0;
      var d = DUR[react.kind] || 1.5;
      if (r > d) {
        react = null;
      } else {
        var k = react.kind;
        s.sharp = true;
        if (k === 'wink') {
          s.winkR = r > 0.15 && r < 1.0;
          s.flare = Math.max(0, 1 - r) * 0.6;
          s.mouth = 'open';
        } else if (k === 'kiss') {
          s.kissing = r > 0.25 && r < 1.1;
          s.mouth = s.kissing ? 'kiss' : 'smile';
          s.flare = 0.5;
        } else if (k === 'dance') {
          s.jump = -Math.abs(Math.sin(r * 7)) * 5;
          s.sway = Math.sin(r * 7) * 3;
          s.mouth = 'open';
          s.flare = 0.7 + 0.3 * Math.sin(r * 14);
        } else if (k === 'party') {
          s.jump = -Math.abs(Math.sin(r * 6)) * 8;
          s.sway = Math.sin(r * 6) * 4;
          s.mouth = 'open';
          s.winkR = Math.floor(r * 3) % 2 === 0;
          s.flare = 1;
        } else if (k === 'hello') {
          s.wave = Math.sin(r * 14);
          s.mouth = 'open';
        }
      }
    }
    s.idleBob = Math.round(Math.sin(t * 2.2) * 1);
    return s;
  }

  // a kiss sends one heart flying, once per kiss
  function blowKiss(s, t, x, y) {
    if (s.kissing && react && !react.kissed) {
      react.kissed = true;
      hearts.push({ x: x, y: y, t0: t });
    }
  }

  // ---- Lumi: a ring-light moth ----
  function drawLumi(t, s) {
    var cx = 32 + s.sway;
    var oy = s.jump + s.idleBob;
    // the ring light behind her, brighter when something happens
    ctx.globalAlpha = 0.22 + 0.3 * s.flare;
    ring(cx, 29 + oy, 27, 27, 5, '#fff3c8');
    ctx.globalAlpha = 1;
    ring(cx, 29 + oy, 25, 25, 2, s.flare > 0.4 ? '#ffffff' : '#fff7e0');
    if (s.flare > 0.6) {
      for (var a = 0; a < 8; a++) {
        var ang = (a / 8) * Math.PI * 2 + t;
        line(cx + Math.cos(ang) * 28, 29 + oy + Math.sin(ang) * 28, cx + Math.cos(ang) * 31, 29 + oy + Math.sin(ang) * 31, '#fff3c8');
      }
    }
    // wings, flapping (faster when she is happy)
    var wf = 0.78 + 0.22 * Math.sin(t * (react ? 11 : 4.5));
    var side;
    for (side = -1; side <= 1; side += 2) {
      blob(cx + side * 14, 25 + oy, 11 * wf, 13, '#c9b3ff', '#6f4fae');
      blob(cx + side * 11, 40 + oy, 8 * wf, 9, '#e0c9ff', '#6f4fae');
      disc(cx + side * 15, 24 + oy, 4 * wf, 4, '#fff1d0');
      disc(cx + side * 15, 24 + oy, 2 * wf, 2, '#5b3d8f');
      disc(cx + side * 12, 40 + oy, 2.4 * wf, 2.4, '#ffb3d6');
    }
    // legs
    line(cx - 3, 48 + oy, cx - 4, 53 + oy, '#5b3d8f');
    line(cx + 3, 48 + oy, cx + 4, 53 + oy, '#5b3d8f');
    // fuzzy body
    blob(cx, 38 + oy, 8, 11, '#fbf1e4', '#8a6bbd');
    disc(cx, 43 + oy, 5, 4, '#efdcf5');
    // feather boa round her neck
    for (var i = -3; i <= 3; i++) {
      var bx = cx + i * 3.2;
      var by = 29 + oy + Math.round(Math.cos((i / 3) * 1.2) * 2.6) - 1;
      blob(bx, by + 3, 3, 2.4, i % 2 ? '#ff9ec8' : '#ffb7d8', '#c75a93');
    }
    // head
    blob(cx, 21 + oy, 8, 7, '#fbf1e4', '#8a6bbd');
    // feathery antennae
    for (side = -1; side <= 1; side += 2) {
      var ax = cx + side * 3, tipx = cx + side * (9 + Math.sin(t * 3) * 1), tipy = 6 + oy;
      line(ax, 15 + oy, tipx, tipy, '#6f4fae');
      dot(tipx, tipy - 1, '#ffb3d6');
      dot(tipx + side, tipy, '#c9b3ff');
      dot((ax + tipx) / 2 + side, (15 + tipy) / 2 + oy * 0, '#c9b3ff');
    }
    // heart-shaped sunglasses
    var winkL = false;
    var lens = s.flare > 0.5 ? '#ffd0e6' : '#ff7fb0';
    heart(cx - 4, 21 + oy, '#8a2f5d');
    heart(cx + 4, 21 + oy, '#8a2f5d');
    disc(cx - 4, 21.5 + oy, 1.6, 1.4, lens);
    disc(cx + 4, 21.5 + oy, 1.6, 1.4, s.winkR ? '#ffffff' : lens);
    rect(cx - 1, 20 + oy, 2, 1, '#8a2f5d');
    dot(cx - 5, 20 + oy, '#ffffff');
    if (s.winkR) dot(cx + 5, 19 + oy, '#ffffff');
    mouth(cx, 26 + oy, s.mouth, '#8a2f5d');
    blowKiss(s, t, cx + 3, 24 + oy);
  }

  // ---- Boo: a cam ghost ----
  function drawBoo(t, s) {
    var cx = 30 + s.sway;
    var oy = s.jump + s.idleBob;
    // the little webcam on its stick, on the right, with a blinking REC light
    line(56, 26, 56, 58, '#6e5c8a');
    rect(51, 22, 9, 6, '#3b2a4f');
    rect(52, 23, 7, 4, '#5b4580');
    disc(55.5, 25, 1.6, 1.6, s.sharp ? '#9be8c4' : '#9fc8ff');
    dot(55, 24, '#ffffff');
    if (Math.floor(t * 1.6) % 2 === 0) rect(59, 21, 2, 2, '#ff5a7a');
    // sheet body with a wavy hem
    var top = 12 + oy;
    blob(cx, top + 15, 14, 14, '#fdfbff', '#b9a4de');
    rect(cx - 14, top + 15, 29, 22, '#b9a4de');
    rect(cx - 13, top + 15, 27, 22, '#fdfbff');
    for (var hx = -14; hx <= 14; hx++) {
      var hemY = top + 37 + Math.round(Math.sin(hx * 0.95 + t * 3.2) * 1.6);
      var edge = Math.abs(hx) >= 14;
      rect(cx + hx, top + 36, 1, hemY - (top + 36) + 1, '#b9a4de');
      if (!edge) rect(cx + hx, top + 36, 1, hemY - (top + 36), '#fdfbff');
    }
    // soft shade down the sheet
    rect(cx - 12, top + 20, 2, 14, '#ece4f8');
    // tiny arms
    var wave = s.wave;
    blob(cx - 15, top + 24 + Math.round(wave * 2), 2.4, 3, '#fdfbff', '#b9a4de');
    blob(cx + 15, top + 24 + (s.wave ? -5 + Math.round(wave * 2) : 0), 2.4, 3, '#fdfbff', '#b9a4de');
    // hair bow
    blob(cx - 8, top + 3, 3, 2, '#ff9ec8', '#c75a93');
    blob(cx - 13, top + 5, 2, 2, '#ff9ec8', '#c75a93');
    dot(cx - 10, top + 4, '#c75a93');
    // headset: a band over the head, ear cups, and a mic
    ring(cx, top + 15, 16, 16, 2, '#8b5fa8', top + 14);
    rect(cx - 17, top + 15, 4, 7, '#8b5fa8');
    rect(cx + 14, top + 15, 4, 7, '#8b5fa8');
    rect(cx - 17, top + 16, 2, 5, '#b79cff');
    rect(cx + 16, top + 16, 2, 5, '#b79cff');
    line(cx + 16, top + 22, cx + 12, top + 28, '#6e5c8a');
    line(cx + 12, top + 28, cx + 8, top + 29, '#6e5c8a');
    rect(cx + 6, top + 28, 3, 3, '#3b2a4f');
    // face: eyes with lashes, rosy cheeks
    var blink = s.blink;
    var ink = '#3b2a4f';
    if (blink) {
      rect(cx - 9, top + 18, 4, 1, ink);
    } else {
      rect(cx - 8, top + 15, 3, 5, ink);
      dot(cx - 7, top + 16, '#ffffff');
      dot(cx - 9, top + 15, ink);
      dot(cx - 9, top + 14, ink);
    }
    if (blink || s.winkR) {
      rect(cx + 5, top + 18, 4, 1, ink);
      dot(cx + 9, top + 17, ink);
    } else {
      rect(cx + 5, top + 15, 3, 5, ink);
      dot(cx + 6, top + 16, '#ffffff');
      dot(cx + 8, top + 15, ink);
      dot(cx + 8, top + 14, ink);
    }
    disc(cx - 10, top + 22, 2.6, 1.6, '#ffb3d0');
    disc(cx + 10, top + 22, 2.6, 1.6, '#ffb3d0');
    mouth(cx - 1, top + 22, s.mouth, ink);
    blowKiss(s, t, cx + 4, top + 21);
  }

  // ---- Bigfoot: a blurry influencer ----
  function drawBigfoot(t, s) {
    var cx = 30 + s.sway;
    var oy = s.jump + s.idleBob;
    var fur = '#8a5a3c';
    var furD = '#4d3022';
    var furL = '#b98a63';
    // feet
    blob(cx - 7, 56, 5, 2.4, fur, furD);
    blob(cx + 7, 56, 5, 2.4, fur, furD);
    // body
    blob(cx, 41 + oy, 13, 14, fur, furD);
    disc(cx, 44 + oy, 8, 9, furL);
    for (var i = 0; i < 6; i++) dot(cx - 11 + i * 4, 33 + oy + (i % 2) * 3, furD);
    // left arm down, right arm up holding the selfie stick
    blob(cx - 15, 44 + oy, 3, 8, fur, furD);
    var armUp = s.wave ? Math.round(s.wave * 3) : 0;
    blob(cx + 15, 38 + oy - 2 + armUp, 3, 7, fur, furD);
    // the selfie stick and phone
    line(cx + 16, 30 + oy + armUp, cx + 24, 12 + oy, '#d8c8f0');
    rect(cx + 21, 4 + oy, 8, 11, '#2c2140');
    rect(cx + 22, 5 + oy, 6, 8, s.sharp ? '#9be8c4' : '#b6d4ff');
    dot(cx + 25, 14 + oy, '#8a7fa8');
    // head
    blob(cx, 24 + oy, 11, 10, fur, furD);
    disc(cx, 28 + oy, 7, 5, furL);
    // a tuft on top and ears
    rect(cx - 2, 12 + oy, 4, 2, furD);
    rect(cx - 1, 11 + oy, 2, 1, furD);
    blob(cx - 12, 25 + oy, 2, 3, fur, furD);
    blob(cx + 12, 25 + oy, 2, 3, fur, furD);
    // big round sunglasses
    var lens = s.flare > 0.4 ? '#7a5bb5' : '#2c2140';
    blob(cx - 5, 23 + oy, 4, 3.4, lens, '#1a1228');
    blob(cx + 5, 23 + oy, 4, 3.4, s.winkR ? '#fff1d0' : lens, '#1a1228');
    rect(cx - 1, 22 + oy, 2, 1, '#1a1228');
    dot(cx - 6, 22 + oy, '#ffffff');
    dot(cx + 4, 22 + oy, '#ffffff');
    if (s.winkR) dot(cx + 5, 23 + oy, '#8a5a3c');
    // nose and mouth
    rect(cx - 1, 27 + oy, 3, 2, furD);
    mouth(cx, 31 + oy, s.mouth, furD);
    blowKiss(s, t, cx + 3, 30 + oy);
  }

  var DRAW = { lumi: drawLumi, boo: drawBoo, bigfoot: drawBigfoot };

  // ---- the loop ----
  var t0 = performance.now();
  function frame(now) {
    var t = (now - t0) / 1000;
    var s = pose(t);
    ctx.clearRect(0, 0, W, W);
    DRAW[CHARACTER](t, s);
    // hearts from a kiss
    for (var i = hearts.length - 1; i >= 0; i--) {
      var h = hearts[i];
      var age = t - h.t0;
      if (age > 1.6) { hearts.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, 1 - age / 1.6);
      heart(h.x + age * 14 + Math.sin(age * 6) * 1.5, h.y - age * 12, '#ff6fa5');
      ctx.globalAlpha = 1;
    }
    // Bigfoot is always a little blurry, like evidence; he sharpens up when something happens
    canvas.style.filter = CHARACTER === 'bigfoot' && !s.sharp ? 'blur(1.4px)' : 'none';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---- bubbles, floating emoji, confetti ----
  var bubbleTimer = null;
  function say(text, ms) {
    bubble.textContent = text;
    bubble.className = 'show';
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () {
      bubble.className = '';
    }, ms || 4200);
  }
  function floatUp(emoji, n) {
    for (var i = 0; i < n; i++) {
      (function (i) {
        setTimeout(function () {
          var el = document.createElement('div');
          el.className = 'float';
          el.textContent = emoji[i % emoji.length];
          el.style.left = 28 + Math.random() * 44 + '%';
          el.style.top = '48%';
          fx.appendChild(el);
          setTimeout(function () {
            el.remove();
          }, 2000);
        }, i * 140);
      })(i);
    }
  }
  function confetti(n) {
    var colors = ['#ff9ec8', '#b79cff', '#9be8c4', '#ffd36b', '#8fd0ff'];
    for (var i = 0; i < n; i++) {
      var el = document.createElement('div');
      el.className = 'confetti';
      el.style.left = Math.random() * 100 + '%';
      el.style.background = colors[i % colors.length];
      el.style.animationDelay = Math.random() * 0.8 + 's';
      fx.appendChild(el);
      setTimeout(function (e) {
        e.remove();
      }, 3600, el);
    }
  }

  var LINES = {
    wink: ['{u} gets a wink!', 'Hi {u}! *wink*', 'Thank you, {u}!'],
    kiss: ['{u} gets a kiss! mwah', 'Mwah! Thank you, {u}!', 'A kiss for {u}!'],
    dance: ['{u} made me dance!', 'Dancing for {u}!', 'Wheee! Thank you, {u}!'],
    party: ['{u} threw a PARTY!!', 'PARTY for {u}!', '{u}!!! Confetti!'],
    hello: ['Hi {u}! Welcome in.', 'Welcome, {u}!', '{u} is here! Hi!'],
  };
  function lineFor(kind, user) {
    var list = LINES[kind] || LINES.wink;
    return list[Math.floor(Math.random() * list.length)].replace('{u}', user || 'someone');
  }
  var EMOJI = { wink: ['✨', '💜'], kiss: ['💋', '💜', '💋'], dance: ['✨', '🎶', '⭐', '✨'], party: ['🎉', '✨', '💜', '🎉', '⭐', '💜'], hello: ['👋', '💜'] };

  // ---- events from the app ----
  $overlay.on(
    'react',
    function (e) {
      var kind = DUR[e.kind] ? e.kind : 'wink';
      react = { kind: kind, t0: (performance.now() - t0) / 1000 };
      say(e.amount ? lineFor(kind, e.user).replace('!', ' (' + e.amount + ')!') : lineFor(kind, e.user), kind === 'party' ? 5200 : 4200);
      floatUp(EMOJI[kind] || EMOJI.wink, kind === 'party' ? 8 : 4);
      if (kind === 'party') confetti(40);
    },
    1200
  );

  // ---- the name tag, and the tip menu if the broadcaster wants it shown ----
  tagEl.textContent = NAME;
  var sp = document.createElement('span');
  sp.textContent = '♥♥♥♥♡';
  tagEl.appendChild(sp);
  if (settings.show_menu === true && typeof menuOf === 'function') {
    var items = menuOf(settings);
    var LABEL = { wink: 'Wink', kiss: 'Kiss', dance: 'Dance', party: 'Party!' };
    menuEl.style.display = 'block';
    menuEl.innerHTML = '<h4>TIP MENU</h4>' + items.map(function (m) {
      return '<div><span>' + LABEL[m.kind] + '</span><b>' + m.tokens + '+</b></div>';
    }).join('');
  }
  setTimeout(function () {
    say('Hi! I am ' + NAME + '.', 3200);
  }, 1200);
})();
