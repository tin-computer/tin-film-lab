// Smallest checks that fail if the short-form tools break.  node shortform/tools/test.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const Sync = require('./sync.js');
const cue = require('../../films/tin-launch/tools/example/music/cue.json');
const S = Sync(cue);

// peaks are real local maxima and the strongest come first
const ps = S.peaks();
assert.ok(ps.length > 5);
for (let i = 1; i < ps.length; i++) assert.ok(ps[i - 1].s >= ps[i].s);

// typing: one time per character, in order, inside the window; groups start on transients
const text = 'npx locin flow --full';
for (const spread of [true, false]) {
  const p = S.typing(text, 0.4, 7.5, { maxChars: 6, spread });
  assert.equal(p.times.length, text.length);
  for (let i = 1; i < p.times.length; i++) assert.ok(p.times[i] >= p.times[i - 1]);
  assert.ok(p.times[0] >= 0.4 && p.times.at(-1) < 7.5);
  const onsets = S.all.map(q => q.t);
  assert.ok(p.at.every(t => onsets.some(o => Math.abs(o - t) < 1e-6) || t % (cue.beat / 2) < 1e-6), 'groups land on transients or the 8th grid');
  assert.equal(S.typed(text, p, 100), text);
  assert.equal(S.typed(text, p, 0), '');
}
// spread keeps every slot moving: no gap longer than two slots
const sp = S.typing(text, 0.4, 7.5, { maxChars: 4 });
const slot = (7.5 - 0.4) / sp.groups.length;
for (let i = 1; i < sp.at.length; i++) assert.ok(sp.at[i] - sp.at[i - 1] <= 2 * slot + 1e-6);

// A quiet window shorter than a beat still reveals every character in order.
const quietCue = { ...cue, envelope: { ...cue.envelope, onset: cue.envelope.onset.map(() => 0) } };
const quiet = Sync(quietCue);
for (const spread of [true, false]) {
  const p = quiet.typing(text, 0, 0.05, { maxChars: 2, spread });
  assert.equal(p.times.length, text.length);
  assert.ok(p.times.every((t, i) => Number.isFinite(t) && t >= 0 && t < 0.05 && (!i || t >= p.times[i - 1])));
}
assert.deepEqual(S.typing('', 0, 1).times, []);
assert.throws(() => S.typing(text, 1, 0), /window/);

// cuts sit on downbeats or on-beat hits, far enough apart
const cs = S.cuts(3);
assert.equal(cs.length, 3);
for (let i = 1; i < cs.length; i++) assert.ok(cs[i] - cs[i - 1] >= cue.beat * 2 - 1e-6);

// slopcheck still catches the sloppy fixture (eyebrow, wall, unsafe) and exits 1
let out = '', code = 0;
try { out = execFileSync('node', [join(here, 'slopcheck.mjs'), '--page', join(here, 'fixtures/slop.html'), '--fps', '1'], { encoding: 'utf8' }); }
catch (e) { out = e.stdout; code = e.status; }
assert.equal(code, 1);
for (const rule of ['eyebrow', 'wall', 'unsafe']) assert.match(out, new RegExp(`ERR\\s+${rule}`));
console.log('ok');
