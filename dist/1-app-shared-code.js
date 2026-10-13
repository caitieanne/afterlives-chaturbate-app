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

// ---- the tip goal (the broadcaster's own, from the app settings: Chaturbate does not give apps the room's goal) ----

// The goal in tokens, or 0 when there is none (the default).
function goalOf(settings) {
  var v = Number(settings.tip_goal);
  return isFinite(v) && v >= 1 ? Math.round(v) : 0;
}

// Adds a tip to the goal. Returns the new progress and whether this tip reached the goal. With `repeat` (the default) the goal starts again
// with whatever spilled over; without it, the goal stays full and is not celebrated twice.
function goalStep(progress, tokens, goal, repeat) {
  progress = Math.max(0, Number(progress) || 0);
  if (!(goal > 0)) return { progress: progress, reached: false };
  if (!repeat && progress >= goal) return { progress: goal, reached: false };
  var next = progress + Math.max(0, Number(tokens) || 0);
  if (next < goal) return { progress: next, reached: false };
  return { progress: repeat ? next % goal : goal, reached: true };
}

// ---- how chatty it is ----

// How many seconds between the things the cryptid says on its own, from "speak_per_hour" (6 a hour by default; 0 or empty: only when someone
// plays with it). At most once a minute.
function idleEverySeconds(settings) {
  var v = settings.speak_per_hour;
  if (v === undefined) v = 6;
  v = Number(v);
  if (!isFinite(v) || v <= 0) return 0;
  return Math.round(3600 / Math.min(60, v));
}

// Whether the app may send another chat notice now, given the times (ms) of the ones it sent recently, keeping to "chat_notices_per_hour" (10 by
// default; 0 or empty: none). Returns the times to keep, with now added when it may.
function noticeAllowed(stamps, now, settings) {
  var cap = settings.chat_notices_per_hour;
  if (cap === undefined) cap = 10;
  cap = Number(cap);
  var recent = (Array.isArray(stamps) ? stamps : []).filter(function (t) {
    return now - t < 3600000;
  });
  if (!isFinite(cap) || cap < 1 || recent.length >= cap) return { ok: false, stamps: recent };
  recent.push(now);
  return { ok: true, stamps: recent };
}

// Sends a chat notice if the hourly cap allows it (event handlers only: it uses $kv and $room).
function sendCappedNotice(text) {
  var check = noticeAllowed($kv.get('notice_times', []), Date.now(), $settings);
  $kv.set('notice_times', check.stamps);
  if (check.ok) $room.sendNotice(text);
}

// The goal as the overlay shows it.
function goalState(progress) {
  return { progress: progress, goal: goalOf($settings), name: String($settings.tip_goal_name || 'Tip goal').slice(0, 30) };
}
