// Lint a seek(t) film for the short-form failure modes we measured in launch videos.
//
//   node shortform/tools/slopcheck.mjs --page films/x/src/index.html --w 1080 --h 1920 \
//        [--fps 4 --platform tiktok|reels|shorts|none --out films/x/out/slop.json]
//
// It seeks the page every 1/fps seconds and reads the DOM (not pixels), so it knows each text's
// real size, transform, opacity and box. Rules, each with the reason it exists:
//
//   eyebrow     A short small line sitting just above a much larger one ("NEW FEATURE" over a
//               headline). The most recognisable template tell; it adds a label, not meaning.
//   wall        More than --max-words readable words of copy on screen at once (text inside
//               [data-material] is the product's own material being read or typed, and is counted
//               separately). Launch Shorts that work
//               keep headline copy to a few words; a muted viewer will not read a paragraph.
//   tiny        Text that would render under 11 px on a 360 px-wide phone (the critic's phone sheet).
//   unsafe      Text inside a platform's UI overlay zone (caption, buttons, progress bar) on 9:16.
//   glow        text-shadow or box-shadow blur over 12 px: the neon/glow default.
//   gradhero    A large centred heading over a gradient background: the default "AI launch" frame.
//   linger      The same words on screen for more than --linger seconds (captions that overstay).
//   readtime    Text that leaves the screen before it can be read (words / --read-wps seconds). A
//               deliberate strobe (a label changing language every beat) opts out with [data-strobe].
//
// Exit code 1 when any error-level rule fires. Warnings never fail the run.
import { chromium } from '../../films/tin-launch/tools/node_modules/playwright/index.mjs';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const page_ = resolve(arg('page', 'src/index.html'));
const W = Number(arg('w', 1080)), H = Number(arg('h', 1920));
const FPS = Number(arg('fps', 4));
const MAX_WORDS = Number(arg('max-words', 9));
const LINGER = Number(arg('linger', 4.5));
const READ_WPS = Number(arg('read-wps', 4));   // words a second a viewer reads in a short
const platform = arg('platform', H > W ? 'tiktok' : 'none');

// Overlay zones as fractions of a 1080x1920 frame. Approximate: each app moves these between
// versions, so treat them as a margin to stay inside, not pixel truth. Measured from current
// TikTok/Reels/Shorts screenshots (caption block, action rail, header and progress bar).
const ZONES = {
  tiktok: { top: 0.07, bottom: 0.20, left: 0.04, right: 0.14 },
  reels: { top: 0.11, bottom: 0.22, left: 0.04, right: 0.13 },
  shorts: { top: 0.08, bottom: 0.21, left: 0.04, right: 0.13 },
  none: { top: 0, bottom: 0, left: 0, right: 0 },
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('pageerror', e => console.error('page error:', e.message));
await page.goto('file://' + page_ + `?render=1&w=${W}&h=${H}`);
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => typeof window.seek === 'function' && window.FILM);
const dur = await page.evaluate(() => window.FILM.duration);

const frames = [];
for (let f = 0; f <= Math.floor(dur * FPS); f++) {
  const t = Math.min(dur - 1e-3, f / FPS);
  await page.evaluate(async t => { await window.seek(t); }, t);
  frames.push({ t, items: await page.evaluate(collect) });
}
await browser.close();

