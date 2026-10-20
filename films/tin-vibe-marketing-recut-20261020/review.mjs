import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from '../tin-launch/tools/node_modules/playwright/index.mjs';

const here=fileURLToPath(new URL('.',import.meta.url)),browser=await chromium.launch(),errors=[];
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));
 await page.goto(pathToFileURL(here+'src/index.html').href);await page.waitForFunction(()=>window.FILM&&window.seek);
 const state=async t=>{await page.evaluate(t=>window.seek(t),t);return page.evaluate(()=>({words:FRAME_TEXT,boxes:FRAME_BOXES}));};
 assert((await state(0)).words.includes('You built it.'));
 assert((await state(3)).words.includes('Now grow it.'));
 assert((await state(6.2)).words.includes('› Grow my recipe app'));
 assert((await state(8.8)).words.includes('Blog draft'));
 assert(!(await state(8.8)).words.includes('10 weeknight'));
 assert((await state(12)).words.includes('10 weeknight'));
 await state(10.7);assert((await page.evaluate(()=>FRAME_COVER)).w>300,'Recipe cover disappeared during the handoff');
 assert(!(await state(15)).words.includes('✓ Approved'));
 assert((await state(16)).words.includes('✓ Approved'));
 assert(!(await state(16)).words.includes('Pull request opened'));
 assert((await state(18)).words.includes('Pull request opened'));
 assert.deepEqual((await state(20.5)).words,['Vibe marketing.','tin.computer']);
 const data=await page.evaluate(()=>({duration:FILM.duration,events:FILM.events,cues:FILM.cues(),sound:FILM.soundCues()}));
 for(const cut of Object.values(data.cues.acts).slice(1).map(a=>a.from/60)){
  assert.deepEqual((await state(cut-.4/60)).words,(await state(cut)).words,'Blur subframe crossed a hard content cut');
 }
 await mkdir(here+'out/review',{recursive:true});
 const times=[0,.15,.6,1.2,1.5,1.8,2.4,3,3.6,4.5,4.8,5.1,5.4,5.8,6.2,7.2,7.8,8.4,8.8,9.6,10.2,10.45,10.7,11,11.4,12.4,14.4,15.4,15.6,16,16.8,17.8,19.2,20.2,21.5];
 for(const t of times){
  const s=await state(t);assert(s.words.length>0);assert(!/illustrated example|example session|1 of 5|introducing/i.test(s.words.join(' ')));
  for(const b of s.boxes)assert(b.x>=-1&&b.y>=-1&&b.x+b.w<=1921&&b.y+b.h<=1081,'Text outside frame: '+b.text);
  await page.screenshot({path:here+'out/review/'+t.toFixed(3)+'.png'});
 }
 const hash=async t=>{await state(t);return createHash('sha256').update(await page.screenshot()).digest('hex');};
 for(const t of [0,1.5,3.6,5.8,8.8,10.7,12.4,16,17.8,20.2]){const a=await hash(t);await hash(21.5);assert.equal(a,await hash(t),'Seek order changed the picture');}
 for(const [name,value]of [['events',data.events],['cues',data.cues],['audio-cues',data.sound]])await writeFile(here+'out/'+name+'.json',JSON.stringify(value,null,2)+'\n');
 assert.deepEqual(errors,[]);
 const result={sampledStates:times.length,repeatSeeks:10,hardCutSubframes:4,errors,productStates:'pass',humanListening:false,newViewerTest:false};
 await writeFile(here+'out/qa/source-review.json',JSON.stringify(result,null,2));console.log(result);
}finally{await browser.close();}
