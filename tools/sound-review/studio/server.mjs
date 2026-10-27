import http from 'node:http';
import {createReadStream, existsSync} from 'node:fs';
import {readFile, stat} from 'node:fs/promises';
import {dirname, resolve, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {atomicJson, backup, DATA_DIR, contextDefinitions, contexts, catalogueForContexts, rankedEffects} from './prepare-catalogue.mjs';

const PORT = 43791, HOST = '127.0.0.1';
const HERE = dirname(fileURLToPath(import.meta.url)), DIST = resolve(HERE, 'dist');
const reviewPath = resolve(DATA_DIR, 'reviews.json');
const catalogue = catalogueForContexts(JSON.parse(await readFile(resolve(DATA_DIR, 'catalogue.json'), 'utf8')));
const audioIndex = JSON.parse(await readFile(resolve(DATA_DIR, 'audio-index.json'), 'utf8'));
for (const asset of catalogue.assets) {
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(asset.id)) throw Error('Unsafe catalogue asset ID');
  const packaged = resolve(HERE, 'starter/audio', `${asset.id}.ogg`);
  if (!audioIndex[asset.id] && existsSync(packaged)) audioIndex[asset.id] = packaged;
  const local = typeof audioIndex[asset.id] === 'string' && existsSync(audioIndex[asset.id]);
  const remote = typeof asset.remoteAudioUrl === 'string' && asset.remoteAudioUrl.startsWith('https://');
  asset.audioUrl = local ? `/audio/${encodeURIComponent(asset.id)}` : remote ? asset.remoteAudioUrl : '';
  asset.audioMode = local ? 'local' : remote ? 'provider' : 'source';
}
const assets = new Map(catalogue.assets.map(asset => [asset.id, asset]));
const selectionKeys = ['feeling', 'start', 'change', 'end', 'launch'];
const questions = JSON.parse(await readFile(new URL('./src/questions.json', import.meta.url), 'utf8'));
const launchOptions = questions.find(question => question.key === 'launch').options;
const statusLabels = {unreviewed: 'İncelenmedi', shortlist: 'Seçkiye aldım', rejected: 'Uygun değil'};
const contextLabels = Object.fromEntries(Object.entries(contextDefinitions).map(([context, definition]) => [context, definition.label]));
const questionLabels = {feeling: 'His', start: 'Başlangıç', change: 'Gelişim', end: 'Bitiş', launch: 'Kullanım'};
const allowedOrigins = new Set([`http://127.0.0.1:${PORT}`, `http://localhost:${PORT}`]);
const allowedHosts = new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`]);
const mimeTypes = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.flac': 'audio/flac', '.opus': 'audio/ogg', '.webm': 'audio/webm', '.mp4': 'audio/mp4'};
const fail = (message, status = 400) => Object.assign(Error(message), {status});

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw fail(`${label}: object required`);
}
function string(value, label, limit = 12000) {
  if (typeof value !== 'string' || value.length > limit) throw fail(`${label}: invalid text`);
}
function strings(value, label) {
  if (!Array.isArray(value) || value.length > 200) throw fail(`${label}: invalid list`);
  value.forEach(item => string(item, label, 1000));
}
function safeKeys(value, depth = 0) {
  if (depth > 15) throw fail('JSON nesting is too deep');
  if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) throw fail('Unsafe JSON key');
    safeKeys(child, depth + 1);
  }
}
function keys(value, allowed, label) {
  if (Object.keys(value).some(key => !allowed.includes(key))) throw fail(`${label}: unsupported field`);
}
function review(value, id) {
  if (!assets.has(id)) throw fail(`Unknown review asset: ${id}`);
  object(value, 'review'); keys(value, ['status', 'selections', 'notes', 'avoid_with', 'listener', 'updatedAt', 'legacy', 'aiSuggestion'], 'review');
  if (!Object.hasOwn(statusLabels, value.status)) throw fail('Invalid review status');
  object(value.selections, 'selections'); keys(value.selections, selectionKeys, 'selections');
  Object.values(value.selections).forEach(values => strings(values, 'selections'));
  string(value.notes, 'notes'); strings(value.avoid_with, 'avoid_with'); string(value.listener, 'listener', 200);
  if (value.updatedAt !== undefined) string(value.updatedAt, 'updatedAt', 80);
  if (value.aiSuggestion !== undefined) {
    const suggestion = value.aiSuggestion;
    if (assets.get(id).kind !== 'music') throw fail('Music suggestions require a music asset');
    object(suggestion, 'AI suggestion'); keys(suggestion, ['model', 'launch', 'method', 'createdAt', 'answers', 'notes', 'avoid_with', 'caveat'], 'AI suggestion');
    string(suggestion.model, 'AI model', 200); string(suggestion.method, 'AI method', 2000); string(suggestion.createdAt, 'AI date', 80);
    strings(suggestion.launch, 'AI launch suggestions');
    if (suggestion.launch.length !== 5 || new Set(suggestion.launch).size !== 5 || suggestion.launch.some(option => !launchOptions.includes(option))) throw fail('AI suggestions require five different known launch choices');
    if (suggestion.answers !== undefined) {
      object(suggestion.answers, 'AI answers'); keys(suggestion.answers, selectionKeys.filter(key => key !== 'launch'), 'AI answers');
      for (const question of questions.filter(question => question.key !== 'launch')) {
        const answer = suggestion.answers[question.key];
        object(answer, 'AI answer'); keys(answer, ['choices', 'reason'], 'AI answer');
        strings(answer.choices, 'AI answer choices'); string(answer.reason, 'AI answer reason', 2000);
        if (!answer.reason.trim() || answer.choices.length > 3 || new Set(answer.choices).size !== answer.choices.length || answer.choices.some(option => !question.options.includes(option))) throw fail('AI answer requires known choices and a reason');
      }
    }
    if (suggestion.notes !== undefined) string(suggestion.notes, 'AI notes', 2000);
    if (suggestion.avoid_with !== undefined) {
      strings(suggestion.avoid_with, 'AI avoid_with');
      if (suggestion.avoid_with.length > 3) throw fail('AI avoid_with supports at most three suggestions');
    }
    if (suggestion.caveat !== undefined) string(suggestion.caveat, 'AI caveat', 2000);
  }
  if (value.legacy !== undefined) {
    object(value.legacy, 'legacy'); keys(value.legacy, ['feeling', 'progression', 'use_with'], 'legacy');
    string(value.legacy.feeling, 'legacy feeling'); string(value.legacy.progression, 'legacy progression'); strings(value.legacy.use_with, 'legacy use_with');
  }
}
function choices(value) {
  object(value, 'contextChoices'); keys(value, contexts, 'contextChoices');
  for (const [context, choice] of Object.entries(value)) {
    object(choice, 'effect choice'); keys(choice, ['effect', 'alternatives', 'listener', 'reason', 'source'], 'effect choice');
    let ranked;
    try { ranked = rankedEffects(choice); } catch (error) { throw fail(error.message); }
    for (const id of ranked) {
      const asset = assets.get(id);
      if (!asset || asset.kind !== 'effect' || !asset.contexts.includes(context)) throw fail('Effect does not support this context');
    }
    string(choice.listener, 'effect listener', 200); string(choice.reason, 'effect reason');
  }
}
function document(value) {
  safeKeys(value); object(value, 'document'); keys(value, ['version', 'revision', 'listener', 'updatedAt', 'reviews', 'contextChoices'], 'document');
  if (value.version !== 1 || !Number.isSafeInteger(value.revision) || value.revision < 0) throw fail('Invalid document version or revision');
  string(value.listener, 'listener', 200); string(value.updatedAt, 'updatedAt', 80);
  object(value.reviews, 'reviews');
  for (const [id, value_] of Object.entries(value.reviews)) review(value_, id);
  choices(value.contextChoices);
}
async function readReviews() {
  const value = JSON.parse(await readFile(reviewPath, 'utf8')); document(value); return value;
}
async function body(request) {
  return new Promise((accept, reject) => {
    let size = 0, rejected = false; const chunks = [];
    request.on('data', chunk => {
      if (rejected) return;
      size += chunk.length;
      if (size > 2 * 1024 * 1024) { rejected = true; reject(fail('Body exceeds 2 MB', 413)); return; }
      chunks.push(chunk);
    });
    request.on('end', () => { if (!rejected) { try { accept(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(fail('Invalid JSON')); } } });
    request.on('error', reject);
  });
}
let queue = Promise.resolve();
function serialized(operation) {
  const result = queue.then(operation); queue = result.catch(() => {}); return result;
}
async function save(value, current) {
  document(value);
  const next = {...value, revision: current.revision + 1, updatedAt: new Date().toISOString()};
  await backup(reviewPath); await atomicJson(reviewPath, next); return next;
}
function mergeImport(input, current) {
  safeKeys(input);
  const next = structuredClone(current);
  if (Array.isArray(input)) {
    const seen = new Set();
    for (const row of input) {
      object(row, 'music note'); keys(row, ['id', 'listener', 'feeling', 'progression', 'use_with', 'avoid_with', 'selections', 'notes', 'legacy'], 'music note');
      const id = String(row.id);
      if (!assets.has(id) || assets.get(id).kind !== 'music' || seen.has(id)) throw fail(`Unknown or repeated music ID: ${id}`);
      seen.add(id);
      for (const key of ['listener', 'feeling', 'progression', 'notes']) if (row[key] !== undefined) string(row[key], key);
      for (const key of ['use_with', 'avoid_with']) if (row[key] !== undefined) strings(row[key], key);
      const previous = next.reviews[id] || {status: 'unreviewed', selections: {}, notes: '', avoid_with: [], listener: current.listener};
      const converted = {...previous};
      for (const key of ['selections', 'notes', 'avoid_with', 'listener']) if (row[key] !== undefined) converted[key] = row[key];
      if (row.legacy !== undefined) converted.legacy = row.legacy;
      else if (['feeling', 'progression', 'use_with'].some(key => row[key] !== undefined)) {
        converted.legacy = {...previous.legacy || {feeling: '', progression: '', use_with: []}};
        for (const key of ['feeling', 'progression', 'use_with']) if (row[key] !== undefined) converted.legacy[key] = row[key];
      }
      review(converted, id); next.reviews[id] = converted;
    }
  } else if (input?.version === 1) {
    document(input);
    Object.assign(next.reviews, input.reviews); Object.assign(next.contextChoices, input.contextChoices);
    if (input.listener) next.listener = input.listener;
  } else {
    choices(input); Object.assign(next.contextChoices, input);
  }
  return next;
}
const md = value => String(value).replaceAll('|', '\\|').replaceAll('\n', '<br>');
function markdown(value) {
  const lines = ['# Ses inceleme notları', '', `Dinleyen: ${value.listener || 'Belirtilmedi'}`, `Kayıt sürümü: ${value.revision}`, `Güncelleme: ${value.updatedAt}`, '', '| Parça | Tür | Kaynak | Lisans | Durum |', '|---|---|---|---|---|'];
  for (const asset of catalogue.assets) {
    const row = value.reviews[asset.id];
    lines.push(`| ${md(asset.title)} | ${asset.kind === 'music' ? 'Müzik' : 'Efekt'} | ${md(asset.sourceUrl || asset.provider)} | ${md(asset.licenseName || 'Belirtilmedi')} | ${statusLabels[row?.status || 'unreviewed']} |`);
  }
  for (const [id, row] of Object.entries(value.reviews)) {
    const asset = assets.get(id);
    lines.push('', `## ${asset.title}`, '', `Kimlik: ${id}`, `Durum: ${statusLabels[row.status]}`, `Dinleyen: ${row.listener || 'Belirtilmedi'}`, `Kaynak: ${asset.sourceUrl || asset.provider}`, `Lisans: ${asset.licenseUrl || asset.licenseName || 'Belirtilmedi'}`);
    for (const [key, values] of Object.entries(row.selections)) if (values.length) lines.push(`${questionLabels[key]}: ${values.join(', ')}`);
    if (row.aiSuggestion) {
      lines.push('', `AI önerileri (insan onayı değildir): ${row.aiSuggestion.model}`, `Yöntem: ${row.aiSuggestion.method}`, `Oluşturma: ${row.aiSuggestion.createdAt}`);
      row.aiSuggestion.launch.forEach((option, index) => lines.push(`${index + 1}. ${option}`));
      for (const [key, answer] of Object.entries(row.aiSuggestion.answers ?? {})) lines.push(`AI ${questionLabels[key]}: ${answer.choices.join(', ') || 'Emin değil'}`, `Gerekçe: ${answer.reason}`);
      if (row.aiSuggestion.notes) lines.push(`AI not önerisi: ${row.aiSuggestion.notes}`);
      if (row.aiSuggestion.avoid_with?.length) lines.push(`AI uygun olmayan durumlar: ${row.aiSuggestion.avoid_with.join('; ')}`);
      if (row.aiSuggestion.caveat) lines.push(`AI sınırı: ${row.aiSuggestion.caveat}`);
    }
    if (row.notes) lines.push(`Not: ${row.notes}`);
    if (row.avoid_with.length) lines.push(`Uygun olmayan durumlar: ${row.avoid_with.join('; ')}`);
    if (row.legacy) lines.push('', 'Önceki serbest notlar:', `His: ${row.legacy.feeling}`, `İlerleyiş: ${row.legacy.progression}`, `Kullanım: ${row.legacy.use_with.join('; ')}`);
  }
  lines.push('', '## Hareket için seçilen sesler');
  for (const [context, choice] of Object.entries(value.contextChoices)) {
    lines.push('', `### ${contextLabels[context]}`, `Seçim: ${choice.effect === null ? 'Sessizlik' : assets.get(choice.effect).title}`, `Dinleyen: ${choice.listener}`, `Neden: ${choice.reason}`, `Kaynak: ${choice.effect === null ? '—' : assets.get(choice.effect).sourceUrl || assets.get(choice.effect).provider}`, ...(choice.source !== undefined ? [`Kaynak kaydı: ${JSON.stringify(choice.source)}`] : []));
    rankedEffects(choice).forEach((id, rank) => {
      const asset = assets.get(id);
      lines.push(`${rank + 1}. ${asset.title} · Kaynak: ${asset.sourceUrl || asset.provider}`);
    });
  }
  return lines.join('\n') + '\n';
}
function json(response, status, value) {
  response.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'}); response.end(JSON.stringify(value));
}
async function streamFile(request, response, file, audio = false) {
  const info = await stat(file);
  if (!info.isFile()) throw fail('File not found', 404);
  const headers = {'Content-Type': mimeTypes[extname(file).toLowerCase()] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': audio ? 'private, max-age=3600' : 'no-cache'};
  let start = 0, end = info.size - 1, status = 200;
  if (audio) headers['Accept-Ranges'] = 'bytes';
  if (audio && request.headers.range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
    if (!match || (!match[1] && !match[2])) { response.writeHead(416, {'Content-Range': `bytes */${info.size}`}); response.end(); return; }
    if (!match[1]) { start = Math.max(0, info.size - Number(match[2])); }
    else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= info.size) { response.writeHead(416, {'Content-Range': `bytes */${info.size}`}); response.end(); return; }
    status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`; headers['Content-Length'] = end - start + 1;
  }
  response.writeHead(status, headers);
  if (request.method === 'HEAD') { response.end(); return; }
  const stream = createReadStream(file, {start, end}); stream.on('error', () => response.destroy()); response.on('close', () => stream.destroy()); stream.pipe(response);
}

const vite = process.argv.includes('--dev') ? await import('vite').then(module => module.createServer({root: HERE, server: {middlewareMode: true}, appType: 'spa'})) : null;
const server = http.createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    if (!allowedHosts.has(request.headers.host) || (request.headers.origin && !allowedOrigins.has(request.headers.origin))) throw fail('Only this local sound desk can access the API', 403);
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method) && request.headers['sec-fetch-site'] === 'cross-site') throw fail('Cross-site writes are not allowed', 403);
    const url = new URL(request.url, `http://${HOST}:${PORT}`);
    let path;
    try { path = decodeURIComponent(url.pathname); } catch { throw fail('Invalid URL encoding'); }
    if (request.method === 'GET' && path === '/api/catalogue') return json(response, 200, catalogue);
    if (request.method === 'GET' && path === '/api/reviews') return json(response, 200, await readReviews());
    if (request.method === 'PUT' && path === '/api/reviews') {
      const input = await body(request); document(input);
      const saved = await serialized(async () => {
        const current = await readReviews();
        if (input.revision !== current.revision) throw fail('Notes changed in another tab. Reload before saving.', 409);
        return save(input, current);
      });
      return json(response, 200, saved);
    }
    if (request.method === 'POST' && path === '/api/import') {
      const input = await body(request);
      const saved = await serialized(async () => { const current = await readReviews(); return save(mergeImport(input, current), current); });
      return json(response, 200, saved);
    }
    if (request.method === 'GET' && path === '/api/export') {
      const format = url.searchParams.get('format') || 'json';
      if (!['json', 'md'].includes(format)) throw fail('Export format must be json or md');
      const value = await readReviews();
      response.writeHead(200, {'Content-Type': format === 'json' ? 'application/json; charset=utf-8' : 'text/markdown; charset=utf-8', 'Content-Disposition': `attachment; filename="sound-review.${format}"`, 'Cache-Control': 'no-store'});
      response.end(format === 'json' ? JSON.stringify(value, null, 2) + '\n' : markdown(value)); return;
    }
    if (['GET', 'HEAD'].includes(request.method) && path.startsWith('/audio/')) {
      const id = path.slice('/audio/'.length);
      if (!assets.has(id) || !Object.hasOwn(audioIndex, id) || typeof audioIndex[id] !== 'string') throw fail('Unknown audio', 404);
      return await streamFile(request, response, audioIndex[id], true);
    }
    if (path.startsWith('/api/')) throw fail('Unsupported API route or method', 404);
    if (!['GET', 'HEAD'].includes(request.method)) throw fail('Method not allowed', 405);
    if (vite) { vite.middlewares(request, response, () => { if (!response.writableEnded) json(response, 404, {error: 'Not found'}); }); return; }
    const file = resolve(DIST, `.${path}`);
    if (file !== DIST && !file.startsWith(DIST + sep)) throw fail('Invalid path', 403);
    try { await streamFile(request, response, file); }
    catch (error) { if (error.code !== 'ENOENT' && error.status !== 404) throw error; await streamFile(request, response, resolve(DIST, 'index.html')); }
  } catch (error) {
    if (!response.headersSent) json(response, error.status || (error.code === 'ENOENT' ? 404 : 500), {error: error.status ? error.message : 'Local sound desk could not complete the request'});
    else response.destroy();
    if (!error.status && error.code !== 'ENOENT') console.error(error.message);
  }
});
server.listen(PORT, HOST, () => console.log(`Sound desk: http://${HOST}:${PORT}${vite ? ' (development)' : ''}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.close(); vite?.close(); });
