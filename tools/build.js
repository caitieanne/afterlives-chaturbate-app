#!/usr/bin/env node
// Builds dist/: one file for each slot of the Chaturbate Developer Portal IDE (so you can copy and paste each into its slot), and a
// preview page that runs the overlay against a pretend $overlay and $settings, so it can be tried (and its tip rules too) without Chaturbate.
//   node tools/build.js
// Then open dist/preview.html in a browser. Add ?character=boo or ?character=bigfoot, &show_menu=1, &tip_wink=2&tip_kiss=10 ... to try settings.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const read = p => fs.readFileSync(path.join(SRC, p), 'utf8').replace(/\r\n/g, '\n');
fs.mkdirSync(DIST, { recursive: true });
const write = (name, text) => fs.writeFileSync(path.join(DIST, name), text);

const shared = read('shared.js');
const html = read('overlay/overlay.html');
// The art: the painted rooms (art/rooms/*.webp; the dusk sky needs none) and the characters' animation strips (made by
// tools/pack-characters.js from the PixelLab frames). The portal's overlay may only show images uploaded to the app (its Images
// section), named by a template like {image:<hash>.webp} that Chaturbate turns into a link; art/portal-images.json has the template
// hash of every uploaded file. The preview has no portal, so it gets the same art baked in as image addresses instead.
const IMAGES_FILE = path.join(ROOT, 'art', 'portal-images.json');
const portalImages = fs.existsSync(IMAGES_FILE) ? JSON.parse(fs.readFileSync(IMAGES_FILE, 'utf8')) : {};
function artSrc(file, key, forPortal) {
  if (!forPortal) return 'data:image/webp;base64,' + fs.readFileSync(file).toString('base64');
  if (!portalImages[key]) throw new Error(key + ' is not uploaded to the portal: upload it in the IDE (Images) and add its template hash to art/portal-images.json');
  return '{image:' + portalImages[key] + '.webp}';
}
const ROOMS_DIR = path.join(ROOT, 'art', 'rooms');
const roomNames = fs.existsSync(ROOMS_DIR) ? fs.readdirSync(ROOMS_DIR).filter(f => f.endsWith('.webp')).sort() : [];
const roomsJs = forPortal =>
  '// The painted rooms for the console screen, made by tools/build.js from art/rooms (do not edit by hand).\nvar AFTERLIVES_ROOMS = {\n' +
  roomNames.map(f => '  ' + f.replace(/\.webp$/, '') + ": '" + artSrc(path.join(ROOMS_DIR, f), 'room-' + f.replace(/\.webp$/, ''), forPortal) + "',").join('\n') +
  '\n};\n';
