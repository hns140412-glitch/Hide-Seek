'use strict';
// node tests/hide-basic-skills.test.js
const assert = require('assert');
const B = require('../hide-basic-skills-v1.js');

// HS-2: every fake name tag differs from its real word by exactly one jamo (DP2 minimal change)
for (const w of B.NAME_TAGS) {
  const d = B.jamoDiff(w.real, w.fake);
  assert.ok(d, 'same length hangul: ' + w.real);
  assert.strictEqual(d.length, 1, w.real + '/' + w.fake + ' must differ by exactly one jamo');
}
// fakes must not be ordinary words we know of in the pool, and no fake equals any real
const reals = new Set(B.NAME_TAGS.map(w => w.real));
for (const w of B.NAME_TAGS) assert.ok(!reals.has(w.fake), 'fake collides with a real tag: ' + w.fake);
assert.ok(B.NAME_TAGS.length >= 12, 'enough tags for two rounds of 6');

// compose/decompose round trip
for (const ch of '하마허투나모거방벅') assert.strictEqual(B.compose(B.decompose(ch)), ch);

// HS-1: phrase forms — comparison amount first in notation, base after
assert.strictEqual(B.ratioPhrase(3, 5, 'to'), '5에 대한 3의 비');
assert.strictEqual(B.ratioPhrase(7, 4, 'of'), '7의 4에 대한 비');
assert.strictEqual(B.ratioPhrase(12, 13, 'and'), '12와 13의 비');
assert.strictEqual(B.ratioPhrase(6, 10, 'and'), '6과 10의 비');
assert.strictEqual(B.ratioPhrase(10, 3, 'and'), '10과 3의 비');
assert.strictEqual(B.ratioPhrase(5, 2, 'and'), '5와 2의 비');
for (const it of B.CORE_ITEMS) assert.notStrictEqual(it.cmp, it.base, 'base and comparison must differ');

// RECALL: exactly half the tiles have the target base, and each has a swapped twin (minimal change)
const hits = B.RECALL.tiles.filter(t => t.base === B.RECALL.target);
assert.strictEqual(hits.length, 3);
for (const h of hits) assert.ok(B.RECALL.tiles.some(t => t.cmp === h.base && t.base === h.cmp && t.form === h.form), 'twin for ' + JSON.stringify(h));

// percent item answer is computed, not typed
assert.strictEqual(B.PERCENT_ITEM.answer, Math.round(15 / 25 * 100) + '%');

// metadata tags (DP8)
assert.strictEqual(B.UNIT.floor_level, 2);
assert.ok(B.UNIT.unit_path.includes('비와 비율'));
console.log('HIDE_BASIC_SKILLS_V1_TEST: PASS (' + B.NAME_TAGS.length + ' tags, ' + B.CORE_ITEMS.length + ' core items)');
