import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {setup} from './setup.mjs';

test('clean setup copies the supplied notes once and preserves later edits', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'sound-desk-setup-'));
  t.after(() => rm(directory, {recursive: true, force: true}));
  await setup(directory);
  const original = await readFile(new URL('./starter/reviews.json', import.meta.url));
  assert.equal(createHash('sha256').update(original).digest('hex'), '9922ec95026be2ad39e51c55562edaf0d8bc0a77479230805281b1d533816c29');
  const reviews = JSON.parse(await readFile(join(directory, 'reviews.json'), 'utf8'));
  assert.deepEqual(reviews, JSON.parse(original));
  assert.equal(reviews.revision, 170);
  assert.equal(Object.keys(reviews.contextChoices).length, 7);
  const catalogue = JSON.parse(await readFile(join(directory, 'catalogue.json'), 'utf8'));
  assert.equal(catalogue.assets.filter(asset => asset.kind === 'music').length, 54);
  assert.equal(catalogue.assets.filter(asset => asset.kind === 'effect').length, 52);
  reviews.listener = 'Another reviewer'; reviews.revision++;
  await writeFile(join(directory, 'reviews.json'), JSON.stringify(reviews));
  await setup(directory);
  assert.deepEqual(JSON.parse(await readFile(join(directory, 'reviews.json'), 'utf8')), reviews);
  await rm(join(directory, 'catalogue.json'));
  await assert.rejects(setup(directory), /Incomplete local desk/);
  assert.deepEqual(JSON.parse(await readFile(join(directory, 'reviews.json'), 'utf8')), reviews);
});
