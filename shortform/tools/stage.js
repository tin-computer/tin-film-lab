// Preview harness for seek(t) films. In a normal browser it scales the fixed-size stage to the
// window, plays the cut's music and loops; space pauses, ←/→ step one frame, [/] step one beat,
// 0 restarts. Under ?render=1 it does nothing, so renders see only window.seek.
//
//   <div id="stage"> ...film DOM... </div>
//   <script src="stage.js"></script>
//   Stage({ width: 1080, height: 1920, audio: '../music-cut/music.wav', beat: CUE.beat })
(function (root) {
  function Stage({ width, height, audio, beat = 0.5, fps = 60 }) {
    const q = new URLSearchParams(location.search);
    const el = document.getElementById('stage');
    el.style.cssText += `;position:absolute;left:0;top:0;width:${width}px;height:${height}px;overflow:hidden;transform-origin:0 0`;
    if (q.has('render')) return;
    document.documentElement.style.background = '#000';
    const fit = () => {
      const s = Math.min(innerWidth / width, innerHeight / height);
      el.style.transform = `translate(${(innerWidth - width * s) / 2}px, ${(innerHeight - height * s) / 2}px) scale(${s})`;
    };
    addEventListener('resize', fit); fit();
    const a = audio ? new Audio(audio) : null;
    let playing = false, t = Number(q.get('t') || 0), t0 = 0;
    const dur = () => window.FILM.duration;
    const show = () => window.seek(((t % dur()) + dur()) % dur());
    function loop() {
      if (!playing) return;
      t = a && !a.paused ? a.currentTime : (performance.now() - t0) / 1000;
      if (t >= dur()) { t = 0; if (a) { a.currentTime = 0; a.play(); } else t0 = performance.now(); }
      show(); requestAnimationFrame(loop);
    }
    function play() { playing = true; if (a) { a.currentTime = t; a.play().catch(() => {}); } t0 = performance.now() - t * 1000; loop(); }
    function pause() { playing = false; if (a) a.pause(); }
    addEventListener('keydown', e => {
      if (e.key === ' ') { playing ? pause() : play(); e.preventDefault(); return; }
      const step = { ArrowRight: 1 / fps, ArrowLeft: -1 / fps, ']': beat, '[': -beat }[e.key];
      if (e.key === '0') t = 0; else if (step) t += step; else return;
      pause(); show();
    });
    addEventListener('click', () => (playing ? pause() : play()));
    show();
  }
  root.Stage = Stage;
})(window);
