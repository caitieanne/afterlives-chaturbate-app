// The cryptid's console: a bubbly see-through plastic handheld that the cryptid lives inside, in one of eight shapes (coffin, crescent moon,
// heart, star, box, diamond, harlequin, circle) and ten colors (the same ones as the Afterlives game's console). Drawn by this script as SVG, no images.
// Each shape is the outline of the screen; the plastic is that same outline drawn with a thick, round-jointed stroke, so every shape gets
// an even, bubbly band of plastic all round, however pointy it is.
// The screen shows a room: the dusk sky (drawn here) or one of the painted rooms in art/rooms, which the build bakes into the overlay as
// AFTERLIVES_ROOMS (the overlay may not load image files of its own).

var AfterlivesConsole = (function () {
  // ---- colors (names and plastic tones from the game's console colors) ----
  var COLORS = [
    { id: 'midnight', name: 'Midnight', hex: '#2b2b36', dark: true },
    { id: 'blue_raspberry', name: 'Blue Raspberry', hex: '#18b2c6' },
    { id: 'blueberry', name: 'Blueberry', hex: '#3f64e0' },
    { id: 'violet', name: 'Violet', hex: '#8a47d6' },
    { id: 'bubblegum', name: 'Bubblegum', hex: '#ff6fb5' },
    { id: 'cherry', name: 'Cherry', hex: '#e93d58' },
    { id: 'tangerine', name: 'Tangerine', hex: '#ff8a1f' },
    { id: 'lime', name: 'Lime', hex: '#7fd02e' },
    { id: 'smoke', name: 'Smoke', hex: '#6d7280' },
    { id: 'frost', name: 'Frost', hex: '#bfe4ff' },
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

  /** A color by its name ("violet", "blue raspberry", "Blue_Raspberry" all work) or its hex code (what the settings page's color picker gives), or Violet. */
  function colorOf(name) {
    var raw = String(name || '').toLowerCase();
    var key = raw.replace(/[^a-z]+/g, '_').replace(/^_|_$/g, '');
    for (var i = 0; i < COLORS.length; i++) if (COLORS[i].id === key || COLORS[i].hex === raw) return COLORS[i];
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
    // a cut gem: flat table on top, slanted crown, and the point at the bottom
    diamond: { w: 100, h: 86, path: poly([[24, 0], [76, 0], [100, 28], [50, 86], [0, 28]], 7), safe: [0.24, 0.1, 0.76, 0.6], pill: [0.5, 0.69] },
    // the four-sided harlequin diamond
    harlequin: { w: 84, h: 100, path: poly([[42, 0], [84, 50], [42, 100], [0, 50]], 9), safe: [0.29, 0.26, 0.71, 0.66], pill: [0.5, 0.75] },
    circle: { w: 100, h: 100, path: ['M', 0, 50, 'A', 50, 50, 0, 1, 0, 100, 50, 'A', 50, 50, 0, 1, 0, 0, 50, 'Z'], safe: [0.2, 0.14, 0.8, 0.7], pill: [0.5, 0.8] },
  };
  var SHAPE_NAMES = { gem: 'diamond', rhombus: 'harlequin', crescent: 'moon', crescent_moon: 'moon', moon: 'moon', square: 'box', box: 'box', round: 'circle' };

  /** The painted room for a name, as an image address, or null for the dusk sky (the default, and anything not known). */
  function roomOf(name) {
    var rooms = typeof AFTERLIVES_ROOMS === 'object' && AFTERLIVES_ROOMS ? AFTERLIVES_ROOMS : {};
    var key = roomKeyOf(name);
    return Object.prototype.hasOwnProperty.call(rooms, key) ? rooms[key] : null;
  }

  /** The rooms as the settings page lists them: [id, name]. */
  var ROOM_LABELS = [
    ['dusk', 'Dusk sky'],
    ['dreamy', 'Dreamy bedroom'],
    ['goth', 'Goth parlor'],
    ['vaporwave', 'Vaporwave den'],
    ['neon', 'Neon den'],
    ['starship', 'Starship cabin'],
    ['cyber', 'Cyber pad'],
    ['boutique', 'Boutique'],
    ['music', 'Music studio'],
    ['studio', 'Art studio'],
    ['slime', 'Slime bedroom'],
    ['academia', 'Dark academia'],
    ['library', 'Library nook'],
    ['cottage', 'Cottage'],
    ['zen', 'Zen spa'],
    ['rooftop', 'Rooftop'],
    ['campfire', 'Campfire'],
    ['gym', 'Home gym'],
  ];
  /** A room's id from its id or its name on the settings page ("Dreamy bedroom" gives "dreamy"); "dusk" for anything else. */
  function roomKeyOf(name) {
    var key = String(name || '').toLowerCase().replace(/[^a-z]+/g, '');
    for (var i = 0; i < ROOM_LABELS.length; i++) {
      if (ROOM_LABELS[i][0] === key || ROOM_LABELS[i][1].toLowerCase().replace(/[^a-z]+/g, '') === key) return ROOM_LABELS[i][0];
    }
    return 'dusk';
  }
  /** The console shapes as the settings page lists them: [id, name]. */
  var SHAPE_LABELS = [
    ['coffin', 'Coffin'],
    ['heart', 'Heart'],
    ['moon', 'Crescent moon'],
    ['star', 'Star'],
    ['diamond', 'Diamond'],
    ['harlequin', 'Harlequin'],
    ['circle', 'Circle'],
    ['box', 'Box'],
    ['none', 'No console'],
  ];

  /** A shape by its name, or null for "none" (the cryptid on its own, no console). Unknown names give the coffin. */
  function shapeOf(name) {
    var key = String(name === undefined || name === null || name === '' ? 'coffin' : name).toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_|_$/g, '');
    if (key === 'none' || key === 'off' || key === 'no_console') return null;
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

  /** The console lives in one corner of the stream and never reaches the middle, where the performer is: this much of the stream's height,
   * and at most this much of its width. */
  var CORNER_HEIGHT = 0.38;
  var CORNER_WIDTH = 0.34;
  var CORNERS = [
    ['bottom_right', 'Bottom right'],
    ['bottom_left', 'Bottom left'],
    ['top_right', 'Top right'],
    ['top_left', 'Top left'],
  ];
  /** A corner from its id or its name on the settings page; bottom right by default. */
  function cornerOf(name) {
    var key = String(name || '').toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_|_$/g, '');
    for (var i = 0; i < CORNERS.length; i++) if (CORNERS[i][0] === key) return CORNERS[i][0];
    return 'bottom_right';
  }

  /** How big the shape is drawn on a page of `w` by `h`: the screen's box on the page, and the scale. With a corner, the console sits in
   * that corner at CORNER_HEIGHT of the page; without one, it fills the page (the tests and old previews). */
  var BAND = 6; // plastic all round the screen, in the shape's units (thin, to show off more of the room)
  var RIM = 2;
  var BEZEL = 2.6;
  function layout(shape, w, h, corner) {
    var m = corner ? Math.max(6, h * 0.02) : 6;
    var maxW = corner ? w * CORNER_WIDTH : w - m * 2;
    var maxH = corner ? h * CORNER_HEIGHT : h - m * 2;
    var k = Math.max(0.2, Math.min(maxW / (shape.w + (BAND + RIM) * 2), maxH / (shape.h + (BAND + RIM) * 2)));
    var sw = shape.w * k;
    var sh = shape.h * k;
    var edge = (BAND + RIM) * k;
    if (!corner) return { k: k, x: (w - sw) / 2, y: (h - sh) / 2, w: sw, h: sh, edge: edge };
    var right = corner.indexOf('right') >= 0;
    var bottom = corner.indexOf('bottom') >= 0;
    return { k: k, x: right ? w - m - edge - sw : m + edge, y: bottom ? h - m - edge - sh : m + edge, w: sw, h: sh, edge: edge, corner: corner };
  }

  /** Puts the speech bubble over the top of the console's screen, within the console's own width, so nothing reaches the middle of the
   * stream. (The tip menu goes in chat instead, on a timer; the goal shows in the name pill.) */
  function placeAround(stage, L) {
    var u = clamp(L.h / 260, 0.7, 3); // text grows with the console
    // the name pill stands on the console's bottom edge and grows upward over the screen, so however tall it gets (the goal line), it never
    // hangs off the bottom of the stream
    var tag = document.getElementById('tag');
    if (tag) {
      var H = stage.clientHeight || window.innerHeight;
      tag.style.top = 'auto';
      tag.style.bottom = H - (L.y + L.h + L.edge * 0.5) + 'px';
      tag.style.transform = 'translateX(-50%)';
    }
    var bubble = document.getElementById('bubble');
    if (bubble) {
      bubble.style.left = L.x + L.w / 2 + 'px';
      bubble.style.top = L.y + L.h * 0.05 + 'px';
      bubble.style.maxWidth = L.w * 0.96 + 'px';
      bubble.style.fontSize = 15 * u + 'px';
      bubble.style.zIndex = '900';
    }
    return { u: u };
  }

  /** No console: the character still lives in the same corner, in a box the size the console's screen would be. Returns that box. */
  function bareCorner(stage, settings, tagEl) {
    var area = document.createElement('div');
    area.id = 'screen';
    area.style.cssText = 'position:absolute;overflow:hidden;';
    stage.appendChild(area);
    function place() {
      var W = stage.clientWidth || window.innerWidth;
      var H = stage.clientHeight || window.innerHeight;
      var L = layout(SHAPES.coffin, W, H, cornerOf(settings.console_position));
      area.style.left = L.x + 'px';
      area.style.top = L.y + 'px';
      area.style.width = L.w + 'px';
      area.style.height = L.h + 'px';
      if (tagEl) {
        tagEl.style.left = L.x + L.w / 2 + 'px';
        tagEl.style.top = L.y + L.h + 'px';
        tagEl.style.bottom = 'auto';
        tagEl.style.transform = 'translate(-50%, -50%)';
        tagEl.style.fontSize = clamp(L.h * 0.042, 7, 28) + 'px';
      }
      placeAround(stage, L);
    }
    place();
    window.addEventListener('resize', place);
    return area;
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
    // BACKDROP: the room the broadcaster picked, or the dusk sky with twinkling stars
    var backdrop = document.createElement('div');
    backdrop.style.cssText = 'position:absolute;left:0;top:0;right:0;bottom:0;background:radial-gradient(ellipse at 50% 115%, #6b3f8f 0%, #3a2160 38%, #1b1233 75%, #120c22 100%);';
    screen.appendChild(backdrop);
    var room = roomOf(settings.room);
    if (room) {
      backdrop.style.background = '#120c22 url(' + room + ') center 80% / cover no-repeat';
      backdrop.style.imageRendering = 'pixelated';
    }
    for (var i = 0; i < (room ? 0 : 18); i++) {
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
      var L = layout(shape, W, H, cornerOf(settings.console_position));
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
        // on the console's bottom edge, so it never covers the character in the room
        tagEl.style.top = L.y + L.h + 'px';
        tagEl.style.bottom = 'auto';
        tagEl.style.transform = 'translate(-50%, -50%)';
        tagEl.style.fontSize = clamp(L.h * 0.042, 7, 28) + 'px';
        tagEl.style.background = 'rgba(18,10,30,0.74)';
        tagEl.style.borderColor = t.ring;
        tagEl.style.boxShadow = '0 3px 10px rgba(0,0,0,0.45)';
      }
      placeAround(stage, L);
    }
    place();
    window.addEventListener('resize', place);
    return screen;
  }

  return { COLORS: COLORS, SHAPES: SHAPES, ROOM_LABELS: ROOM_LABELS, SHAPE_LABELS: SHAPE_LABELS, CORNERS: CORNERS, cornerOf: cornerOf, bareCorner: bareCorner, roomKeyOf: roomKeyOf, roomOf: roomOf, colorOf: colorOf, shapeOf: shapeOf, tonesFor: tonesFor, pathText: pathText, layout: layout, mount: mount };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = AfterlivesConsole;