// Runs in the page: every visible block of text, with its painted box and type. Inline children
// (a word split into per-letter spans for typing) belong to their block, so they count as one text.
function collect() {
  const out = [];
  const W = innerWidth, H = innerHeight;
  const opacityOf = el => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return 0; o *= Number(s.opacity); } return o; };
  const blockOf = el => { let e = el; while (e.parentElement && getComputedStyle(e).display === 'inline') e = e.parentElement; return e; };
  const units = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const rg = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!el || el.closest('script,style')) continue;
    const b = blockOf(el);
    if (!n.textContent.trim()) { const u = units.get(b); if (u) u.text += ' '; continue; }   // keep word gaps
    if (opacityOf(el) < 0.15) continue;
    rg.selectNodeContents(n);
    const rs = [...rg.getClientRects()].filter(q => q.width > 0 && q.height > 0 && q.right > 0 && q.bottom > 0 && q.left < W && q.top < H);
    if (!rs.length) continue;
    const u = units.get(b) || { el, text: '', rects: [] };
    u.text += n.textContent; u.rects.push(...rs); units.set(b, u);
  }
  for (const [b, u] of units) {
    const text = u.text.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const L = Math.min(...u.rects.map(q => q.left)), T = Math.min(...u.rects.map(q => q.top));
    const R = Math.max(...u.rects.map(q => q.right)), B = Math.max(...u.rects.map(q => q.bottom));
    const s = getComputedStyle(u.el);
    // effective scale from transforms up the tree (a scaled-up heading is bigger than its font-size)
    let scale = 1; for (let e = u.el; e && e.nodeType === 1; e = e.parentElement) { const t = getComputedStyle(e).transform; if (t && t !== 'none') { const q = new DOMMatrix(t); scale *= Math.hypot(q.a, q.b); } }
    const bgs = []; for (let e = b; e && e.nodeType === 1; e = e.parentElement) { const g = getComputedStyle(e).backgroundImage; if (g && g !== 'none') bgs.push(g); }
    const bs = getComputedStyle(b);
    out.push({
      text, x: L, y: T, w: R - L, h: B - T, fs: parseFloat(s.fontSize) * scale, op: opacityOf(u.el),
      upper: bs.textTransform === 'uppercase' || (text.length > 2 && text === text.toUpperCase() && /[A-Z]/.test(text)),
      tracking: parseFloat(bs.letterSpacing) / parseFloat(bs.fontSize) || 0,
      align: bs.textAlign, shadow: s.textShadow + ' ' + bs.boxShadow, gradientBg: bgs.some(g => g.includes('gradient')),
      mono: /mono|code/i.test(s.fontFamily), ariaHidden: !!b.closest('[aria-hidden="true"],[data-slop-ignore]'),
      material: !!b.closest('[data-material]'), strobe: !!b.closest('[data-strobe]'),
    });
  }
  return out;
}

