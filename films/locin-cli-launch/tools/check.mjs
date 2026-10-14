import assert from 'node:assert/strict';
import {chromium} from '../../tin-launch/tools/node_modules/playwright/index.mjs';
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',r=>errors.push('Missing asset: '+r.url()));
 await page.goto(new URL('../src/index.html',import.meta.url).href);
 await page.waitForFunction(()=>window.seek);
 const result=await page.evaluate(async()=>{
  const frames=[];for(const t of [0,1,5,7.9,9,13,18,19.9]){await seek(t);frames.push({...FRAME})}
  return {frames,duration:FILM.duration,drop:FILM.events.find(x=>x.name==='languages').t,musicDrop:CUE.sections.find(x=>x.name==='drop').t,
    assets:Object.values(im).every(x=>x.complete&&x.naturalWidth>0),fonts:document.fonts.check('40px Mono')&&document.fonts.check('40px Geist')&&document.fonts.check('700 80px Geist'),events:FILM.events,beat:CUE.beat};
 });
 assert.deepEqual(result.frames.map(x=>x.phase),['opening','opening','extract','extract','languages','files','end','end']);
 assert(result.frames.every(x=>x.example&&x.key==='project.create'));assert.deepEqual(result.frames[4].locales,['en','tr','de','fr']);
 assert(result.frames[6].retainedFiles&&result.frames[6].mascot);assert(result.assets&&result.fonts);
 assert(Math.abs(result.drop-result.musicDrop)<1/60,'The picture drop must match the music within one preview frame');
 assert.equal(result.duration,20);assert(result.events.every(x=>Math.abs(x.t/result.beat-Math.round(x.t/result.beat))<0.001));assert.deepEqual(errors,[]);console.log(JSON.stringify({checks:'pass',...result},null,2));
} finally {await browser.close()}
