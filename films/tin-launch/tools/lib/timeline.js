// Frame-based timing adapted from Cinetic's timeline pattern. See tools/cinetic/LICENSE.
(function (root) {
  function Timeline({ fps = 60, duration, beat, events, acts, reads = [] }) {
    if (![fps, duration, beat].every(n => Number.isFinite(n) && n > 0)) throw Error('Positive finite fps, duration and beat required');
    const frame = seconds => Math.round(seconds * fps);
    const total = frame(duration);
    const cue = Object.fromEntries(Object.entries(events).map(([id, seconds]) => {
      if (!Number.isFinite(seconds) || seconds < 0 || frame(seconds) >= total) throw Error(`Invalid cue: ${id}`);
      return [id, frame(seconds)];
    }));
    const segments = Object.entries(acts).map(([id, [start, end]]) => [id, { from: frame(start), dur: frame(end) - frame(start) }]);
    let previous = 0;
    for (const [id, act] of segments) {
      if (act.from !== previous || act.dur <= 0) throw Error(`Non-contiguous act: ${id}`);
      previous = act.from + act.dur;
    }
    if (previous !== total) throw Error('Acts must cover the film');
    for (const read of reads) {
      if (!read.text || !Number.isFinite(read.start) || !Number.isFinite(read.end) || read.start < 0 || read.end <= read.start || read.end > duration) throw Error('Invalid reading window');
    }
    return {
      fps, duration, total, cue, frame,
      // Keep subframe motion continuous; round only discrete text and button state.
      progress: (f, start, length) => Math.max(0, Math.min(1, (f - cue[start]) / (length * fps))),
      gridFrame: (bar, beatInBar = 0, sixteenth = 0) => frame(((bar - 1) * 4 + beatInBar + sixteenth / 4) * beat),
      events: Object.entries(cue).map(([name, f]) => ({ name, t: f / fps })),
      cues: () => ({ fps, total, bpm: 60 / beat, pace: 'calm', acts: Object.fromEntries(segments), cue,
        events: Object.entries(cue).map(([id, f]) => ({ id, f, kind: 'cue' })),
        copy: reads.map((r, id) => ({ id: String(id), text: r.text, kind: 'ui', resolved: frame(r.start), out: frame(r.end), read: [[frame(r.start), frame(r.end)]] })) }),
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = Timeline;
  else root.Timeline = Timeline;
})(typeof window !== 'undefined' ? window : globalThis);