const words = s => (s.match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}'’.-]*/gu) || []).length;
const Z = ZONES[platform] || ZONES.none;
const issues = [];
const add = (level, rule, t, msg) => issues.push({ level, rule, t: +t.toFixed(2), msg });
const phoneScale = 360 / W;
const blurOf = sh => Math.max(0, ...[...sh.matchAll(/(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(\d+(?:\.\d+)?)px/g)].map(m => Number(m[3])));
const lastSeen = new Map();
const perFrameWords = [], perFrameMaterial = [];

for (const { t, items } of frames) {
  const live = items.filter(i => !i.ariaHidden);
  const total = live.filter(i => !i.material).reduce((a, i) => a + words(i.text), 0);
  perFrameWords.push(total);
  perFrameMaterial.push(live.filter(i => i.material).reduce((a, i) => a + words(i.text), 0));
  if (total > MAX_WORDS) add('error', 'wall', t, `${total} words on screen: ${live.map(i => i.text).join(' / ').slice(0, 120)}`);
  for (const a of live) {
    if (a.fs * phoneScale < 11) add('warn', 'tiny', t, `"${a.text.slice(0, 40)}" is ${(a.fs * phoneScale).toFixed(1)} px on a 360 px phone`);
    const cx = a.x + a.w / 2, cy = a.y + a.h / 2;
    if (Z.top + Z.bottom > 0 && (a.y < Z.top * H || a.y + a.h > (1 - Z.bottom) * H || a.x < Z.left * W || a.x + a.w > (1 - Z.right) * W))
      add('error', 'unsafe', t, `"${a.text.slice(0, 40)}" enters the ${platform} overlay zone`);
    if (blurOf(a.shadow) > 12) add('warn', 'glow', t, `"${a.text.slice(0, 30)}" has a ${blurOf(a.shadow)} px glow`);
    if (a.gradientBg && a.fs > 0.05 * H * (W / H > 1 ? 1 : 0.6) && Math.abs(cx - W / 2) < 0.05 * W && a.align === 'center')
      add('warn', 'gradhero', t, `centred heading "${a.text.slice(0, 30)}" over a gradient`);
    for (const b of live) {
      if (a === b) continue;
      const gap = b.y - (a.y + a.h);
      const aligned = Math.abs((a.x + a.w / 2) - (b.x + b.w / 2)) < 0.06 * W || Math.abs(a.x - b.x) < 0.015 * W;
      if (a.fs < 0.6 * b.fs && gap >= -2 && gap < 1.4 * b.fs && aligned && words(a.text) <= 4 && b.fs >= 0.03 * Math.min(W, H) && !a.mono)
        add(a.upper || a.tracking > 0.04 ? 'error' : 'warn', 'eyebrow', t, `"${a.text}" sits over "${b.text.slice(0, 30)}"`);
    }
    const key = a.text;
    const first = lastSeen.get(key);
    if (first === undefined) lastSeen.set(key, t);
    else if (t - first > LINGER && !a.mono && !a.material) { add('warn', 'linger', t, `"${key.slice(0, 40)}" on screen for ${(t - first).toFixed(1)} s`); lastSeen.set(key, Infinity); }
  }
  for (const k of [...lastSeen.keys()]) if (!live.some(i => i.text === k) && lastSeen.get(k) !== Infinity) lastSeen.delete(k);
}

// readtime: first continuous stretch each text is visible
const spans = new Map();
frames.forEach(({ t, items }) => {
  const now = new Set(items.filter(i => !i.ariaHidden && !i.strobe && words(i.text) > 1).map(i => i.text));
  for (const k of now) { const sp = spans.get(k); if (!sp) spans.set(k, { a: t, b: t, open: true }); else if (sp.open) sp.b = t; }
  for (const [k, sp] of spans) if (!now.has(k)) sp.open = false;
});
const texts = [...spans.keys()];
for (const [k, sp] of spans) {
  if (texts.some(o => o !== k && o.startsWith(k))) continue;   // text still being typed: judge the finished line
  const need = words(k) / READ_WPS, have = sp.b - sp.a + 1 / FPS;
  if (have + 1e-6 < need && sp.b < dur - 1 / FPS) add('warn', 'readtime', sp.a, `"${k.slice(0, 40)}" is up ${have.toFixed(2)} s; ${words(k)} words need ${need.toFixed(2)} s`);
}

// collapse repeats: one line per rule+message, with the time range it covers
const grouped = new Map();
for (const i of issues) {
  const k = i.rule + '|' + i.msg.replace(/\d+(\.\d+)? (px|words|s)/g, '#');
  const g = grouped.get(k) || { ...i, from: i.t, to: i.t, n: 0 };
  g.to = i.t; g.n++; grouped.set(k, g);
}
const list = [...grouped.values()].sort((a, b) => a.from - b.from);
const textFree = perFrameWords.filter(n => n === 0).length / perFrameWords.length;
const summary = {
  page: page_, w: W, h: H, platform, duration: dur, frames: frames.length,
  words_mean: +(perFrameWords.reduce((a, b) => a + b, 0) / perFrameWords.length).toFixed(2),
  words_max: Math.max(...perFrameWords), text_free_share: +textFree.toFixed(2),
  material_words_max: Math.max(...perFrameMaterial),
  errors: list.filter(i => i.level === 'error').length, warnings: list.filter(i => i.level === 'warn').length,
};
for (const i of list) console.log(`${i.level === 'error' ? 'ERR ' : 'warn'} ${i.rule.padEnd(8)} ${i.from.toFixed(2)}–${i.to.toFixed(2)}s  ${i.msg}`);
console.log(JSON.stringify(summary));
const out = arg('out');
if (out) writeFileSync(resolve(out), JSON.stringify({ summary, issues: list, words_per_frame: perFrameWords }, null, 1));
process.exit(summary.errors ? 1 : 0);
