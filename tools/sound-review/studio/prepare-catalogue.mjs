import {spawn} from 'node:child_process';
import {readFile, writeFile, mkdir, rename, copyFile, stat} from 'node:fs/promises';
import {dirname, resolve, extname, basename} from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const DATA_DIR = resolve(ROOT, 'out/sound-review-studio');
const SOURCE_DIR = resolve(ROOT, 'out/sound-review');
export const contextDefinitions = JSON.parse(await readFile(new URL('./contexts.json', import.meta.url), 'utf8'));
export const contexts = Object.keys(contextDefinitions);

export function contextsFor(baseContexts) {
  return contexts.filter(context => contextDefinitions[context].groups.some(group => baseContexts.includes(group)));
}

export function catalogueForContexts(catalogue) {
  return {...catalogue, assets: catalogue.assets.map(asset => asset.kind === 'effect' ? {...asset, contexts: contextsFor(asset.contexts)} : asset)};
}

export function rankedEffects(choice) {
  const alternatives = choice.alternatives === undefined ? [] : choice.alternatives;
  if (!Array.isArray(alternatives) || alternatives.length > 4 || alternatives.some(id => typeof id !== 'string') || (choice.effect === null && alternatives.length)) throw Error('An effect choice supports at most five sounds; silence cannot have alternatives');
  const ids = choice.effect === null ? [] : [choice.effect, ...alternatives];
  if (new Set(ids).size !== ids.length) throw Error('An effect ranking cannot repeat a sound');
  return ids;
}

export async function atomicJson(path, value) {
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, JSON.stringify(value, null, 2) + '\n', {flag: 'wx'});
  await rename(temporary, path);
}

