// SHARED CODE (the app's "Shared code" slot). It runs before every event handler, so the handlers can call these. Plain functions only: anything
// that has to survive between events lives in $kv, never in a variable here.

// The reactions a tip can set off, cheapest first. Each has a setting (tokens it needs; 0 or empty turns it off).
var REACTIONS = [
  { kind: 'wink', setting: 'tip_wink', fallback: 1 },
  { kind: 'kiss', setting: 'tip_kiss', fallback: 5 },
  { kind: 'dance', setting: 'tip_dance', fallback: 15 },
  { kind: 'party', setting: 'tip_party', fallback: 50 },
];

// How many tokens a reaction needs, from the broadcaster's settings. A cleared setting (null) means "off"; a setting that was never filled in
// (undefined, for an app installed before it existed) means the default.
function tokensFor(r, settings) {
  var v = settings[r.setting];
  if (v === undefined) return r.fallback;
  if (v === null || !isFinite(Number(v)) || Number(v) < 1) return 0;
  return Math.round(Number(v));
}

// Which reaction a tip of `tokens` sets off: the priciest one it reaches. A tip below all of them still gets a little wink, so every tip is
// answered.
function pickReaction(tokens, settings) {
  var best = null;
  var bestNeed = 0;
  for (var i = 0; i < REACTIONS.length; i++) {
    var need = tokensFor(REACTIONS[i], settings);
    if (need > 0 && tokens >= need && need >= bestNeed) {
      best = REACTIONS[i].kind;
      bestNeed = need;
    }
  }
  return best || 'wink';
}

// A chat command ("/kiss", "/wink", "/dance", "/party") as a reaction, or null. They are free: just something for the room to play with.
function commandReaction(text) {
  var m = /^[\/!](wink|kiss|dance|party|hi)\b/i.exec(String(text).trim());
  return m ? (m[1].toLowerCase() === 'hi' ? 'wink' : m[1].toLowerCase()) : null;
}

// The tip menu as lines of text for the overlay: [{ kind, tokens }], cheapest first, switched-off ones left out.
function menuOf(settings) {
  var out = [];
  for (var i = 0; i < REACTIONS.length; i++) {
    var need = tokensFor(REACTIONS[i], settings);
    if (need > 0) out.push({ kind: REACTIONS[i].kind, tokens: need });
  }
  out.sort(function (a, b) {
    return a.tokens - b.tokens;
  });
  return out;
}
