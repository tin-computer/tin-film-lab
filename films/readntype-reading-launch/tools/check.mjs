import assert from 'node:assert/strict';
import {chromium} from '../../tin-launch/tools/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({viewport: {width: 960, height: 540}}), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('requestfailed', r => errors.push('Missing asset: ' + r.url()));
  await page.goto(new URL('../src/index.html', import.meta.url).href);
  await page.waitForFunction(() => window.seek);
  const result = await page.evaluate(async () => {
    const frames = [], drop = FILM.events.find(e => e.name === 'answer').t;
    for (const t of [0.5, 4.6, 8.9, 12, drop, 14.5, 18]) {
      await seek(t);
      frames.push({...FRAME, correct: document.querySelectorAll('.char.correct').length});
    }
    await seek(8.9);
    const boxes = [...document.querySelectorAll('#reader .char')].map(el => el.getBoundingClientRect());
    const clipped = boxes.some(r => r.left < 0 || r.right > 960 || r.top < 0 || r.bottom > 540);
    await seek(12);
    const question = document.querySelector('.quiz-fieldset').getBoundingClientRect();
    return {
      frames, clipped, question: {left: question.left, right: question.right, bottom: question.bottom},
      duration: FILM.duration, drop, musicDrop: CUE.sections.find(s => s.name === 'drop').t,
      assets: [rabbit, typewriter, wippy].every(im => im.complete && im.naturalWidth > 0),
      fonts: document.fonts.check('64px Mono') && document.fonts.check('700 120px Geist') && document.fonts.check('40px Geist'),
    };
  });
  assert.deepEqual(result.frames.map(f => f.phase), ['opening', 'reading', 'reading', 'question', 'answer', 'answer', 'end']);
  assert(result.frames.every(f => f.example));
  assert(result.frames[2].correct > result.frames[1].correct, 'The real word renderer must advance correct characters');
  assert.equal(result.frames[4].answer, 'Her sister');
  assert(!result.clipped, 'Reading text must fit the picture');
  assert(result.question.left >= 0 && result.question.right <= 960 && result.question.bottom <= 540);
  assert(result.assets && result.fonts, 'All images and fonts must load');
  assert(Math.abs(result.drop - result.musicDrop) < 1 / 30, 'Answer reveal must match the music within one preview frame');
  assert(result.duration > 19 && result.duration < 20);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({checks: 'pass', ...result}, null, 2));
} finally { await browser.close(); }
