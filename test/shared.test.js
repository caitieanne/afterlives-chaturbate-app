// Run with: node test/shared.test.js   (no dependencies)
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'shared.js'), 'utf8'), ctx);
const { pickReaction, commandReaction, menuOf, goalOf, goalStep, idleEverySeconds, noticeAllowed, menuEveryMinutes, menuNotice, characterName, subjectText } = ctx;

const defaults = {};
const at = n => pickReaction(n, defaults);
assert.strictEqual(at(1), 'wink');
assert.strictEqual(at(2), 'wink');
assert.strictEqual(at(3), 'blush');
assert.strictEqual(at(4), 'blush');
assert.strictEqual(at(5), 'kiss');
assert.strictEqual(at(9), 'kiss');
assert.strictEqual(at(10), 'vibe');
assert.strictEqual(at(14), 'vibe');
assert.strictEqual(at(15), 'dance');
assert.strictEqual(at(24), 'dance');
assert.strictEqual(at(25), 'smooch');
assert.strictEqual(at(34), 'smooch');
assert.strictEqual(at(35), 'twerk');
assert.strictEqual(at(49), 'twerk');
assert.strictEqual(at(50), 'party');
assert.strictEqual(at(5000), 'party');
assert.strictEqual(at(0), 'wink', 'a tiny tip is still answered');

// the broadcaster's own amounts
const mine = { tip_wink: 2, tip_blush: 0, tip_kiss: 10, tip_vibe: 0, tip_dance: 0, tip_smooch: 0, tip_twerk: 0, tip_party: 100 };
assert.strictEqual(pickReaction(1, mine), 'wink', 'below everything still winks');
assert.strictEqual(pickReaction(10, mine), 'kiss');
assert.strictEqual(pickReaction(99, mine), 'kiss', 'dance is off, so 99 stays a kiss');
assert.strictEqual(pickReaction(100, mine), 'party');

// a cleared setting is off; a setting that never existed is the default
assert.strictEqual(pickReaction(50, { tip_party: null }), 'twerk');
assert.strictEqual(pickReaction(5, { tip_wink: null, tip_kiss: undefined }), 'kiss');
// two with the same amount: the later (pricier tier) wins
assert.strictEqual(pickReaction(10, { tip_kiss: 10, tip_dance: 10 }), 'dance');

assert.strictEqual(commandReaction('/kiss'), 'kiss');
assert.strictEqual(commandReaction('!DANCE now'), 'dance');
assert.strictEqual(commandReaction('/hi'), 'wink');
assert.strictEqual(commandReaction('hello /kiss'), null);
assert.strictEqual(commandReaction('/kisses'), null);

assert.strictEqual(menuOf(mine).map(m => m.kind + ':' + m.tokens).join(','), 'wink:2,kiss:10,party:100');
assert.strictEqual(menuOf(defaults).length, 8);

// the tip goal
assert.strictEqual(goalOf({}), 0, 'no goal unless the broadcaster sets one');
assert.strictEqual(goalOf({ tip_goal: 500 }), 500);
assert.strictEqual(goalOf({ tip_goal: 'abc' }), 0);
assert.deepStrictEqual({ ...goalStep(100, 50, 500, true) }, { progress: 150, reached: false });
assert.deepStrictEqual({ ...goalStep(480, 50, 500, true) }, { progress: 30, reached: true }, 'reached, and the spill-over starts the next round');
assert.deepStrictEqual({ ...goalStep(480, 50, 500, false) }, { progress: 500, reached: true }, 'reached once and stays full');
assert.deepStrictEqual({ ...goalStep(500, 50, 500, false) }, { progress: 500, reached: false }, 'not celebrated twice');
assert.deepStrictEqual({ ...goalStep(0, 500, 500, true) }, { progress: 0, reached: true }, 'an exact tip reaches it');
assert.deepStrictEqual({ ...goalStep(10, 5, 0, true) }, { progress: 10, reached: false }, 'no goal, nothing happens');

