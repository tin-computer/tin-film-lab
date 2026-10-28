import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,readFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {reviewFrames} from './review_frames.mjs';
mkdirSync(resolve('out'),{recursive:true});
const dir=mkdtempSync(resolve('out/review-test-'));
const scene=[{name:'Product',from:0,to:.2,kind:'story'},{name:'Finish',from:.2,to:.4,kind:'closing'}];
function html(body,scenes=scene){return `<!doctype html><meta charset="utf-8"><style>body{margin:0;width:320px;height:180px;overflow:hidden;font:16px Arial}pre{width:100px;height:30px;overflow:hidden}</style>${body}<script>window.FILM={width:320,height:180,duration:.4,events:[{name:'result',t:.2,role:'result'}],scenes:${JSON.stringify(scenes)}};window.seek=()=>{};</script>`}
async function run(name,body,scenes){const page=join(dir,name+'.html');writeFileSync(page,html(body,scenes));return reviewFrames({page,outdir:join(dir,name),w:320,h:180,fps:10})}
try{
 const clean=await run('clean','<p data-film-copy>Product ready.</p><code>example.com --flag</code>');
 assert.equal(clean.errors.length,0);assert.equal(clean.frames_checked,4);assert.equal(clean.visual_review,'pending');
 assert(clean.snapshots.some(s=>s.name==='scene-1-middle'));assert(clean.snapshots.some(s=>s.name==='ending-0'));
 const overflow=await run('overflow','<pre>really-long-command-that-does-not-fit</pre>');assert(overflow.errors.some(e=>e.code==='element_overflow'||e.code==='text_clipped_by_container'));
 const copy=await run('copy','<p data-film-copy>example.com · free in open beta</p>');assert(copy.warnings.some(e=>e.code==='decorative_copy'));
 const production=await run('production-label','<p data-film-copy>Illustrated example</p>');assert(production.errors.some(e=>e.code==='production_label'));
 const real=await run('ui','<p>1 of 5 questions</p><div id="speech-captions">Example session</div>');assert(!real.errors.some(e=>e.code==='production_label'));assert(!real.warnings.some(e=>e.code==='decorative_copy'));
 const early=await run('early','<p>Logo</p>',[{...scene[0],kind:'closing'},scene[1]]);assert(early.errors.some(e=>e.message?.includes('closing scene')));
 const gaps=await run('gap','<p>Ready</p>',[{...scene[0],to:.1},scene[1]]);assert(gaps.errors.some(e=>e.message?.includes('gaps')));
 const reference=await run('reference','<p>UI</p>',[{...scene[0],kind:'product'},scene[1]]);assert(reference.warnings.some(e=>e.code==='missing_interface_reference'));
 const hidden=await run('hidden','<div style="display:none"><pre>long-long-long-command</pre></div><p>Ready</p>');assert.equal(hidden.errors.length,0);
 const dot=await run('period','<p data-film-copy>Fast . Free</p>');assert(dot.warnings.some(e=>e.code==='decorative_copy'));
 writeFileSync(join(dir,'reference.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>');
 const referenced=await run('referenced','<p>UI</p>',[{...scene[0],kind:'product',reference:{image:'reference.svg',source:'https://example.com/product'}},scene[1]]);
 assert.equal(referenced.errors.length,0);assert(!referenced.warnings.some(e=>e.code==='missing_interface_reference'));
 assert(readFileSync(join(dir,'referenced/index.html'),'utf8').includes('reference-0.svg'));assert.equal(referenced.interface_review,'pending');
 const remote=await run('remote','<p>UI</p>',[{...scene[0],reference:{image:'https://example.com/image.png',source:'https://example.com'}},scene[1]]);
 assert(remote.errors.some(e=>e.code==='review_failed'));
 console.log('12 frame-review cases passed');
}finally{rmSync(dir,{recursive:true,force:true})}
