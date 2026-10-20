// Platform overlay guides for previewing 9:16 films. Open the page with ?guides=tiktok|reels|shorts
// to shade the areas each app covers with its own UI (header, action rail, caption, progress bar).
// Never drawn when ?render=1, so renders stay clean. Zones match shortform/tools/slopcheck.mjs.
(function () {
  const q = new URLSearchParams(location.search);
  const which = q.get('guides');
  if (!which || q.has('render')) return;
  const Z = {
    tiktok: { top: 0.07, bottom: 0.20, left: 0.04, right: 0.14 },
    reels: { top: 0.11, bottom: 0.22, left: 0.04, right: 0.13 },
    shorts: { top: 0.08, bottom: 0.21, left: 0.04, right: 0.13 },
  }[which];
  if (!Z) return;
  const css = 'position:fixed;background:rgba(255,0,80,.18);pointer-events:none;z-index:99999;outline:1px dashed rgba(255,0,80,.7)';
  const add = s => { const d = document.createElement('div'); d.style.cssText = css + ';' + s; document.body.appendChild(d); };
  addEventListener('load', () => {
    add(`left:0;right:0;top:0;height:${Z.top * 100}vh`);
    add(`left:0;right:0;bottom:0;height:${Z.bottom * 100}vh`);
    add(`left:0;width:${Z.left * 100}vw;top:${Z.top * 100}vh;bottom:${Z.bottom * 100}vh`);
    add(`right:0;width:${Z.right * 100}vw;top:${Z.top * 100}vh;bottom:${Z.bottom * 100}vh`);
  });
})();