// how chatty it is
assert.strictEqual(idleEverySeconds({}), 600, 'six times an hour by default');
assert.strictEqual(idleEverySeconds({ speak_per_hour: 12 }), 300);
assert.strictEqual(idleEverySeconds({ speak_per_hour: 0 }), 0, 'zero: only when someone plays');
assert.strictEqual(idleEverySeconds({ speak_per_hour: 500 }), 60, 'never more than once a minute');
const hour = 3600000;
let n = noticeAllowed([], 0, {});
assert.ok(n.ok);
const ten = Array.from({ length: 10 }, (_, i) => i * 1000);
assert.strictEqual(noticeAllowed(ten, 20000, {}).ok, false, 'ten an hour by default');
assert.strictEqual(noticeAllowed(ten, hour + 5000, {}).ok, true, 'old ones age out after an hour');
assert.strictEqual(noticeAllowed([], 0, { chat_notices_per_hour: 0 }).ok, false, 'zero: no chat notices');
assert.strictEqual(noticeAllowed([1, 2], 3, { chat_notices_per_hour: 3 }).stamps.length, 3);

// the tip menu in chat
assert.strictEqual(menuEveryMinutes({}), 10, 'every ten minutes by default');
assert.strictEqual(menuEveryMinutes({ tip_menu_in_chat: false }), 0, 'switched off');
assert.strictEqual(menuEveryMinutes({ tip_menu_every: 1 }), 2, 'never more than every two minutes');
assert.strictEqual(menuEveryMinutes({ tip_menu_every: 0 }), 0);
assert.strictEqual(menuNotice({}, "Peachy", 0), "💋 Peachy's tip menu: Wink 1 | Blush 3 | Kiss 5 | Vibe 10 | Dance 15 | Smooch 25 | Twerk 35 | Party 50");
assert.ok(menuNotice({ tip_goal: 500, tip_goal_name: 'New ring light' }, 'Eggy', 120).endsWith('New ring light: 120/500'), 'with the goal');

// the goal in the room subject
assert.strictEqual(subjectText({}, 50), '', 'no goal, the subject is left alone');
assert.strictEqual(subjectText({ tip_goal: 500, tip_goal_name: 'New ring light' }, 120), '\u{1F3AF} New ring light: 120/500');
assert.strictEqual(subjectText({ tip_goal: 500, tip_goal_name: 'New ring light', room_subject: ' Spooky night ' }, 120), 'Spooky night  \u{1F3AF} New ring light: 120/500');
assert.strictEqual(subjectText({ tip_goal: 500 }, 900), '\u{1F3AF} Tip goal: 500/500', 'never shows more than the goal');
assert.strictEqual(subjectText({ tip_goal: 500, goal_in_subject: false }, 120), '', 'the broadcaster can turn it off');
assert.strictEqual(characterName({ character: 'The Cherries' }), 'The Cherries');
assert.strictEqual(characterName({ character: 'Eggy', pet_name: 'Mr Purple' }), 'Mr Purple');
// settings: nested sections are lifted out, and the testbed's flat settings object, whose keys cannot be listed, comes back as it is
assert.strictEqual(ctx.flattenSettings({ section_goal: { tip_goal: 50 }, room: 'Zen' }).tip_goal, 50);
const unlistable = new Proxy({}, { get: (t, k) => ({ tip_goal: 100, character: 'Eggy' })[k] });
assert.strictEqual(ctx.flattenSettings(unlistable).tip_goal, 100, 'unlistable settings still read');
assert.strictEqual(goalOf(ctx.flattenSettings(unlistable)), 100);

console.log('shared.js: all checks passed');

