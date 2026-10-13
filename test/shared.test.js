// Run with: node test/shared.test.js   (no dependencies)
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'shared.js'), 'utf8'), ctx);
const { pickReaction, commandReaction, menuOf } = ctx;

const defaults = {};
const at = n => pickReaction(n, defaults);
assert.strictEqual(at(1), 'wink');
assert.strictEqual(at(4), 'wink');
assert.strictEqual(at(5), 'kiss');
assert.strictEqual(at(14), 'kiss');
assert.strictEqual(at(15), 'dance');
assert.strictEqual(at(49), 'dance');
assert.strictEqual(at(50), 'party');
assert.strictEqual(at(5000), 'party');
assert.strictEqual(at(0), 'wink', 'a tiny tip is still answered');

// the broadcaster's own amounts
const mine = { tip_wink: 2, tip_kiss: 10, tip_dance: 0, tip_party: 100 };
assert.strictEqual(pickReaction(1, mine), 'wink', 'below everything still winks');
assert.strictEqual(pickReaction(10, mine), 'kiss');
assert.strictEqual(pickReaction(99, mine), 'kiss', 'dance is off, so 99 stays a kiss');
assert.strictEqual(pickReaction(100, mine), 'party');

// a cleared setting is off; a setting that never existed is the default
assert.strictEqual(pickReaction(50, { tip_party: null }), 'dance');
assert.strictEqual(pickReaction(5, { tip_wink: null, tip_kiss: undefined }), 'kiss');
// two with the same amount: the later (pricier tier) wins
assert.strictEqual(pickReaction(10, { tip_kiss: 10, tip_dance: 10 }), 'dance');

assert.strictEqual(commandReaction('/kiss'), 'kiss');
assert.strictEqual(commandReaction('!DANCE now'), 'dance');
assert.strictEqual(commandReaction('/hi'), 'wink');
assert.strictEqual(commandReaction('hello /kiss'), null);
assert.strictEqual(commandReaction('/kisses'), null);

assert.strictEqual(menuOf(mine).map(m => m.kind + ':' + m.tokens).join(','), 'wink:2,kiss:10,party:100');
assert.strictEqual(menuOf(defaults).length, 4);

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
assert.strictEqual(C.colorOf('Ghoul Gum').id, 'ghoul_gum');
assert.strictEqual(C.colorOf('nope').id, 'coven', 'an unknown color is Coven');
assert.strictEqual(C.COLORS.length, 10);
assert.strictEqual(C.roomOf('dusk'), null, 'dusk is the drawn sky');
assert.strictEqual(C.roomOf(undefined), null, 'the dusk sky by default');
// every painted room has its art file, and the build bakes them all in
const roomFiles = fs.readdirSync(path.join(__dirname, '..', 'art', 'rooms')).filter(f => f.endsWith('.webp'));
assert.strictEqual(roomFiles.length, 17);
const slot = fs.readFileSync(path.join(__dirname, '..', 'dist', '7-overlay-cryptid-js.js'), 'utf8');
for (const f of roomFiles) assert.ok(slot.includes('  ' + f.replace('.webp', '') + ": 'data:image/webp;base64,"), f + ' is in the overlay');
console.log('console.js: all checks passed');
