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
