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
// The painted rooms (art/rooms/*.webp) baked in as image addresses, since the overlay may not load files of its own. The dusk sky needs none.
const ROOMS_DIR = path.join(ROOT, 'art', 'rooms');
const roomNames = fs.existsSync(ROOMS_DIR) ? fs.readdirSync(ROOMS_DIR).filter(f => f.endsWith('.webp')).sort() : [];
const rooms =
  '// The painted rooms for the console screen, made by tools/build.js from art/rooms (do not edit by hand).\nvar AFTERLIVES_ROOMS = {\n' +
  roomNames.map(f => '  ' + f.replace(/\.webp$/, '') + ": 'data:image/webp;base64," + fs.readFileSync(path.join(ROOMS_DIR, f)).toString('base64') + "',").join('\n') +
  '\n};\n';
// the overlay's JS slot is the rooms, the console (its shapes and colors), then the cryptid itself
const js = rooms + read('overlay/console.js') + '\n' + read('overlay/overlay.js');

// the slots, named as the IDE names them
write('1-app-shared-code.js', shared);
write('2-handler-tip-received.js', read('handlers/tip-received.js'));
write('3-handler-chat-message.js', read('handlers/chat-message.js'));
write('4-handler-user-enter.js', read('handlers/user-enter.js'));
write('5-handler-fanclub-join.js', read('handlers/fanclub-join.js'));
write('6-overlay-cryptid-html.html', html);
write('7-overlay-cryptid-js.js', js);
write('8-overlay-shared-code.js', shared); // the overlay's own shared-code slot gets the same functions (it cannot see the app's)

const preview = `<!doctype html>
<html><head><meta charset="utf-8"><title>Cryptid overlay preview</title>
<style>
  body { margin: 0; color: #e9dcff; font-family: ui-monospace, Menlo, Consolas, monospace; }
  .page { background: #1c1230; min-height: 100vh; }
  .wrap { max-width: 520px; margin: 0 auto; padding: 14px; }
  h1 { font-size: 16px; text-align: center; }
  #box { position: relative; width: 480px; height: 360px; margin: 0 auto; border: 2px solid #4b3a68; border-radius: 10px; overflow: hidden;
    background-color: #3a3150; background-image: linear-gradient(45deg,#2f2742 25%,transparent 25%,transparent 75%,#2f2742 75%),linear-gradient(45deg,#2f2742 25%,transparent 25%,transparent 75%,#2f2742 75%); background-size: 24px 24px; background-position: 0 0,12px 12px; }
  .row { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0; justify-content: center; }
  button { background: #3d2a63; color: #fff; border: 2px solid #b79cff; border-radius: 6px; padding: 7px 10px; font: inherit; cursor: pointer; }
  small { display: block; text-align: center; color: #a994c6; }
</style></head>
<body><div class="page"><div class="wrap">
<h1>CRYPTID OVERLAY (preview)</h1>
<div id="box">${html}</div>
<div class="row" id="tips"></div>
<div class="row" id="chars"></div>
<div class="row" id="shapes"></div>
<div class="row" id="colors"></div>
<div class="row" id="rooms"></div>
<small>The checks show it is see-through. Settings in the address: ?character=boo&amp;console_shape=heart&amp;console_color=ghoul_gum&amp;show_menu=1</small>
</div></div>
<script>
// a pretend Chaturbate: $settings from the address, and an $overlay that hands events straight to the overlay's handlers
var q = new URLSearchParams(location.search);
var $settings = {};
q.forEach(function (v, k) { $settings[k] = v === 'true' || v === '1' ? (/^[0-9]+$/.test(v) && k.indexOf('tip_') === 0 ? Number(v) : true) : v === 'false' || v === '0' ? (k.indexOf('tip_') === 0 ? 0 : false) : /^[0-9]+$/.test(v) ? Number(v) : v; });
var $handlers = {};
var $overlay = { on: function (n, cb) { $handlers[n] = cb; }, emit: function (n, d) { if ($handlers[n]) $handlers[n](d); } };
</script>
<script>${shared}</script>
<script>${js}</script>
<script>
var tipRow = document.getElementById('tips');
[1, 5, 15, 50].forEach(function (n) {
  var b = document.createElement('button');
  b.textContent = 'tip ' + n + ' -> ' + pickReaction(n, $settings);
  b.onclick = function () { $overlay.emit('react', { kind: pickReaction(n, $settings), user: 'Viewer', amount: n }); };
  tipRow.appendChild(b);
});
['wink', 'kiss', 'dance', 'party', 'hello'].forEach(function (k) {
  var b = document.createElement('button');
  b.textContent = '/' + k;
  b.onclick = function () { $overlay.emit('react', { kind: k, user: 'Viewer', amount: 0 }); };
  tipRow.appendChild(b);
});
var chars = document.getElementById('chars');
['lumi', 'boo', 'bigfoot'].forEach(function (c) {
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
console.log('built dist/: 8 slot files and preview.html (' + roomNames.length + ' rooms, overlay JS ' + Math.round(js.length / 1024) + ' KB)');
