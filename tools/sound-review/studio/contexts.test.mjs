import assert from 'node:assert/strict';
import test from 'node:test';
import {copyFile, mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import net from 'node:net';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {contextDefinitions, contexts, contextsFor, catalogueForContexts} from './prepare-catalogue.mjs';

test('shared contexts expand candidates without changing old memberships or source data', () => {
  const original = ['press', 'complete', 'message', 'transition'];
  assert.equal(contexts.length, 20);
  assert.deepEqual(contexts.slice(0, 4), original);
  for (const definition of Object.values(contextDefinitions)) {
    assert.ok(definition.label.trim() && definition.title.trim());
    assert.ok(definition.groups.length && definition.groups.every(group => original.includes(group)));
  }
  assert.deepEqual(contextsFor([]), []);
  const raw = {generatedAt: 'unchanged', assets: [
    ...original.map(context => ({id: context, kind: 'effect', contexts: [context]})),
    {id: 'shared', kind: 'effect', contexts: ['press', 'message']},
    {id: 'music', kind: 'music', contexts: []},
  ]};
  const before = structuredClone(raw);
  const expanded = catalogueForContexts(raw);
  for (const context of original) {
    const memberships = expanded.assets.find(asset => asset.id === context).contexts;
    assert.deepEqual(memberships.filter(value => original.includes(value)), [context]);
  }
  const shared = expanded.assets.find(asset => asset.id === 'shared').contexts;
  assert.ok(shared.includes('search') && shared.includes('send'));
  assert.equal(shared.filter(context => context === 'search').length, 1);
  assert.equal(expanded.assets.at(-1), raw.assets.at(-1));
  assert.deepEqual(catalogueForContexts(expanded), expanded);
  assert.deepEqual(raw, before);
});

test('old choices and five-sound rankings survive isolated saves, imports and exports', {timeout: 15000}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'sound-contexts-'));
  let child;
  t.after(async () => {
    if (child && child.exitCode === null && child.signalCode === null) {
      const stopped = once(child, 'exit'); child.kill('SIGTERM'); await stopped;
    }
    await rm(root, {recursive: true, force: true});
  });
  const source = fileURLToPath(new URL('.', import.meta.url));
  const studio = join(root, 'tools/sound-review/studio'), data = join(root, 'out/sound-review-studio');
  await mkdir(join(studio, 'src'), {recursive: true}); await mkdir(data, {recursive: true});
  await copyFile(join(source, 'src/questions.json'), join(studio, 'src/questions.json'));
  for (const name of ['prepare-catalogue.mjs', 'contexts.json']) await copyFile(join(source, name), join(studio, name));
  await copyFile(join(source, 'starter/catalogue.json'), join(data, 'catalogue.json'));
  await writeFile(join(data, 'audio-index.json'), '{}');
  const socket = net.createServer(); socket.listen(0, '127.0.0.1'); await once(socket, 'listening');
  const port = socket.address().port; await new Promise((accept, reject) => socket.close(error => error ? reject(error) : accept()));
  assert.notEqual(port, 43791);
  const server = await readFile(join(source, 'server.mjs'), 'utf8');
  assert.ok(server.includes('const PORT = 43791,'));
  await writeFile(join(studio, 'server.mjs'), server.replace('const PORT = 43791,', `const PORT = ${port},`));
  const empty = {version: 1, revision: 0, listener: 'fixture', updatedAt: new Date().toISOString(), reviews: {}, contextChoices: {}};
  await writeFile(join(data, 'reviews.json'), JSON.stringify(empty));
  child = spawn(process.execPath, [join(studio, 'server.mjs')], {cwd: root, stdio: ['ignore', 'pipe', 'pipe']});
  await new Promise((accept, reject) => {
    let errors = '';
    const timeout = setTimeout(() => reject(Error('Fixture server did not start')), 5000);
    child.stderr.on('data', chunk => {errors += chunk;});
    child.once('error', error => {clearTimeout(timeout); reject(error);});
    child.once('exit', code => {clearTimeout(timeout); reject(Error(`Fixture server exited ${code}: ${errors}`));});
    child.stdout.on('data', chunk => {if (String(chunk).includes('Sound desk:')) {clearTimeout(timeout); accept();}});
  });
  const url = `http://127.0.0.1:${port}`;
  const catalogue = await fetch(`${url}/api/catalogue`).then(response => response.json());
  const choices = Object.fromEntries(['press', 'complete', 'message', 'transition', 'typing'].map(context => {
    const effect = catalogue.assets.find(asset => asset.kind === 'effect' && asset.contexts.includes(context));
    assert.ok(effect, `Missing fixture candidate: ${context}`);
    return [context, {effect: effect.id, listener: 'fixture', reason: `${context} fixture choice`}];
  }));
  const put = document => fetch(`${url}/api/reviews`, {method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(document)});
  const response = await put({...empty, contextChoices: choices});
  assert.equal(response.status, 200);
  let saved = await response.json();
  assert.equal(saved.revision, 1);
  assert.deepEqual(await fetch(`${url}/api/reviews`).then(response => response.json()), saved);
  const eligible = catalogue.assets.filter(asset => asset.kind === 'effect' && asset.contexts.includes('typing')).slice(0, 6);
  assert.equal(eligible.length, 6);
  const ranking = {...choices.typing, effect: eligible[0].id, alternatives: eligible.slice(1, 5).map(asset => asset.id)};
  const rankedResponse = await put({...saved, contextChoices: {...choices, typing: ranking}});
  assert.equal(rankedResponse.status, 200);
  saved = await rankedResponse.json();
  assert.deepEqual(saved.contextChoices.typing, ranking);
  assert.deepEqual(await fetch(`${url}/api/reviews`).then(response => response.json()), saved);
  const markdown = await fetch(`${url}/api/export?format=md`).then(response => response.text());
  for (const context of Object.keys(choices)) assert.ok(markdown.includes(`### ${contextDefinitions[context].label}`));
  eligible.slice(0, 5).forEach((asset, rank) => assert.ok(markdown.includes(`${rank + 1}. ${asset.title} · Kaynak: ${asset.sourceUrl || asset.provider}`)));
  const exported = await fetch(`${url}/api/export?format=json`).then(response => response.json());
  assert.deepEqual(exported, saved);
  const originalChoices = Object.fromEntries(Object.entries(choices).filter(([context]) => context !== 'typing'));
  for (const imported of [exported, {...empty, contextChoices: originalChoices}, {press: choices.press}]) {
    const response = await fetch(`${url}/api/import`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(imported)});
    assert.equal(response.status, 200);
    saved = await response.json();
    assert.deepEqual(saved.contextChoices.typing, ranking);
    for (const [context, choice] of Object.entries(originalChoices)) assert.deepEqual(saved.contextChoices[context], choice);
  }
  assert.equal((await put({...saved, contextChoices: {...choices, unknown: choices.typing}})).status, 400);
  const unsupported = catalogue.assets.find(asset => asset.kind === 'effect' && !asset.contexts.includes('typing'));
  assert.ok(unsupported);
  for (const invalid of [
    {...ranking, alternatives: [ranking.effect]},
    {...ranking, alternatives: [eligible[1].id, eligible[1].id]},
    {...ranking, alternatives: eligible.slice(1).map(asset => asset.id)},
    {...ranking, alternatives: ['unknown-effect']},
    {...ranking, alternatives: [unsupported.id]},
    {...ranking, alternatives: 'not-an-array'},
    {...ranking, alternatives: null},
    {...ranking, effect: null},
    {...choices.typing, effect: unsupported.id},
  ]) assert.equal((await put({...saved, contextChoices: {...saved.contextChoices, typing: invalid}})).status, 400);
  assert.deepEqual(await fetch(`${url}/api/reviews`).then(response => response.json()), saved);
  const music = catalogue.assets.find(asset => asset.kind === 'music');
  const launchOptions = JSON.parse(await readFile(join(source, 'src/questions.json'), 'utf8')).find(question => question.key === 'launch').options;
  const human = {status: 'unreviewed', selections: {launch: launchOptions.slice(5, 11)}, notes: 'Keep my note', avoid_with: ['no narration'], listener: 'human', legacy: {feeling: 'old feeling', progression: 'old change', use_with: ['old use']}};
  const aiSuggestion = {model: 'fixture-audio-model', method: 'Fixture only', createdAt: new Date().toISOString(), launch: launchOptions.slice(0, 5)};
  const withAi = {...human, aiSuggestion};
  const aiResponse = await put({...saved, reviews: {...saved.reviews, [music.id]: withAi}});
  assert.equal(aiResponse.status, 200); saved = await aiResponse.json();
  assert.deepEqual(saved.reviews[music.id], withAi);
  assert.deepEqual(saved.contextChoices.typing, ranking);
  assert.equal((await put({...saved, revision: saved.revision - 1})).status, 409);
  for (const suggestion of [
    {...aiSuggestion, launch: launchOptions.slice(0, 4)},
    {...aiSuggestion, launch: [...launchOptions.slice(0, 4), launchOptions[0]]},
    {...aiSuggestion, launch: [...launchOptions.slice(0, 4), 'unknown']},
    {...aiSuggestion, model: 7},
    {...aiSuggestion, extra: true},
  ]) assert.equal((await put({...saved, reviews: {[music.id]: {...human, aiSuggestion: suggestion}}})).status, 400);
  assert.equal((await put({...saved, reviews: {[eligible[0].id]: withAi}})).status, 400);
  assert.deepEqual(await fetch(`${url}/api/reviews`).then(response => response.json()), saved);
  const aiExport = await fetch(`${url}/api/export?format=json`).then(response => response.json());
  const aiImportResponse = await fetch(`${url}/api/import`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(aiExport)});
  assert.equal(aiImportResponse.status, 200); saved = await aiImportResponse.json();
  assert.deepEqual(saved.reviews[music.id], withAi);
  const aiMarkdown = await fetch(`${url}/api/export?format=md`).then(response => response.text());
  assert.ok(aiMarkdown.includes('AI önerileri (insan onayı değildir): fixture-audio-model'));
  assert.ok(aiMarkdown.includes('Keep my note'));
  aiSuggestion.launch.forEach((option, index) => assert.ok(aiMarkdown.includes(`${index + 1}. ${option}`)));
  const questions = JSON.parse(await readFile(join(source, 'src/questions.json'), 'utf8'));
  const answers = Object.fromEntries(questions.filter(question => question.key !== 'launch').map(question => [question.key, {choices: question.options.slice(0, 2), reason: `${question.key} audio reason`} ]));
  answers.end = {choices: [], reason: 'Ending is uncertain'};
  const fullSuggestion = {...aiSuggestion, answers, notes: 'Audio changes across the track', avoid_with: ['Dense narration'], caveat: 'Model suggestion, not human approval'};
  const fullReview = {...human, aiSuggestion: fullSuggestion};
  const fullResponse = await put({...saved, reviews: {[music.id]: fullReview}});
  assert.equal(fullResponse.status, 200); saved = await fullResponse.json();
  assert.deepEqual(saved.reviews[music.id], fullReview);
  assert.deepEqual(saved.contextChoices.typing, ranking);
  for (const invalid of [
    {...fullSuggestion, answers: {...answers, end: undefined}},
    {...fullSuggestion, answers: {...answers, extra: answers.feeling}},
    {...fullSuggestion, answers: {...answers, feeling: {choices: ['unknown'], reason: 'reason'}}},
    {...fullSuggestion, answers: {...answers, start: {choices: [answers.start.choices[0], answers.start.choices[0]], reason: 'reason'}}},
    {...fullSuggestion, answers: {...answers, change: {choices: [], reason: ''}}},
    {...fullSuggestion, notes: 7},
    {...fullSuggestion, avoid_with: ['1','2','3','4']},
    {...fullSuggestion, caveat: []},
  ]) assert.equal((await put({...saved, reviews: {[music.id]: {...human, aiSuggestion: invalid}}})).status, 400);
  assert.deepEqual(await fetch(`${url}/api/reviews`).then(response => response.json()), saved);
  const fullExport = await fetch(`${url}/api/export?format=json`).then(response => response.json());
  const fullImport = await fetch(`${url}/api/import`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(fullExport)});
  assert.equal(fullImport.status, 200); saved = await fullImport.json();
  assert.deepEqual(saved.reviews[music.id], fullReview);
  const fullMarkdown = await fetch(`${url}/api/export?format=md`).then(response => response.text());
  for (const answer of Object.values(answers)) assert.ok(fullMarkdown.includes(answer.reason));
  for (const value of [fullSuggestion.notes, fullSuggestion.avoid_with[0], fullSuggestion.caveat, human.notes]) assert.ok(fullMarkdown.includes(value));
  const silence = {...choices.typing, effect: null, alternatives: []};
  const silentResponse = await put({...saved, contextChoices: {...saved.contextChoices, typing: silence}});
  assert.equal(silentResponse.status, 200);
  saved = await silentResponse.json();
  assert.deepEqual(saved.contextChoices.typing, silence);
  for (const [context, choice] of Object.entries(originalChoices)) assert.deepEqual(saved.contextChoices[context], choice);
});