// the console: every shape and color resolves, and every shape's path is whole numbers, not NaN
const C = require('../src/overlay/console.js');
for (const name of ['coffin', 'moon', 'heart', 'star', 'box', 'diamond', 'harlequin', 'circle']) {
  const shape = C.shapeOf(name);
  assert.ok(shape, name);
  const d = C.pathText(shape.path, 3, 10, 10);
  assert.ok(!/NaN|undefined/.test(d), name + ' path is drawable');
  assert.ok(shape.safe[0] < shape.safe[2] && shape.safe[1] < shape.safe[3], name + ' has room for the cryptid');
  const L = C.layout(shape, 480, 360);
  assert.ok(L.x >= 0 && L.y >= 0 && L.w <= 480 && L.h <= 360, name + ' fits the overlay');
}
assert.strictEqual(C.shapeOf('none'), null, 'no console');
assert.strictEqual(C.shapeOf(undefined), C.SHAPES.coffin, 'the coffin by default');
assert.strictEqual(C.shapeOf('Crescent Moon'), C.SHAPES.moon);
assert.strictEqual(C.shapeOf('blob'), C.SHAPES.coffin, 'an unknown shape is the coffin');
assert.strictEqual(C.colorOf('Blue Raspberry').id, 'blue_raspberry');
assert.strictEqual(C.colorOf('nope').id, 'violet', 'an unknown color is Violet');
assert.strictEqual(C.COLORS.length, 10);
assert.strictEqual(C.roomOf('dusk'), null, 'dusk is the drawn sky');
assert.strictEqual(C.roomOf(undefined), null, 'the dusk sky by default');
// every painted room has its art file; the portal overlay names each by its uploaded image template (the portal blocks images baked
// in), and the preview bakes them in
const roomFiles = fs.readdirSync(path.join(__dirname, '..', 'art', 'rooms')).filter(f => f.endsWith('.webp'));
assert.strictEqual(roomFiles.length, 17);
const slot = fs.readFileSync(path.join(__dirname, '..', 'dist', '7-overlay-cryptid-js.js'), 'utf8');
const preview = fs.readFileSync(path.join(__dirname, '..', 'dist', 'preview.html'), 'utf8');
for (const f of roomFiles) {
  assert.ok(new RegExp('  ' + f.replace('.webp', '') + ": '\\{image:[0-9a-f]{40}\\.webp\\}'").test(slot), f + ' is in the overlay as an uploaded image');
  assert.ok(preview.includes('  ' + f.replace('.webp', '') + ": 'data:image/webp;base64,"), f + ' is baked into the preview');
}
assert.ok(!/data:image/.test(slot), 'the overlay has no baked-in images (the portal blocks them)');
assert.ok(!/[^\x00-\x7f]/.test(slot), 'the overlay is plain ASCII, so it pastes the same in any encoding');
console.log('console.js: all checks passed');

// the characters' life in their room: every painted room has its spots, and they never pick the spot they are already at
const L = require('../src/overlay/life.js');
for (const f of fs.readdirSync(path.join(__dirname, '..', 'art', 'rooms')).filter(f => f.endsWith('.webp'))) {
  const r = L.ROOMS[f.replace('.webp', '')];
  assert.ok(r, f + ' has spots');
  assert.ok(r.rug && r.window, f + ' has a rug and a window spot');
  for (const n of ['lounge', 'desk', 'rug', 'window']) if (r[n]) assert.ok(r[n][1] >= r.back && r[n][1] <= r.front, f + ' ' + n + ' is on the floor');
}
assert.ok(L.depthScale(L.ROOMS.cyber, 0.58) < L.depthScale(L.ROOMS.cyber, 0.9), 'smaller further back');
for (let i = 0; i < 20; i++) assert.notStrictEqual(L.nextSpot(L.ROOMS.cyber, 'desk'), 'desk', 'never the same spot again');
assert.strictEqual(L.nextSpot(L.ROOMS.gym, 'rug'), 'window', 'a bare room still has somewhere to go');
console.log('life.js: all checks passed');

// the settings page: every choice on it means something to the code
const page = require('../tools/settings.js')();
for (const label of page.section_look.settings.room.enum) {
  const id = C.roomKeyOf(label);
  assert.ok(id === 'dusk' ? label === 'Dusk sky' : !!L.ROOMS[id], label + ' is a room');
}
for (const label of page.section_look.settings.console_shape.enum) assert.ok(label === 'No console' ? C.shapeOf(label) === null : !!C.shapeOf(label), label + ' is a shape');
for (const c of page.section_look.settings.console_color.enum) assert.strictEqual(C.colorOf(Object.keys(c)[0]).name, Object.values(c)[0]);
assert.strictEqual(C.shapeOf('Crescent moon'), C.SHAPES.moon);
// the console keeps to its corner, never the middle of the stream
for (const corner of C.CORNERS.map(c => c[0])) {
  for (const name of Object.keys(C.SHAPES)) {
    const L = C.layout(C.SHAPES[name], 1920, 1080, corner);
    const top = L.y - L.edge, bottom = L.y + L.h + L.edge, left = L.x - L.edge, right = L.x + L.w + L.edge;
    assert.ok(bottom - top <= 1080 * 0.381, name + ' is about a third of the stream tall');
    assert.ok(left >= 0 && right <= 1920 && top >= 0 && bottom <= 1080, name + ' stays on the stream');
    assert.ok(corner.includes('right') ? left > 1920 / 2 : right < 1920 / 2, name + ' keeps to its side in ' + corner);
  }
}
assert.strictEqual(C.cornerOf('Top left'), 'top_left');
assert.strictEqual(C.cornerOf(undefined), 'bottom_right');
console.log('settings page: all checks passed');
