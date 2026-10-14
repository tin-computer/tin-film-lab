import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium} from '../../tin-launch/tools/node_modules/playwright/index.mjs';
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));
 await page.goto(new URL('../src/index.html?w=1280&h=720',import.meta.url).href);
 const result=await page.evaluate(async()=>{
  const frames=[];
  for(const t of [2,6,10,18]){await seek(t);frames.push({...FRAME})}
  const boxes=[...document.querySelectorAll('#cta .result-sheet,#cta .connect-panel')].map(el=>el.getBoundingClientRect());
  return {frames,duration:FILM.duration,assets:[...document.images].every(im=>im.complete&&im.naturalWidth>0),
   fit:boxes.every(r=>r.left>=0&&r.right<=1280&&r.top>=0&&r.bottom<=720),
   command:document.querySelector('#cta code').textContent,
   controls:[...document.querySelectorAll('#result .x-posts-context button')].map(el=>el.textContent),
   drop:FILM.events.find(e=>e.name==='result').t,musicDrop:CUE.sections.find(e=>e.name==='drop').t,
   copy:document.querySelector('#stage').textContent.replace(/\s+/g,' ').trim()};
 });
 assert.deepEqual(result.frames.map(f=>f.phase),['agent','running','result','connect']);
 assert(result.frames.every(f=>f.example&&f.workflow==='social.x_draft'));
 assert.equal(result.command,'codex mcp add tin --url https://app.tin.computer/mcp');
 assert.deepEqual(result.controls,['Draft notes','Edit post','Preview post']);
 assert(result.assets&&result.fit);assert.equal(result.duration,20);
 assert(Math.abs(result.drop-result.musicDrop)<1/60);assert.deepEqual(errors,[]);
 // Lock the approved copy: animation must not add words.
 assert.equal(createHash('sha256').update(result.copy).digest('hex'),'8a1dad6420b8d816dd38ce77b7f1013fc2162de578307d21848bd4f6f4e43404');
 result.words=result.copy.split(' ').length;delete result.copy;
 console.log(JSON.stringify({checks:'pass',...result},null,2));
} finally {await browser.close()}