export async function backup(path) {
  try {
    await stat(path);
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  const directory = resolve(dirname(path), 'backups');
  await mkdir(directory, {recursive: true});
  const target = resolve(directory, `${basename(path)}.${new Date().toISOString().replaceAll(':', '-')}.${process.hrtime.bigint()}.bak`);
  await copyFile(path, target, 1);
}

function embeddedData(html) {
  const marker = 'const DATA = ';
  const start = html.indexOf(marker);
  if (start < 0 || html.indexOf(marker, start + marker.length) >= 0) throw Error('Expected one embedded DATA assignment');
  // The existing builder writes this JSON on one line, without executable code.
  return JSON.parse(html.slice(start + marker.length).split('\n', 1)[0].trim().replace(/;$/, ''));
}

async function jsonIfPresent(path) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

function measureAudio(file) {
  return new Promise((accept, reject) => {
    const process = spawn(resolve(ROOT, 'bin/ffmpeg'), ['-v', 'error', '-nostdin', '-i', file, '-vn', '-ac', '1', '-ar', '8000', '-f', 'f32le', 'pipe:1']);
    const chunks = []; let errors = '';
    process.stdout.on('data', chunk => chunks.push(chunk));
    process.stderr.on('data', chunk => { errors = (errors + chunk.toString()).slice(-4000); });
    process.on('error', reject);
    process.on('close', code => {
      if (code !== 0) { reject(Error(`Audio decode failed for ${basename(file)}: ${errors}`)); return; }
      const pcm = Buffer.concat(chunks), count = pcm.length / 4;
      if (!Number.isInteger(count) || count < 1) { reject(Error(`Empty audio: ${basename(file)}`)); return; }
      const bars = Math.min(100, count), waveform = [];
      for (let bar = 0; bar < bars; bar++) {
        let peak = 0;
        for (let i = Math.floor(bar * count / bars); i < Math.floor((bar + 1) * count / bars); i++) {
          const sample = pcm.readFloatLE(i * 4);
          if (!Number.isFinite(sample)) { reject(Error(`Invalid audio sample: ${basename(file)}`)); return; }
          peak = Math.max(peak, Math.abs(sample));
        }
        waveform.push(peak);
      }
      const peak = Math.max(...waveform);
      accept({duration: count / 8000, waveform: waveform.map(value => peak ? Math.round(value / peak * 1000) / 1000 : 0)});
    });
  });
}

const link = value => typeof value === 'string' && /^https?:\/\//.test(value) ? value : null;
function metadata(source) {
  const record = source && typeof source === 'object' ? source : {};
  const license = record.license;
  return {
    provider: typeof record.provider === 'string' ? record.provider : 'Unknown',
    sourceUrl: link(record.url) || link(record.source_url) || link(record.page),
    licenseUrl: link(record.license_url) || link(license?.url) || link(record.license_source),
    licenseName: typeof license === 'string' ? license : typeof license?.name === 'string' ? license.name : null,
    ai: ['ai', 'some_ai'].includes(record.provider_ai_content) || ['ai', 'some_ai'].includes(record.ai_content) || record.ai === true,
  };
}

function initialReview(row) {
  if (!row || typeof row !== 'object' || !['string', 'number'].includes(typeof row.id)) throw Error('Invalid saved music note');
  for (const key of ['feeling', 'progression', 'listener', 'notes']) if (row[key] !== undefined && typeof row[key] !== 'string') throw Error(`Invalid saved ${key}`);
  for (const key of ['use_with', 'avoid_with']) if (row[key] !== undefined && (!Array.isArray(row[key]) || row[key].some(value => typeof value !== 'string'))) throw Error(`Invalid saved ${key}`);
  return {
    status: 'unreviewed', selections: row.selections || {}, notes: row.notes || '',
    avoid_with: row.avoid_with || [], listener: row.listener || 'hamit',
    legacy: row.legacy || {feeling: row.feeling || '', progression: row.progression || '', use_with: row.use_with || []},
  };
}

export async function prepareCatalogue() {
  const html = await readFile(resolve(SOURCE_DIR, 'index.html'), 'utf8');
  const data = embeddedData(html);
  const inputs = [
    ...data.music.map(row => ({...row, id: String(row.id), kind: 'music', contexts: []})),
    ...Object.entries(data.assets).map(([id, row]) => ({...row, id, kind: 'effect', contexts: contextsFor(Object.keys(data.groups).filter(context => data.groups[context]?.includes(id)))})),
  ];
  const ids = new Set(), audioIndex = Object.create(null);
  for (const row of inputs) {
    if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(row.id) || ['constructor', 'prototype', '__proto__'].includes(row.id) || ids.has(row.id)) throw Error(`Duplicate or unsafe asset ID: ${row.id}`);
    ids.add(row.id);
    const file = resolve(SOURCE_DIR, row.file);
    if (!(await stat(file)).isFile()) throw Error(`Missing audio: ${row.id}`);
    audioIndex[row.id] = file;
  }
  const assets = new Array(inputs.length); let next = 0;
  await Promise.all(Array.from({length: Math.min(4, inputs.length)}, async () => {
    while (next < inputs.length) {
      const i = next++, row = inputs[i];
      assets[i] = {
        id: row.id, kind: row.kind, title: row.title || row.id, ...metadata(row.source), contexts: row.contexts,
        ...await measureAudio(audioIndex[row.id]), format: extname(audioIndex[row.id]).slice(1).toLowerCase(),
        audioUrl: `/audio/${encodeURIComponent(row.id)}`, ...(Number.isFinite(row.anchor) ? {anchor: row.anchor} : {}),
      };
    }
  }));
  await mkdir(DATA_DIR, {recursive: true});
  const generatedAt = new Date().toISOString();
  for (const [name, value] of [['catalogue.json', {assets, generatedAt}], ['audio-index.json', audioIndex]]) {
    const path = resolve(DATA_DIR, name); await backup(path); await atomicJson(path, value);
  }
  const reviewPath = resolve(DATA_DIR, 'reviews.json');
  if (await jsonIfPresent(reviewPath) === null) {
    let notes = await jsonIfPresent(resolve(SOURCE_DIR, 'listening-notes.preloaded.json'));
    if (notes === null) {
      const match = html.match(/const saved=JSON\.parse\(("(?:\\.|[^"\\])*")\);/);
      notes = match ? JSON.parse(JSON.parse(match[1])) : [];
    }
    if (!Array.isArray(notes)) throw Error('Saved music notes must be a list');
    const reviews = Object.create(null);
    for (const row of notes) {
      if (!ids.has(String(row.id))) throw Error(`Saved note has no catalogue asset: ${row.id}`);
      reviews[String(row.id)] = initialReview(row);
    }
    const contextChoices = await jsonIfPresent(resolve(SOURCE_DIR, 'effect-choices.json')) || {};
    for (const [context, choice] of Object.entries(contextChoices)) {
      if (!contexts.includes(context) || !choice || typeof choice.listener !== 'string' || typeof choice.reason !== 'string' || rankedEffects(choice).some(id => !assets.some(asset => asset.kind === 'effect' && asset.id === id && asset.contexts.includes(context)))) throw Error('Invalid saved effect choices');
    }
    const document = {version: 1, revision: 0, listener: 'hamit', updatedAt: generatedAt, reviews, contextChoices};
    // Exclusive creation protects notes if another local process just saved them.
    try { await writeFile(reviewPath, JSON.stringify(document, null, 2) + '\n', {flag: 'wx'}); }
    catch (error) { if (error.code !== 'EEXIST') throw error; }
  }
  console.log(JSON.stringify({assets: assets.length, music: assets.filter(row => row.kind === 'music').length, effects: assets.filter(row => row.kind === 'effect').length, directory: DATA_DIR}));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await prepareCatalogue(); }
  catch (error) { console.error(`Catalogue preparation failed: ${error.message}`); process.exitCode = 1; }
}
