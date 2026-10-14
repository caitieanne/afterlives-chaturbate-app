// The character's life in their room: they walk between the room's spots (the bed or couch, the desk chair, the rug, the window), do the
// thing that spot is for (pose, type, dance, gaze), and get smaller the further back in the room they go. A tip or a goal interrupts:
// they turn to the camera and react. The frames are PixelLab animations baked in by the build as AFTERLIVES_CHARS.

var AfterlivesLife = (function () {
  // ---- the rooms' spots, as fractions of the room picture (240 x 320). x, y is where the feet go. ----
  // back and front are the floor's far and near lines, for the depth scaling. A spot that is null is a thing the room does not have.
  // desk.face is the way they face sitting at it.
  var STD = { back: 0.58, front: 0.97 };
  function room(o) {
    return { back: o.back || STD.back, front: o.front || STD.front, lounge: o.lounge || null, desk: o.desk || null, rug: o.rug, window: o.window };
  }
  var ROOMS = {
    dusk: room({ back: 0.55, rug: [0.5, 0.82], window: [0.5, 0.62], lounge: null }),
    zen: room({ lounge: [0.2, 0.69], desk: [0.78, 0.67, 'east'], rug: [0.5, 0.82], window: [0.48, 0.62] }),
    cyber: room({ lounge: [0.2, 0.69], desk: [0.7, 0.71, 'east'], rug: [0.5, 0.79], window: [0.48, 0.64] }),
    campfire: room({ lounge: [0.3, 0.71], rug: [0.42, 0.83], window: [0.5, 0.62] }),
    academia: room({ lounge: [0.2, 0.69], desk: [0.72, 0.72, 'east'], rug: [0.5, 0.8], window: [0.47, 0.63] }),
    boutique: room({ desk: [0.72, 0.72, 'east'], rug: [0.5, 0.8], window: [0.47, 0.64] }),
    vaporwave: room({ lounge: [0.58, 0.68], desk: [0.85, 0.67, 'east'], rug: [0.5, 0.83], window: [0.35, 0.7] }),
    starship: room({ lounge: [0.22, 0.69], desk: [0.72, 0.72, 'east'], rug: [0.5, 0.8], window: [0.5, 0.63] }),
    studio: room({ lounge: [0.33, 0.77], desk: [0.72, 0.72, 'east'], rug: [0.55, 0.8], window: [0.47, 0.64] }),
    slime: room({ lounge: [0.2, 0.69], desk: [0.68, 0.7, 'east'], rug: [0.48, 0.78], window: [0.47, 0.64] }),
    cottage: room({ lounge: [0.22, 0.69], rug: [0.5, 0.8], window: [0.5, 0.62] }),
    neon: room({ lounge: [0.27, 0.74], desk: [0.72, 0.7, 'east'], rug: [0.5, 0.8], window: [0.48, 0.63] }),
    goth: room({ lounge: [0.2, 0.67], rug: [0.5, 0.8], window: [0.5, 0.64] }),
    music: room({ lounge: [0.3, 0.72], desk: [0.72, 0.7, 'east'], rug: [0.5, 0.8], window: [0.48, 0.64] }),
    rooftop: room({ lounge: [0.88, 0.74], rug: [0.5, 0.78], window: [0.5, 0.62] }),
    gym: room({ rug: [0.5, 0.76], window: [0.48, 0.62] }),
    library: room({ lounge: [0.72, 0.7], rug: [0.48, 0.76], window: [0.55, 0.63] }),
    dreamy: room({ lounge: [0.2, 0.69], desk: [0.72, 0.7, 'east'], rug: [0.5, 0.8], window: [0.47, 0.64] }),
  };

  /** How big the character is drawn at a spot: smaller toward the back of the room, full size at the front. */
  function depthScale(r, y) {
    var t = (y - r.back) / (r.front - r.back);
    return 0.55 + 0.45 * Math.max(0, Math.min(1, t));
  }

  /** What each spot is for: the animation played there and how long they stay (seconds). */
  var DO = {
    lounge: { anim: 'lounge', min: 9, max: 15 },
    desk: { anim: 'desk', min: 10, max: 16 },
    rug: { anim: 'dance', min: 5, max: 8 },
    window: { anim: 'idle', min: 4, max: 7 },
  };
  /** Reactions: which animation each reaction plays, and how many times through. */
  var REACT = { wink: ['wink', 1], kiss: ['kiss', 1], dance: ['dance', 2], party: ['party', 2], hello: ['wave', 1], goal: ['party', 3], buzz: ['buzz', 2] };

  /** Picks the next spot to go to: anywhere the room has, but not where they already are. */
  function nextSpot(r, current, rnd) {
    var names = ['lounge', 'desk', 'rug', 'window', 'rug'].filter(function (n) {
      return r[n] && n !== current;
    });
    return names.length ? names[Math.floor((rnd || Math.random)() * names.length)] : current;
  }

  /** Starts the character living in `screen` (the console's screen, or the whole stage). `roomName` picks the spots; `art` is the room
   * picture's address (null for the dusk sky), used to line the spots up with the picture as it is cropped to fit. */
  function mount(screen, chr, roomName, art) {
    var r = ROOMS[roomName] || ROOMS.dusk;
    var el = document.createElement('div');
    el.className = 'char';
    el.style.cssText = 'position:absolute;left:0;top:0;background-repeat:no-repeat;image-rendering:pixelated;transform-origin:50% 100%;pointer-events:none;';
    screen.appendChild(el);

    // where the room picture sits in the screen (background-size cover, positioned center 80% so the floor shows, as console.js draws it)
    function pictureBox() {
      var W = screen.clientWidth || 1;
      var H = screen.clientHeight || 1;
      if (!art) return { x: 0, y: 0, w: W, h: H };
      var k = Math.max(W / 240, H / 320);
      var w = 240 * k;
      var h = 320 * k;
      return { x: (W - w) * 0.5, y: (H - h) * 0.8, w: w, h: h };
    }

    var s = { x: r.rug[0], y: r.rug[1], spot: 'rug', anim: 'idle', t0: 0, flip: false, until: 0, walk: null, react: null };
    function play(anim, flip) {
      if (s.anim !== anim) s.t0 = performance.now();
      s.anim = anim;
      s.flip = !!flip;
    }
    function settle() {
      var spot = r[s.spot];
      var job = DO[s.spot] || DO.window;
      play(chr.anims[job.anim] ? job.anim : 'idle', s.spot === 'desk' && spot && spot[2] === 'west');
      s.until = performance.now() + (job.min + Math.random() * (job.max - job.min)) * 1000;
    }
    function goTo(name) {
      var p = r[name];
      if (!p) return settle();
      s.walk = { name: name, x: p[0], y: p[1] };
      play('walk', p[0] < s.x);
    }
    settle();

    function draw(now) {
      // a reaction, while it plays, overrides everything else
      var animName = s.react ? s.react.anim : s.anim;
      var a = chr.anims[animName] || chr.anims.idle;
      var started = s.react ? s.react.t0 : s.t0;
      var f = Math.floor(((now - started) / 1000) * (a.fps || 8));
      if (s.react) {
        if (f >= a.n * s.react.times) {
          // done: carry on walking if they were on the way somewhere, else back to what the spot is for
          s.react = null;
          if (s.walk) play('walk', s.walk.x < s.x);
          else settle();
          return draw(now);
        }
      }
      f = f % a.n;

      if (!s.react && s.walk) {
        // walk: about a fifth of the room a second, slower further back
        var dx = s.walk.x - s.x;
        var dy = s.walk.y - s.y;
        var d = Math.hypot(dx, dy);
        var step = (0.2 * depthScale(r, s.y)) / 60;
        if (d <= step) {
          s.x = s.walk.x;
          s.y = s.walk.y;
          s.spot = s.walk.name;
          s.walk = null;
          settle();
        } else {
          s.x += (dx / d) * step;
          s.y += (dy / d) * step;
        }
      } else if (!s.react && now > s.until) {
        goTo(nextSpot(r, s.spot));
      }

      var box = pictureBox();
      // frames are 124 px squares with the character about 85 px tall in them
      var size = box.h * 0.4 * depthScale(r, s.y);
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.backgroundImage = 'url(' + a.src + ')';
      el.style.backgroundSize = a.n * 100 + '% 100%';
      el.style.backgroundPosition = (a.n > 1 ? (f / (a.n - 1)) * 100 : 0) + '% 0';
      var flip = s.react ? false : s.flip;
      // feet sit 104 px down each 124 px frame
      el.style.transform = 'translate(' + (box.x + s.x * box.w - size / 2) + 'px,' + (box.y + s.y * box.h - size * 0.84) + 'px)' + (flip ? ' scaleX(-1)' : '');
      el.style.zIndex = String(Math.round(s.y * 100));
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);

    return {
      /** A tip, a goal or a chat command: turn to the camera and react, then carry on. */
      react: function (kind) {
        var rr = REACT[kind] || REACT.wink;
        var anim = chr.anims[rr[0]] ? rr[0] : 'idle';
        s.react = { anim: anim, t0: performance.now(), times: rr[1] };
      },
    };
  }

  return { ROOMS: ROOMS, depthScale: depthScale, nextSpot: nextSpot, REACT: REACT, mount: mount };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = AfterlivesLife;
