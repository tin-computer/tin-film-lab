import {readFile, writeFile, mkdir, stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {DATA_DIR} from './prepare-catalogue.mjs';

// A shared snapshot starts a new local desk; it must never replace later edits.
export async function setup(directory = DATA_DIR) {
  const names = ['catalogue.json', 'audio-index.json', 'reviews.json'];
  const present = await Promise.all(names.map(async name => {
    try { await stat(resolve(directory, name)); return true; }
    catch (error) { if (error.code === 'ENOENT') return false; throw error; }
  }));
  if (present.every(Boolean)) return 'Existing desk kept';
  if (present.some(Boolean)) throw Error('Incomplete local desk; keep its notes and repair the missing file before setup');
  const catalogue = JSON.parse(await readFile(new URL('./starter/catalogue.json', import.meta.url), 'utf8'));
  const reviews = JSON.parse(await readFile(new URL('./starter/reviews.json', import.meta.url), 'utf8'));
  const ids = new Set(catalogue.assets.map(asset => asset.id));
  if (Object.keys(reviews.reviews).some(id => !ids.has(id))) throw Error('Snapshot review has no catalogue item');
  await mkdir(directory, {recursive: true});
  for (const [name, value] of [['catalogue.json', catalogue], ['audio-index.json', {}], ['reviews.json', reviews]]) {
    await writeFile(resolve(directory, name), JSON.stringify(value, null, 2) + '\n', {flag: 'wx'});
  }
  return 'Shared snapshot copied to a new local desk';
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(await setup()); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
