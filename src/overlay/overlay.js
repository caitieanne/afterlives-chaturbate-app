// Broadcast Overlay "cryptid" JS.
// A little cam character on a see-through page. It reacts to the events the app sends with $overlay.emit('react', { kind, user, amount }):
// wink, kiss, dance, party, hello, goal. The sassy fruit (AFTERLIVES_CHARS, PixelLab animations baked in by the build) live in their room
// (life.js); the older placeholder cryptids "lumi", "boo" and "bigfoot" are drawn by this script on a small canvas.

(function () {
  var W = 64;
  var canvas = document.getElementById('pet');
  var ctx = canvas.getContext('2d');
  var bubble = document.getElementById('bubble');
  var stage = document.getElementById('stage');
  var menuEl = document.getElementById('menu');
  var tagEl = document.getElementById('tag');

  // ---- settings (read only here) ----
  var settings = typeof $settings === 'object' && $settings ? (typeof flattenSettings === 'function' ? flattenSettings($settings) : $settings) : {};
  var CHARS = typeof AFTERLIVES_CHARS === 'object' && AFTERLIVES_CHARS ? AFTERLIVES_CHARS : {};
  // "The Cherries" on the settings page is "cherries" here
  var picked = String(settings.character || '').toLowerCase().replace(/[^a-z]/g, '').replace(/^the/, '');
  var DRAWN = ['lumi', 'boo', 'bigfoot'];
  // a sprite character when one is picked (or any other name: the first one), else one of the drawn placeholders
  var SPRITE = CHARS[picked] || (DRAWN.indexOf(picked) < 0 && CHARS[Object.keys(CHARS)[0]]) || null;
  if (SPRITE && !CHARS[picked]) picked = Object.keys(CHARS)[0];
  var CHARACTER = SPRITE ? picked || Object.keys(CHARS)[0] : ['lumi', 'boo', 'bigfoot'].indexOf(picked) >= 0 ? picked : 'lumi';
  var NAME = String(settings.pet_name || (SPRITE ? SPRITE.name : { lumi: 'Lumi', boo: 'Boo', bigfoot: 'Bigfoot' }[CHARACTER])).slice(0, 16);
  // the console it lives in (see console.js); effects go inside its screen. With console_shape "none" it stands on the stream by itself.
  var fx = (typeof AfterlivesConsole === 'object' && AfterlivesConsole.mount(stage, settings, canvas, tagEl)) || stage;
  var hasConsole = fx !== stage;
  // no console: the character still keeps to its corner, never the middle of the stream where the performer is
  if (!hasConsole && typeof AfterlivesConsole === 'object') {
    fx = AfterlivesConsole.bareCorner(stage, settings, tagEl);
    fx.appendChild(canvas);
    canvas.style.cssText = 'position:absolute;left:0;bottom:0;width:100%;height:auto;aspect-ratio:1;margin:0;image-rendering:pixelated;';
  }
  // a sprite character lives in the room: walks about, sits at the desk, poses, dances (life.js)
  var life = null;
  if (SPRITE && typeof AfterlivesLife === 'object') {
    canvas.style.display = 'none';
    var roomKey = AfterlivesConsole.roomKeyOf(settings.room);
    var roomArt = hasConsole ? AfterlivesConsole.roomOf(settings.room) : null;
    life = AfterlivesLife.mount(fx, SPRITE, roomArt ? roomKey : 'dusk', roomArt);
    window.afterlivesPet = life; // lets the preview page send them to a spot
  }

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
  var DUR = { wink: 1.4, kiss: 1.8, dance: 3.2, party: 4.4, hello: 2.0, goal: 6.0, smooch: 3.0, twerk: 3.6, vibe: 3.4, blush: 2.6 };
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
        } else if (k === 'kiss' || k === 'smooch') {
          s.kissing = r > 0.25 && r < 1.1;
          s.mouth = s.kissing ? 'kiss' : 'smile';
          s.flare = 0.5;
        } else if (k === 'dance' || k === 'twerk') {
          s.jump = -Math.abs(Math.sin(r * 7)) * 5;
          s.sway = Math.sin(r * 7) * 3;
          s.mouth = 'open';
          s.flare = 0.7 + 0.3 * Math.sin(r * 14);
        } else if (k === 'party' || k === 'goal') {
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
    if (life) return; // the sprite character draws itself
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
  var lastSaid = 0;
  function say(text, ms) {
    lastSaid = Date.now();
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
    smooch: ['MWAH! A big one for {u}!', '{u} gets a smooch on the screen!', 'Come here, {u}... mwah!'],
    twerk: ['{u} made me twerk!', 'Twerking for {u}!', 'Look at it go, {u}!'],
    vibe: ['{u} made me buzz!', 'Bzzzz! Thank you, {u}!', 'Good vibes, {u}!'],
    blush: ['{u} made me blush!', 'Stop it, {u}... *blushes*', 'Aww, {u}!'],
    goal: ['GOAL! {g}! Thank you, {u}!', 'We did it: {g}! {u}, you star!', '{g}: DONE! Thank you all!'],
  };
  // what it says on its own, now and then (how often is the broadcaster's "speak_per_hour"); never anything about money
  var IDLE = [
    'Hydrate, chat!',
    'Type /wink to say hi!',
    'Who wants a /kiss?',
    '*fixes the ring light*',
    'Posture check!',
    'You all look lovely tonight.',
    'Type /dance and I will dance!',
    'Stretch your hands for a sec.',
    'Best chat on the internet.',
    '*waves at the lurkers*',
    'Remember to blink!',
  ];
  function lineFor(kind, user) {
    var list = LINES[kind] || LINES.wink;
    return list[Math.floor(Math.random() * list.length)].replace('{u}', user || 'someone').replace('{g}', goalName);
  }
  var EMOJI = { wink: ['✨', '💜'], kiss: ['💋', '💜', '💋'], dance: ['✨', '🎶', '⭐', '✨'], party: ['🎉', '✨', '💜', '🎉', '⭐', '💜'], hello: ['👋', '💜'], smooch: ['💋', '💋', '💜', '💋'], twerk: ['🍑', '✨', '🍑', '🎶'], vibe: ['📳', '💜', '📳', '✨'], blush: ['☺️', '💕', '🌸'], goal: ['🏆', '🎉', '✨', '💜', '🎉', '⭐', '🏆', '💜'] };

  // ---- events from the app ----
  $overlay.on(
    'react',
    function (e) {
      var kind = DUR[e.kind] ? e.kind : 'wink';
      react = { kind: kind, t0: (performance.now() - t0) / 1000 };
      if (life) life.react(kind);
      if (kind === 'goal') {
        if (e.goal) goalName = String(e.goal).slice(0, 30);
        say(lineFor('goal', e.user), 7000);
        floatUp(EMOJI.goal, 12);
        confetti(90);
        if (goalEl) goalEl.className = 'cheer';
        setTimeout(function () {
          if (goalEl) goalEl.className = '';
        }, 6000);
        return;
      }
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
  // the tip menu is not on the overlay: the app posts it in chat on a timer (see handlers/callback.js), so the overlay stays in its corner
  setTimeout(function () {
    say('Hi! I am ' + NAME + '.', 3200);
  }, 1200);

  // ---- the tip goal card (when the broadcaster has set a goal) ----
  var goalEl = null;
  var goalName = String(settings.tip_goal_name || 'Tip goal').slice(0, 30);
  function showGoal(g) {
    if (!g || !(g.goal > 0) || settings.show_goal === false) {
      if (goalEl) goalEl.style.display = 'none';
      return;
    }
    if (!goalEl) {
      goalEl = document.createElement('div');
      goalEl.id = 'goal';
      // inside the name pill on the console, never out in the middle of the stream
      tagEl.appendChild(goalEl);
    }
    goalName = String(g.name || goalName).slice(0, 30);
    var pct = Math.max(0, Math.min(100, (g.progress / g.goal) * 100));
    goalEl.style.display = 'flex';
    goalEl.innerHTML = '';
    var h = document.createElement('h4');
    h.textContent = goalName;
    var bar = document.createElement('div');
    bar.className = 'bar';
    var fill = document.createElement('i');
    fill.style.width = pct + '%';
    bar.appendChild(fill);
    var n = document.createElement('div');
    n.className = 'n';
    n.textContent = Math.min(g.progress, g.goal) + ' / ' + g.goal;
    goalEl.appendChild(h);
    goalEl.appendChild(bar);
    goalEl.appendChild(n);
  }
  function kvGet(k, d) {
    return typeof $kv === 'object' && $kv && typeof $kv.get === 'function' ? $kv.get(k, d) : d;
  }
  // in the overlay $kv.get answers with a promise (in the preview, straight away): either way, show the goal once the progress is known
  Promise.resolve(kvGet('goal_progress', 0))
    .catch(function () {
      return 0;
    })
    .then(function (p) {
      showGoal({ progress: Number(p) || 0, goal: goalOf(settings), name: goalName });
    });
  $overlay.on('goal', function (g) {
    showGoal(g);
  });

  // ---- things it says on its own, as often as the broadcaster likes (never over someone else's moment) ----
  var every = idleEverySeconds(settings);
  if (every > 0) {
    setInterval(function () {
      if (Date.now() - lastSaid < 20000 || react) return;
      say(IDLE[Math.floor(Math.random() * IDLE.length)], 4200);
    }, every * 1000);
  }
})();
