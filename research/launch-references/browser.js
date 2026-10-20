// Read-only view of the authored reports. No third-party scripts or media requests.
const $ = id => document.getElementById(id);
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sourceLink = url => {
  const parsed = new URL(url);
  if (!['https:', 'http:'].includes(parsed.protocol)) throw Error('Unsupported source URL');
  return `<a href="${esc(parsed.href)}" target="_blank" rel="noopener noreferrer">Original ↗</a>`;
};
const get = async path => {
  const response = await fetch(path);
  if (!response.ok) throw Error(`${path}: HTTP ${response.status}`);
  return response.json();
};
let catalog, group = '', page = 0, selected = null;
const size = 20;
function show() {
  const query = $('query').value.toLowerCase().trim();
  const rows = catalog.films.filter(f =>
    (!group || f.ui.includes(group)) &&
    ($('notes').value !== 'hamit' || f.hamit_notes.length) &&
    (!query || [f.id, f.title, f.product, f.scenario, f.lesson, ...f.elements.map(e=>e.name)]
      .join(' ').toLowerCase().includes(query)));
  const pages = Math.max(1, Math.ceil(rows.length / size));
  page = Math.min(page, pages - 1);
  $('count').textContent = `${rows.length} films${group ? ` · ${group}` : ''}`;
  $('films').innerHTML = rows.slice(page * size, (page + 1) * size).map(f => `<tr>
    <td><button class="film" data-id="${f.id}">${String(f.id).padStart(3,'0')} · ${esc(f.title)}</button>
      <small>${esc(f.product)} · ${Math.round(f.seconds)}s${f.hamit_notes.length ? ' · Hamit’s note' : ''}</small></td>
    <td class="note">${esc(f.lesson)}</td><td class="note">${sourceLink(f.source)}</td>
  </tr>`).join('') || '<tr><td colspan="3">No match. Try a shorter term or choose All films.</td></tr>';
  $('page').textContent = `${page + 1} / ${pages}`;
  $('prev').disabled = page === 0; $('next').disabled = page === pages - 1;
  for (const b of $('groups').querySelectorAll('button')) b.setAttribute('aria-pressed', b.dataset.group === group);
}
function table(headers, rows) {
  return `<table><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${
    rows.map(row=>`<tr>${row.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
async function openFilm(id) {
  const film = catalog.films.find(f=>f.id === id);
  if (!film) return;
  selected = id;
  const reader = $('reader');
  reader.hidden = false;
  reader.innerHTML = '<p role="status">Loading review…</p>';
  reader.focus();
  try {
    const r = await get(`data/${String(id).padStart(3,'0')}.json`);
    if (selected !== id) return;
    const close = '<button class="back" id="close">Close review</button>';
    reader.innerHTML = close + `<h2>${esc(film.title)}</h2><p>${sourceLink(film.source)} · <a href="reviews/${String(id).padStart(3,'0')}.md">Full Markdown report</a></p>
      <p>${esc(r.product_from_film)}</p><p class="muted note">${esc(r.scope)}</p>
      <h3>Explains well</h3><p>${esc(r.explains_well)}</p><h3>Still unclear</h3><p>${esc(r.unclear)}</p>
      ${film.hamit_notes.map(n=>`<h3>Hamit’s saved comment · source ${n.id}</h3><blockquote>${esc(n.comment)}</blockquote>`).join('')}
      <h3>Scene and motion</h3>${table(['Time','What changes','Why it matters'],r.scenes.map(s=>[`${s.start}–${s.end}s`,s.action,s.purpose]))}
      <h3>Sound · listening unverified</h3>${table(['Time','Finding','Evidence / limits'],r.sound.map(s=>[`${s.start}–${s.end}s`,s.detail,s.evidence]))}
      <h3>25 review questions</h3>${table(['Question','Finding','Status / evidence'],r.categories.map(c=>[`${c.id} · ${catalog.questions[c.id]}`,c.finding,`${c.status}: ${c.reason}\n${c.evidence}`]))}
      <h3>Try in a new film</h3><ul>${r.lessons.try.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`;
    $('close').onclick = () => {
      selected = null; reader.hidden = true;
      const button = $('films').querySelector(`[data-id="${id}"]`);
      (button || $('query')).focus();
    };
  } catch (error) {
    if (selected === id) reader.innerHTML = `<p class="error">Could not open this review. ${esc(error.message)}</p>`;
  }
}
async function init() {
  catalog = await get('catalog.json');
  const c = catalog.coverage;
  $('coverage').textContent = `${c.source_entries_covered} source entries · ${c.unique_edits_reviewed} distinct edits · ${c.closer_windows} closer motion windows`;
  $('groups').innerHTML = [{name:'',count:catalog.films.length},...catalog.ui].map(g=>
    `<button data-group="${esc(g.name)}" aria-pressed="${!g.name}"><span>${esc(g.name || 'All films')}</span><span class="number">${g.count}</span></button>`).join('');
  $('groups').onclick = event => {
    const b = event.target.closest('button');
    if (b) { group = b.dataset.group; page = 0; show(); }
  };
  $('films').onclick = event => {
    const b = event.target.closest('button[data-id]');
    if (b) openFilm(Number(b.dataset.id));
  };
  $('query').oninput = $('notes').onchange = () => { page = 0; show(); };
  $('prev').onclick = () => { page--; show(); };
  $('next').onclick = () => { page++; show(); };
  show();
}
init().catch(error => {
  $('coverage').textContent = 'Could not load the reference index.';
  $('count').className = 'error';
  $('count').textContent = `${error.message}. Serve this folder with python3 -m http.server --bind 127.0.0.1. The Markdown tables also work on GitHub.`;
});
