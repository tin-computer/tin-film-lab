const assert = require('node:assert/strict');
const Timeline = require('../../films/tin-launch/tools/lib/timeline.js');
const spec = { fps: 60, duration: 4, beat: 0.5, events: { click: 1.5 }, acts: { first: [0, 2], second: [2, 4] } };
const t = Timeline(spec);
assert.equal(t.gridFrame(2, 1), 150);
assert.equal(t.cue.click, 90);
assert.deepEqual(t.events, [{ name: 'click', t: 1.5 }]);
assert.equal(t.progress(120, 'click', 1), 0.5);
assert.equal(t.progress(1000, 'click', 1), 1);
assert.equal(t.cues().acts.second.from, 120);
assert.deepEqual(t.cues().events, [{ id: 'click', f: 90, kind: 'cue' }]);
assert.throws(() => Timeline({ ...spec, acts: { hole: [1, 4] } }), /Non-contiguous/);
assert.throws(() => Timeline({ ...spec, events: { outside: 4 } }), /Invalid cue/);
assert.throws(() => Timeline({ ...spec, reads: [{ text: 'read', start: 2, end: 1 }] }), /reading/);
assert.throws(() => Timeline({ ...spec, fps: Infinity }), /finite/);
// Tempo changes must move the grid without rounding the tempo to a preferred preset.
assert.equal(Timeline({ ...spec, beat: 60 / 129 }).gridFrame(2), Math.round(4 * 60 / 129 * 60));
console.log('Timeline checks passed');
