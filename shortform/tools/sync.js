// Waveform-driven timing for seek(t) films: put typing, cuts and accents on the transients the
// viewer actually hears, not on a constant clock. Pure functions of the cue, so every frame and
// every render agrees. Works in the page (window.Sync) and in node (module.exports).
//
//   const S = Sync(CUE)                     // CUE from music/tools/cut.py (cue.json / cue.js)
//   S.peaks({ from, to, min })              // onset peaks in [from, to): [{ t, s, grid }] strongest first
//   S.typing(text, from, to, opts)          // per-character reveal times; word groups land on peaks
//   S.typed(text, plan, t)                  // the visible prefix of text at time t
//   S.cuts(n, { from, to, minGap })         // n cut times on the strongest downbeats / hits
//   S.flash(t, list, decay)                 // 1 at each time in list, decaying (for accents)
//
// Peaks come from the cue's 60 fps `onset` envelope (spectral flux measured from the audio), are
// kept only if they stand above their neighbourhood, and snap to the 16th-note grid when within
// 25 ms, so they sit where the drummer is.
(function (root) {
  function Sync(cue) {
    const env = cue.envelope, fps = env.fps;
    const on = env.onset || env.all, kick = env.kick || env.low || on;
    const sixteenth = cue.beat / 4;

    function rawPeaks() {
      const out = [];
      const W = Math.max(3, Math.round(fps * sixteenth * 0.9));   // neighbourhood ≈ one 16th
      for (let i = 1; i < on.length - 1; i++) {
        if (on[i] < on[i - 1] || on[i] < on[i + 1]) continue;
        let lo = Infinity, hi = -Infinity;
        for (let k = Math.max(0, i - W); k <= Math.min(on.length - 1, i + W); k++) { if (k !== i) { lo = Math.min(lo, on[k]); hi = Math.max(hi, on[k]); } }
        if (on[i] < hi) continue;                                   // not the local maximum
        const prom = on[i] - lo;
        if (prom < 0.08) continue;
        let t = i / fps;
        const g = Math.round(t / sixteenth) * sixteenth;
        const grid = Math.abs(g - t) <= 0.025 ? Math.round(g / sixteenth) % 4 : null;  // 0 = on the beat
        if (grid !== null) t = g;
        out.push({ t: +t.toFixed(4), s: +(prom * (grid === 0 ? 1.15 : 1) + 0.5 * (kick[i] || 0)).toFixed(4), grid });
      }
      return out;
    }
    const ALL = rawPeaks();

    function peaks({ from = 0, to = cue.length, min = 0 } = {}) {
      return ALL.filter(p => p.t >= from && p.t < to && p.s >= min).sort((a, b) => b.s - a.s);
    }

    // Split text into readable groups: short words travel together, long words alone.
    function groups(text, maxChars) {
      const words = text.split(/(\s+)/).filter(Boolean);
      const gs = []; let cur = '';
      for (const w of words) {
        if (/^\s+$/.test(w)) { cur += w; continue; }
        if (cur.trim() && (cur + w).trim().length > maxChars) { gs.push(cur); cur = ''; }
        cur += w;
      }
      if (cur) gs.push(cur);
      return gs;
    }

    // Each group starts on a transient and types out in a short burst; between bursts it rests,
    // which is what makes typing read as "on the music" instead of a steady crawl.
    // spread (default): split [from, to) into one slot per group and take each slot's strongest
    // transient, so typing keeps moving through the window instead of bunching on the loudest bar.
    // spread: false takes the strongest transients anywhere (bursty, with long rests).
    function typing(text, from, to, { maxChars = 10, burst = 0.09, minGap = 0.12, groups: given, spread = true } = {}) {
      if (!Number.isFinite(from) || !Number.isFinite(to) || from < 0 || to <= from || to > cue.length)
        throw new Error('Typing needs a finite window inside the music cut');
      const gs = given || groups(text, maxChars);
      if (!gs.length) return { text, times: [], groups: [], at: [] };
      const cand = ALL.filter(p => p.t >= from && p.t < to - burst);
      const picked = [];
      if (spread) {
        const w = (to - from) / gs.length;
        for (let i = 0; i < gs.length; i++) {
          const a = from + i * w, b = a + w;
          const best = cand.filter(p => p.t >= a && p.t < b && picked.every(q => Math.abs(q.t - p.t) >= minGap)).sort((x, y) => y.s - x.s)[0];
          if (best) { picked.push(best); continue; }
          const g = Math.ceil(a / (cue.beat / 2)) * (cue.beat / 2);       // nothing heard here: next 8th
          picked.push({ t: g < b ? g : a, s: 0, grid: 0, filled: true });
        }
      } else {
        // the first group starts on the first strong transient, so typing begins when the shot does
        const top = Math.max(0, ...cand.map(p => p.s));
        const lead = cand.find(p => p.s >= 0.6 * top);
        if (lead) picked.push(lead);
        for (const p of [...cand].sort((a, b) => b.s - a.s)) {
          if (picked.length >= gs.length) break;
          if (picked.every(q => Math.abs(q.t - p.t) >= minGap)) picked.push(p);
        }
        // A short or quiet window may not have enough grid hits. Keep all groups inside it.
        for (let i = 0; picked.length < gs.length && i < gs.length; i++) {
          const t = from + (to - from) * i / gs.length;
          if (!picked.some(q => Math.abs(q.t - t) < 1e-8)) picked.push({ t, s: 0, grid: null, filled: true });
        }
      }
      picked.sort((a, b) => a.t - b.t);
      const times = []; let at = 0;
      gs.forEach((g, i) => {
        const p = picked[i] || picked[picked.length - 1];
        const n = g.length, next = picked[i + 1] ? picked[i + 1].t : to;
        const span = Math.min(burst + 0.012 * n, (next - p.t) * 0.8);
        for (let k = 0; k < n; k++) times[at + k] = p.t + span * (k / Math.max(1, n - 1));
        at += n;
      });
      return { text, times, groups: gs, at: picked.map(p => p.t) };
    }
    function typed(text, plan, t) {
      let n = 0; while (n < plan.times.length && plan.times[n] <= t) n++;
      return text.slice(0, n);
    }

    function cuts(n, { from = 0, to = cue.length, minGap = cue.beat * 2 } = {}) {
      const cands = [
        ...cue.downbeats.filter(t => t > from && t < to).map(t => ({ t, s: 1 + (kick[Math.round(t * fps)] || 0) + (cue.bars.find(b => Math.abs(b.t - t) < 0.01)?.phrase_start ? 0.6 : 0) })),
        ...(cue.hits || []).filter(h => h.t > from && h.t < to && h.on_beat).map(h => ({ t: h.t, s: 0.8 + h.strength })),
      ].sort((a, b) => b.s - a.s);
      const out = [];
      for (const c of cands) { if (out.length >= n) break; if (out.every(t => Math.abs(t - c.t) >= minGap)) out.push(c.t); }
      return out.sort((a, b) => a - b);
    }

    function flash(t, list, decay = 9) {
      let v = 0; for (const x of list) if (t >= x) v = Math.max(v, Math.exp(-decay * (t - x)));
      return v;
    }

    return { peaks, typing, typed, cuts, flash, groups, all: ALL };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = Sync;
  else root.Sync = Sync;
})(typeof window !== 'undefined' ? window : globalThis);