const CHARS_DIR = path.join(ROOT, 'art', 'characters');
const charManifest = fs.existsSync(path.join(CHARS_DIR, 'characters.json')) ? JSON.parse(fs.readFileSync(path.join(CHARS_DIR, 'characters.json'), 'utf8')) : {};
function charsJs(forPortal) {
  const out = {};
  for (const [name, chr] of Object.entries(charManifest)) {
    const anims = {};
    for (const [anim, opt] of Object.entries(chr.anims)) {
      const frames = fs.readdirSync(path.join(CHARS_DIR, name, anim)).filter(f => /^\d+\.png$/.test(f)).length;
      anims[anim] = { src: artSrc(path.join(CHARS_DIR, name, anim + '.webp'), name + '-' + anim, forPortal), n: frames, fps: opt.fps || 8 };
    }
    const cellFile = path.join(CHARS_DIR, name, 'cell.json');
    out[name] = { name: chr.name, cell: fs.existsSync(cellFile) ? JSON.parse(fs.readFileSync(cellFile, 'utf8')).cell : 124, anims };
  }
  return '// The characters and their animations, made by tools/build.js from art/characters (do not edit by hand).\nvar AFTERLIVES_CHARS = ' + JSON.stringify(out) + ';\n';
}
// the overlay's JS slot is the rooms, the characters, the console (its shapes and colors), their life in the room, then the overlay itself
// (less their "module.exports" lines, which are only for the tests in Node and which the portal marks as errors)
const noExports = text => text.replace(/^if \(typeof module !== 'undefined'.*\n/gm, '');
const code = noExports(read('overlay/console.js')) + '\n' + noExports(read('overlay/life.js')) + '\n' + read('overlay/overlay.js');
// emoji and other non-ASCII characters written as escapes, so the file pastes the same whatever text encoding a copy step assumes
const asciiOnly = text => text.replace(/[^\x00-\x7f]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const js = asciiOnly(roomsJs(true) + charsJs(true) + code);
const previewJs = roomsJs(false) + charsJs(false) + code;

// the settings page: paste into the IDE's Advanced Settings (one paste instead of creating every setting by hand)
write('0-advanced-settings.json', JSON.stringify(require('./settings.js')(), null, 2) + '\n');

// the slots, named as the IDE names them
write('1-app-shared-code.js', shared);
write('2-handler-tip-received.js', read('handlers/tip-received.js'));
write('3-handler-chat-message.js', read('handlers/chat-message.js'));
write('4-handler-user-enter.js', read('handlers/user-enter.js'));
write('5-handler-fanclub-join.js', read('handlers/fanclub-join.js'));
write('9-handler-broadcast-start.js', read('handlers/broadcast-start.js'));
write('10-handler-app-start.js', read('handlers/app-start.js'));
write('11-handler-app-settings-change.js', read('handlers/settings-change.js'));
write('12-handler-callback.js', read('handlers/callback.js'));
write('6-overlay-cryptid-html.html', html);
write('7-overlay-cryptid-js.js', js);
// the overlay's own shared-code slot gets the same functions (it cannot see the app's), less the two that only event handlers can run:
// the overlay has no $callback, $room or $kv.set, and the portal marks those as errors there
const overlayShared = shared.replace(/\n\/\/ [^\n]*\(event handlers only[^\n]*\nfunction \w+\([^)]*\) \{\n[\s\S]*?\n\}\n/g, '\n');
if (/\$callback|\$room|\$kv\.set/.test(overlayShared)) throw new Error('the overlay shared code still uses an event-handler-only API');
write('8-overlay-shared-code.js', overlayShared);

const preview = `<!doctype html>
<html><head><meta charset="utf-8"><title>Cryptid overlay preview</title>
<style>
  body { margin: 0; color: #e9dcff; font-family: ui-monospace, Menlo, Consolas, monospace; }
  .page { background: #1c1230; min-height: 100vh; }
  .wrap { max-width: 680px; margin: 0 auto; padding: 14px; }
  h1 { font-size: 16px; text-align: center; }
  #box { position: relative; width: 640px; height: 360px; margin: 0 auto; border: 2px solid #4b3a68; border-radius: 10px; overflow: hidden;
    background-color: #3a3150; background-image: linear-gradient(45deg,#2f2742 25%,transparent 25%,transparent 75%,#2f2742 75%),linear-gradient(45deg,#2f2742 25%,transparent 25%,transparent 75%,#2f2742 75%); background-size: 24px 24px; background-position: 0 0,12px 12px; }
  .row { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0; justify-content: center; }
  button { background: #3d2a63; color: #fff; border: 2px solid #b79cff; border-radius: 6px; padding: 7px 10px; font: inherit; cursor: pointer; }
  small { display: block; text-align: center; color: #a994c6; }
</style></head>
<body><div class="page"><div class="wrap">
<h1>CRYPTID OVERLAY (preview)</h1>
<div id="box">${html}</div>
<div id="chat" style="width:640px;margin:8px auto 0;height:72px;overflow:auto;background:#140c22;border:2px solid #4b3a68;border-radius:8px;padding:6px 8px;font-size:12px;color:#d8c8f0"><b>chat (pretend)</b></div>
<div class="row"><button onclick="postMenu()">post the tip menu in chat</button></div>
<div class="row" id="tips"></div>
<div class="row" id="chars"></div>
<div class="row" id="shapes"></div>
<div class="row" id="colors"></div>
<div class="row" id="rooms"></div>
<small>The checks show it is see-through. Settings in the address: ?character=boo&amp;console_shape=heart&amp;console_color=bubblegum&amp;show_menu=1</small>
</div></div>
<script>
// a pretend Chaturbate: $settings from the address, and an $overlay that hands events straight to the overlay's handlers
var q = new URLSearchParams(location.search);
var $settings = {};
q.forEach(function (v, k) { $settings[k] = v === 'true' || v === '1' ? (/^[0-9]+$/.test(v) && k.indexOf('tip_') === 0 ? Number(v) : true) : v === 'false' || v === '0' ? (k.indexOf('tip_') === 0 ? 0 : false) : /^[0-9]+$/.test(v) ? Number(v) : v; });
var $handlers = {};
var $overlay = { on: function (n, cb) { $handlers[n] = cb; }, emit: function (n, d) { if ($handlers[n]) $handlers[n](d); } };
// a pretend chat, so the tip menu notices show up
var $room = { sendNotice: function (t) { var c = document.getElementById('chat'); var d = document.createElement('div'); d.textContent = 'Notice: ' + t; c.appendChild(d); c.scrollTop = 1e9; } };
function postMenu() { $room.sendNotice(menuNotice($settings, characterName($settings), $kv.get('goal_progress', 0))); }
// a pretend $kv, so the tip buttons can count toward the goal the way the Tip Received handler does
var $kvData = {};
var $kv = { get: function (k, d) { return k in $kvData ? $kvData[k] : d; }, set: function (k, v) { $kvData[k] = v; } };
function previewTip(n) {
  var goal = goalOf($settings);
  var step = goal ? goalStep($kv.get('goal_progress', 0), n, goal, $settings.goal_repeats !== false) : null;
  if (step) {
    $kv.set('goal_progress', step.progress);
    $overlay.emit('goal', { progress: step.progress, goal: goal, name: $settings.tip_goal_name || 'Tip goal' });
  }
  if (step && step.reached) $overlay.emit('react', { kind: 'goal', user: 'Viewer', amount: n, goal: $settings.tip_goal_name || 'Tip goal' });
  else $overlay.emit('react', { kind: pickReaction(n, $settings), user: 'Viewer', amount: n });
}
</script>
<script>${shared}</script>
<script>${previewJs}</script>
<script>
var tipRow = document.getElementById('tips');
[1, 5, 15, 25, 35, 50].forEach(function (n) {
  var b = document.createElement('button');
  b.textContent = 'tip ' + n + ' -> ' + pickReaction(n, $settings);
  b.onclick = function () { previewTip(n); };
  tipRow.appendChild(b);
});
['wink', 'kiss', 'dance', 'party', 'hello'].forEach(function (k) {
  var b = document.createElement('button');
  b.textContent = '/' + k;
  b.onclick = function () { $overlay.emit('react', { kind: k, user: 'Viewer', amount: 0 }); };
  tipRow.appendChild(b);
});
var chars = document.getElementById('chars');
Object.keys(typeof AFTERLIVES_CHARS === 'object' ? AFTERLIVES_CHARS : {}).concat(['lumi', 'boo', 'bigfoot']).forEach(function (c) {
  var b = document.createElement('button');
  b.textContent = 'show ' + c;
  b.onclick = function () { q.set('character', c); location.search = q.toString(); };
  chars.appendChild(b);
});
function pick(rowId, key, list) {
  var row = document.getElementById(rowId);
  list.forEach(function (v) {
    var b = document.createElement('button');
    b.textContent = v;
    if (($settings[key] || '') === v) b.style.background = '#8b5fa8';
    b.onclick = function () { q.set(key, v); location.search = q.toString(); };
    row.appendChild(b);
  });
}
pick('shapes', 'console_shape', ['coffin', 'moon', 'heart', 'star', 'box', 'diamond', 'harlequin', 'circle', 'none']);
pick('colors', 'console_color', AfterlivesConsole.COLORS.map(function (c) { return c.id; }));
pick('rooms', 'room', ['dusk'].concat(Object.keys(typeof AFTERLIVES_ROOMS === 'object' ? AFTERLIVES_ROOMS : {})));
</script>
</body></html>
`;
write('preview.html', preview);
console.log('built dist/: advanced settings, 12 slot files and preview.html (' + roomNames.length + ' rooms, overlay JS ' + Math.round(js.length / 1024) + ' KB)');
