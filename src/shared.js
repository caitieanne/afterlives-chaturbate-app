// SHARED CODE (the app's "Shared code" slot). It runs before every event handler, so the handlers can call these. Plain functions only: anything
// that has to survive between events lives in $kv, never in a variable here.

// The settings page groups settings into sections (fieldsets, see dist/0-advanced-settings.json). In case Chaturbate hands them back nested
// under their section rather than flat, lift them out, so $settings.room works either way. On the testbed they come flat, in an object
// whose keys cannot be listed (so a copy made by going through its keys is empty): when there is nothing to lift, hand back the original.
function flattenSettings(s) {
  var out = {};
  var nested = false;
  for (var k in s) {
    var v = s[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      nested = true;
      for (var k2 in v) out[k2] = v[k2];
    } else out[k] = v;
  }
  return nested ? out : s;
}
if (typeof $settings === 'object' && $settings) {
  try {
    var flatSettings = flattenSettings($settings);
    for (var fk in flatSettings) $settings[fk] = flatSettings[fk];
  } catch (e) {
    // read-only: the handlers read flat settings already
  }
}

// The reactions a tip can set off, cheapest first. Each has a setting (tokens it needs; 0 or empty turns it off).
var REACTIONS = [
  { kind: 'wink', setting: 'tip_wink', fallback: 1 },
  { kind: 'kiss', setting: 'tip_kiss', fallback: 5 },
  { kind: 'dance', setting: 'tip_dance', fallback: 15 },
  { kind: 'smooch', setting: 'tip_smooch', fallback: 25 }, // walks right up to the camera and kisses the screen
  { kind: 'twerk', setting: 'tip_twerk', fallback: 35 },
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

// ---- the tip menu in chat (like Lovense: posted every few minutes, not shown on the overlay, which stays in its corner) ----

var MENU_LABEL = { wink: 'Wink', kiss: 'Kiss', dance: 'Dance', smooch: 'Smooch', twerk: 'Twerk', party: 'Party' };

// How often the menu goes in chat, in minutes (10 by default; 0 or empty: never). At least once every 2 minutes, at most every 2 hours.
function menuEveryMinutes(settings) {
  if (settings.tip_menu_in_chat === false) return 0;
  var v = settings.tip_menu_every;
  if (v === undefined) v = 10;
  v = Number(v);
  if (!isFinite(v) || v <= 0) return 0;
  return Math.max(2, Math.min(120, Math.round(v)));
}

// The tip menu as one chat line, with the goal when there is one: "Peachy's tip menu: Wink 1 | Kiss 5 | ... Goal: New ring light 120/500"
function menuNotice(settings, name, goalProgress) {
  var items = menuOf(settings).map(function (m) {
    return MENU_LABEL[m.kind] + ' ' + m.tokens;
  });
  var text = '\u{1F48B} ' + name + "'s tip menu: " + items.join(' | ');
  var goal = goalOf(settings);
  if (goal) text += '  \u{1F3AF} ' + String(settings.tip_goal_name || 'Tip goal').slice(0, 30) + ': ' + Math.min(goal, Math.max(0, Number(goalProgress) || 0)) + '/' + goal;
  return text;
}

// (Re)starts the timer that posts the menu in chat (event handlers only: it uses $callback).
function startMenuTimer() {
  try {
    $callback.cancel('tip_menu');
  } catch (e) {
    // nothing to cancel yet
  }
  var mins = menuEveryMinutes($settings);
  if (mins) $callback.create('tip_menu', mins * 60, true);
}

// The broadcaster sets how often the menu goes in chat, so it is not held to (and does not use up) the hourly cap on the app's other notices.
// Posts the tip menu in chat now, if the broadcaster has it on (event handlers only: it uses $kv and $room).
function postMenu() {
  if (menuEveryMinutes($settings)) $room.sendNotice(menuNotice($settings, characterName($settings), $kv.get('goal_progress', 0)));
}

// The character's name as chat should call it.
function characterName(settings) {
  var names = { peachy: 'Peachy', cherries: 'The Cherries', eggy: 'Eggy', bananzo: 'Bananzo' };
  var key = String(settings.character || '').toLowerCase().replace(/[^a-z]/g, '').replace(/^the/, '');
  return String(settings.pet_name || names[key] || 'Peachy').slice(0, 16);
}
