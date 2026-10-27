import {useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode} from 'react';
import {createRootRoute, createRoute, createRouter, Outlet} from '@tanstack/react-router';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState} from '@tanstack/react-table';
import * as Tabs from '@radix-ui/react-tabs';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Slider from '@radix-ui/react-slider';
import {ArrowDown, ArrowDownToLine, ArrowUp, AudioLines, Bookmark, Check, ChevronDown, Circle, CircleAlert, Disc3, ExternalLink, Headphones, LoaderCircle, Music2, Pause, Play, RotateCcw, Search, SlidersHorizontal, Upload, Volume2, VolumeX, X, MousePointer2, Send, Image, ArrowRight} from 'lucide-react';
import {contextDefinitions, contextLabels, emptyReview, questions, rankedEffects, statusLabels, type Asset, type Catalogue, type Context, type EffectChoice, type Kind, type Review, type ReviewDocument, type ReviewStatus, type SelectionKey} from './model';

type DeskSearch = {tab:Kind; provider:string; q:string; status:'all' | ReviewStatus; id:string; context?:Context};
const contexts = Object.keys(contextLabels) as Context[];
const statuses = Object.keys(statusLabels) as ReviewStatus[];
const REVIEWS_KEY = ['sound-reviews'];

class ApiError extends Error {
  constructor(message:string, public status:number) { super(message); }
}

async function jsonRequest<T>(path:string, init?:RequestInit):Promise<T> {
  const response = await fetch(path, {...init, headers:{'Content-Type':'application/json', ...init?.headers}});
  const value = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = typeof value?.error === 'string' ? value.error : typeof value?.message === 'string' ? value.message : `HTTP ${response.status}`;
    throw new ApiError(response.status === 409 ? 'Diskteki kayıt başka bir pencerede değişti. Yerel taslağın korunuyor.' : detail, response.status);
  }
  if (!value) throw new Error('Sunucudan geçerli bir yanıt gelmedi.');
  return value as T;
}

function downloadBlob(blob:Blob, name:string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function useReviews() {
  const client = useQueryClient();
  const query = useQuery({queryKey:REVIEWS_KEY, queryFn:() => jsonRequest<ReviewDocument>('/api/reviews'), refetchInterval:5000});
  const mutation = useMutation({mutationFn:(document:ReviewDocument) => jsonRequest<ReviewDocument>('/api/reviews', {method:'PUT', body:JSON.stringify(document)})});
  const [document, setDocument] = useState<ReviewDocument | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const draft = useRef<ReviewDocument | null>(null);
  const sequence = useRef(0);
  const savedSequence = useRef(0);
  const revision = useRef(0);
  const blocked = useRef<Error | null>(null);
  const activeSave = useRef<Promise<boolean> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flushRef = useRef<() => Promise<boolean>>(() => Promise.resolve(true));

  const replace = useCallback((next:ReviewDocument) => {
    clearTimeout(timer.current);
    draft.current = next; revision.current = next.revision;
    sequence.current = 0; savedSequence.current = 0; blocked.current = null;
    setDocument(next); setDirty(false); setError(null);
    client.setQueryData(REVIEWS_KEY, next);
  }, [client]);

  useEffect(() => {
    // Refresh idle tabs without replacing unsaved edits or an in-flight save.
    if (query.data && !activeSave.current && savedSequence.current === sequence.current &&
        (!draft.current || query.data.revision > revision.current)) replace(query.data);
  }, [query.data, replace, dirty, saving]);

  const flush = useCallback(():Promise<boolean> => {
    clearTimeout(timer.current);
    if (activeSave.current) return activeSave.current;
    if (blocked.current) return Promise.resolve(false);
    if (!draft.current || savedSequence.current >= sequence.current) return Promise.resolve(true);
    setSaving(true);
    const pending = (async () => {
      try {
        // Only one PUT at a time. A response advances the revision, never overwrites newer edits.
        while (draft.current && savedSequence.current < sequence.current) {
          const sentSequence = sequence.current;
          const snapshot = {...draft.current, revision:revision.current};
          const saved = await mutation.mutateAsync(snapshot);
          revision.current = saved.revision;
          savedSequence.current = sentSequence;
          const next = sequence.current === sentSequence ? saved : {...draft.current!, revision:saved.revision};
          draft.current = next; setDocument(next);
          client.setQueryData(REVIEWS_KEY, saved);
          setDirty(savedSequence.current < sequence.current);
        }
        return true;
      } catch (reason) {
        const problem = reason instanceof Error ? reason : new Error('Kayıt tamamlanamadı.');
        blocked.current = problem; setError(problem); setDirty(true);
        return false;
      } finally {
        activeSave.current = null; setSaving(false);
      }
    })();
    activeSave.current = pending;
    return pending;
  }, [mutation.mutateAsync, client]);
  flushRef.current = flush;

  const edit = useCallback((change:(current:ReviewDocument) => ReviewDocument) => {
    if (!draft.current) return;
    const next = {...change(draft.current), updatedAt:new Date().toISOString()};
    draft.current = next; sequence.current += 1;
    setDocument(next); setDirty(true);
    clearTimeout(timer.current);
    if (!blocked.current) timer.current = setTimeout(() => { void flushRef.current(); }, 600);
  }, []);

  const retry = useCallback(() => {
    blocked.current = null; setError(null);
    return flushRef.current();
  }, []);

  const reload = useCallback(async () => {
    // Called only after the explicit discard confirmation. Failed reads keep the draft.
    const fresh = await jsonRequest<ReviewDocument>('/api/reviews');
    replace(fresh);
  }, [replace]);

  useEffect(() => {
    const warn = (event:BeforeUnloadEvent) => {
      if (activeSave.current || savedSequence.current < sequence.current) {
        event.preventDefault(); event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => { window.removeEventListener('beforeunload', warn); clearTimeout(timer.current); };
  }, []);

  return {document, query, saving, dirty, error, edit, flush, retry, replace, reload};
}

const rootRoute = createRootRoute({component:() => <Outlet/>});
const deskRoute = createRoute({
  getParentRoute:() => rootRoute,
  path:'/',
  validateSearch:(raw:Record<string, unknown>):DeskSearch => ({
    tab:raw.tab === 'effect' ? 'effect' : 'music',
    provider:typeof raw.provider === 'string' ? raw.provider : '',
    q:typeof raw.q === 'string' ? raw.q : '',
    status:statuses.includes(raw.status as ReviewStatus) ? raw.status as ReviewStatus : 'all',
    id:typeof raw.id === 'string' ? raw.id : typeof raw.id === 'number' && Number.isSafeInteger(raw.id) ? String(raw.id) : '',
    context:contexts.includes(raw.context as Context) ? raw.context as Context : undefined,
  }),
  component:SoundStudio,
});
export const router = createRouter({routeTree:rootRoute.addChildren([deskRoute])});
declare module '@tanstack/react-router' { interface Register {router:typeof router} }

function timeLabel(value:number) {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  return `${Math.floor(safe / 60)}:${Math.floor(safe % 60).toString().padStart(2, '0')}`;
}

function StatusMark({status}:{status:ReviewStatus}) {
  if (status === 'shortlist') return <Bookmark size={14} fill="currentColor"/>;
  if (status === 'rejected') return <X size={15}/>;
  return <Circle size={11}/>;
}

type PlayRequest = {id:string; nonce:number};

function SoundStudio() {
  const search = deskRoute.useSearch();
  const navigate = deskRoute.useNavigate();
  const catalogue = useQuery({queryKey:['sound-catalogue'], queryFn:() => jsonRequest<Catalogue>('/api/catalogue')});
  const reviews = useReviews();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [playRequest, setPlayRequest] = useState<PlayRequest | null>(null);
  const [operation, setOperation] = useState('');
  const [operationError, setOperationError] = useState('');
  const [importEpoch, setImportEpoch] = useState(0);
  const upload = useRef<HTMLInputElement>(null);
  const importMutation = useMutation({mutationFn:(value:unknown) => jsonRequest<ReviewDocument>('/api/import', {method:'POST', body:JSON.stringify(value)})});
  const assets = catalogue.data?.assets ?? [];
  const document = reviews.document;
  const kindAssets = useMemo(() => assets.filter(asset => asset.kind === search.tab), [assets, search.tab]);
  const effectContext = search.context ?? kindAssets.find(asset => asset.id === search.id)?.contexts[0] ?? 'press';
  const contextAssets = useMemo(() => search.tab === 'effect' ? kindAssets.filter(asset => asset.contexts.includes(effectContext)) : kindAssets, [kindAssets, search.tab, effectContext]);
  const filtered = useMemo(() => contextAssets.filter(asset =>
    (!search.provider || asset.provider === search.provider) &&
    (search.tab === 'effect' || search.status === 'all' || (document?.reviews[asset.id]?.status ?? 'unreviewed') === search.status)
  ), [contextAssets, search.provider, search.status, search.tab, document]);
  const selected = contextAssets.find(asset => asset.id === search.id) ?? filtered[0] ?? contextAssets[0];
  const providers = useMemo(() => [...new Set(contextAssets.map(asset => asset.provider))].sort((a,b) => a.localeCompare(b, 'tr')), [contextAssets]);

  useEffect(() => { window.document.title = 'Ses Masası · film-lab'; window.document.documentElement.lang = 'tr'; }, []);

  const changeSearch = useCallback((patch:Partial<DeskSearch>) => {
    void navigate({search:previous => ({...previous, ...patch}), replace:true, resetScroll:false});
  }, [navigate]);
  useEffect(() => {
    if (selected && !contextAssets.some(asset => asset.id === search.id)) changeSearch({id:selected.id});
  }, [selected?.id, contextAssets, search.id, changeSearch]);
  const select = useCallback((asset:Asset, play=false) => {
    changeSearch({id:asset.id});
    setPlayRequest(play ? {id:asset.id, nonce:Date.now()} : null);
  }, [changeSearch]);

  const columns = useMemo<ColumnDef<Asset>[]>(() => [
    {id:'title', accessorKey:'title', header:'Ses', cell:({row}) => <>
      <button className="row-play" aria-label={`${row.original.title} dinle`} onClick={event => {event.stopPropagation(); select(row.original, true);}}><Play size={12} fill="currentColor"/></button>
      <button className="asset-title-button" aria-current={selected?.id === row.original.id ? 'true' : undefined} onClick={() => select(row.original)}>
        <span className="asset-title">{row.original.title}</span>
        <span className="asset-subtitle">{row.original.provider}<span> · </span>{row.original.format}{row.original.ai && <span className="asset-ai"> · AI</span>}</span>
      </button>
    </>},
    {id:'duration', accessorKey:'duration', header:'Süre', cell:({getValue}) => <span className="timecode">{timeLabel(getValue<number>())}</span>},
    {id:'status', accessorFn:asset => search.tab === 'effect' ? rankedEffects(document?.contextChoices[effectContext]).includes(asset.id) ? 'shortlist' : 'unreviewed' : document?.reviews[asset.id]?.status ?? 'unreviewed', header:() => <span className="sr-only">Durum</span>, enableSorting:false, cell:({getValue}) => <span className={`row-status status-${getValue<string>()}`} title={statusLabels[getValue<ReviewStatus>()]}><StatusMark status={getValue<ReviewStatus>()}/></span>},
  ], [document?.reviews, document?.contextChoices, effectContext, search.tab, select, selected?.id]);

  const table = useReactTable({
    data:filtered, columns, state:{sorting, globalFilter:search.q}, onSortingChange:setSorting,
    getCoreRowModel:getCoreRowModel(), getFilteredRowModel:getFilteredRowModel(), getSortedRowModel:getSortedRowModel(),
    globalFilterFn:(row, _column, filter) => `${row.original.title} ${row.original.provider} ${row.original.id} ${row.original.format}`.toLocaleLowerCase('tr').includes(String(filter).toLocaleLowerCase('tr')),
  });

  function updateReview(id:string, change:(review:Review) => Review) {
    reviews.edit(current => {
      const previous = current.reviews[id] ?? emptyReview(current.listener);
      const changed = change(previous);
      return {...current, reviews:{...current.reviews, [id]:{...changed, updatedAt:new Date().toISOString()}}};
    });
  }

  function toggleRankedEffect(context:Context, asset:Asset) {
    reviews.edit(current => {
      const choice = current.contextChoices[context];
      const ids = rankedEffects(choice);
      if (!ids.includes(asset.id) && ids.length === 5) return current;
      const next = ids.includes(asset.id) ? ids.filter(id => id !== asset.id) : [...ids, asset.id];
      const contextChoices = {...current.contextChoices};
      if (!next.length) delete contextChoices[context];
      else {
        const primary = assets.find(item => item.id === next[0])!;
        contextChoices[context] = {effect:primary.id, alternatives:next.slice(1), listener:choice?.listener ?? current.listener, reason:choice?.reason ?? '', source:{provider:primary.provider, sourceUrl:primary.sourceUrl, licenseUrl:primary.licenseUrl, licenseName:primary.licenseName, ai:primary.ai}};
      }
      return {...current, contextChoices};
    });
  }

  async function exportSaved(format:'json' | 'md') {
    if (operation) return;
    setOperation('Dışa aktarılıyor'); setOperationError('');
    try {
      if (!await reviews.flush()) throw new Error('Dışa aktarmadan önce kayıt sorununu çöz. Taslağın burada duruyor.');
      const response = await fetch(`/api/export?format=${format}`);
      if (!response.ok) throw new Error(`Dışa aktarma tamamlanamadı (HTTP ${response.status}).`);
      downloadBlob(await response.blob(), `ses-masasi.${format}`);
    } catch (reason) { setOperationError(reason instanceof Error ? reason.message : 'Dışa aktarma tamamlanamadı.'); }
    finally { setOperation(''); }
  }

  async function importFile(event:ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file || operation) return;
    setOperation('İçe aktarılıyor'); setOperationError('');
    try {
      const value:unknown = JSON.parse(await file.text());
      if (!await reviews.flush()) throw new Error('İçe aktarmadan önce kayıt sorununu çöz. Mevcut notların değiştirilmedi.');
      const next = await importMutation.mutateAsync(value);
      reviews.replace(next); setImportEpoch(value => value + 1);
    } catch (reason) { setOperationError(reason instanceof Error ? reason.message : 'Dosya içe aktarılamadı.'); }
    finally { setOperation(''); }
  }

  async function reloadSaved() {
    if (!window.confirm('Kaydedilmemiş yerel değişiklikleri bırakıp diskteki kaydı yüklemek istiyor musun? Önce “Yerel taslağı indir” ile kopyanı saklayabilirsin.')) return;
    setOperation('Diskteki kayıt yükleniyor'); setOperationError('');
    try { await reviews.reload(); setImportEpoch(value => value + 1); }
    catch (reason) { setOperationError(reason instanceof Error ? reason.message : 'Diskteki kayıt okunamadı.'); }
    finally { setOperation(''); }
  }

  const error = catalogue.error ?? reviews.query.error;
  const ready = catalogue.data && document;
  const savedLabel = reviews.error ? 'Kayıt bekliyor' : reviews.saving ? 'Kaydediliyor' : reviews.dirty ? 'Değişiklik var' : document ? 'Diske kaydedildi' : 'Notlar yükleniyor';
  const totalShortlist = contextAssets.filter(asset => document?.reviews[asset.id]?.status === 'shortlist').length;
  const totalUnreviewed = contextAssets.filter(asset => !document?.reviews[asset.id] || document.reviews[asset.id].status === 'unreviewed').length;

  return <Tabs.Root className="studio-shell" value={search.tab} orientation="vertical" onValueChange={tab => {setPlayRequest(null); changeSearch({tab:tab as Kind, id:'', provider:'', status:'all', q:''});}}>
    <aside className="rail">
      <div className="brand-mark" aria-label="Film-lab ses masası"><AudioLines size={27} strokeWidth={1.6}/><span>ses.</span></div>
      <Tabs.List className="rail-tabs" aria-label="Ses türü">
        <Tabs.Trigger className="rail-tab" value="music"><Music2 size={21}/><span>Müzik</span><small>{assets.filter(asset => asset.kind === 'music').length || '—'}</small></Tabs.Trigger>
        <Tabs.Trigger className="rail-tab" value="effect"><AudioLines size={22}/><span>Efekt</span><small>{assets.filter(asset => asset.kind === 'effect').length || '—'}</small></Tabs.Trigger>
      </Tabs.List>
      <div className="rail-bottom"><Headphones size={18}/><span>film-lab<br/>dinleme masası</span></div>
    </aside>
    <main className="main-shell">
      <header className="topbar">
        <div className="topbar-title"><span className="eyebrow">FİLM-LAB / SES ARŞİVİ</span><strong>Dinle, yan yana düşün.</strong></div>
        <div className="topbar-actions">
          <span className={`save-status ${reviews.error ? 'is-error' : reviews.saving ? 'is-saving' : reviews.dirty ? 'is-dirty' : ''}`} role="status" aria-live="polite" title={document ? `Kayıt sürümü ${document.revision}` : undefined}>{reviews.error ? <CircleAlert size={14}/> : reviews.saving ? <LoaderCircle size={14} className="spinning"/> : reviews.dirty ? <Circle size={9} fill="currentColor"/> : <Check size={14}/>}<span>{operation || savedLabel}</span></span>
          <label className="listener-field"><span>Dinleyen</span><input aria-label="Dinleyenin adı" placeholder="Adın" value={document?.listener ?? ''} disabled={!ready || !!operation} onChange={event => reviews.edit(current => ({...current, listener:event.target.value}))}/></label>
          <button className="btn btn-quiet import-button" disabled={!ready || !!operation} onClick={() => upload.current?.click()}><Upload size={15}/><span>İçe aktar</span></button>
          <button className="btn btn-quiet" disabled={!ready || !!operation} onClick={() => void exportSaved('json')} title="Kaydedilmiş notları JSON indir"><ArrowDownToLine size={15}/><span>JSON</span></button>
          <button className="btn btn-quiet" disabled={!ready || !!operation} onClick={() => void exportSaved('md')} title="Kaydedilmiş notları Markdown indir"><span>MD</span></button>
          <input className="file-input" ref={upload} type="file" accept="application/json,.json" onChange={event => void importFile(event)}/>
        </div>
      </header>

      {(reviews.error || operationError) && <div className="notice notice-error" role="alert"><CircleAlert size={18}/><div><strong>{reviews.error ? 'Notların bu pencerede güvende.' : 'İşlem tamamlanamadı.'}</strong><p>{operationError || reviews.error?.message}</p>{reviews.error && <div className="notice-actions">
        <button className="btn" disabled={reviews.saving || !!operation} onClick={() => void reviews.retry()}><RotateCcw size={13}/> Yeniden dene</button>
        <button className="btn" onClick={() => document && downloadBlob(new Blob([JSON.stringify(document, null, 2)], {type:'application/json'}), 'ses-masasi-yerel-taslak.json')}>Yerel taslağı indir</button>
        {reviews.error instanceof ApiError && reviews.error.status === 409 && <button className="btn" disabled={!!operation} onClick={() => void reloadSaved()}>Diskteki kaydı yükle</button>}
      </div>}</div><button className="icon-button" aria-label="İşlem bildirimini kapat" disabled={!!reviews.error} onClick={() => setOperationError('')}><X size={16}/></button></div>}

      {!ready ? <div className={`screen-state ${error ? 'error-state' : ''}`} role={error ? 'alert' : 'status'}>
        {error ? <><CircleAlert size={28}/><h1>Dinleme masası açılamadı.</h1><p>{error.message}</p><button className="btn btn-primary" onClick={() => {void catalogue.refetch(); void reviews.query.refetch();}}><RotateCcw size={15}/> Yeniden dene</button></> : <><AudioLines size={32}/><div className="loading-line"/><p>Sesler ve notların hazırlanıyor…</p></>}
      </div> : search.tab === 'effect' ? <Tabs.Content value="effect" className="effect-board">
        <div className="effect-board-heading"><h1>Duruma göre ses seç.</h1><p>{contexts.length} farklı durum. Dinle, sonra en sevdiklerini sırayla seç: 1, 2, 3, 4, 5.</p></div>
        <nav className="scenario-nav" aria-label="Duruma git">{contexts.map(context => <a key={context} href={`#scene-${context}`}>{contextLabels[context]}</a>)}</nav>
        <div className="effect-scenarios">{contexts.map(context => {
          const candidates = kindAssets.filter(asset => asset.contexts.includes(context));
          const audition = context === effectContext ? selected : undefined;
          const ranked = rankedEffects(document.contextChoices[context]);
          return <section className="effect-scenario" id={`scene-${context}`} key={context} aria-labelledby={`scenario-${context}`}>
            <header className="scenario-heading"><h2 id={`scenario-${context}`}>{contextDefinitions[context].title}</h2><span>{candidates.length} ses seçeneği</span></header>
            <div className="scenario-stage">{audition ? <><AudioPlayer asset={audition} request={playRequest} context={context}/><p className="audition-label">Dinlenen: {audition.title}</p></> : <><EffectMotion context={context}/><p className="audition-label">Aşağıdaki seslerden birini dinle.</p></>}</div>
            <div className="scenario-candidates" role="group" aria-label={`${contextLabels[context]} için dinleme seçenekleri`}>{candidates.map(asset => {
              const rank = ranked.indexOf(asset.id) + 1;
              return <div key={asset.id} className="scenario-candidate" data-ranked={rank > 0}>
                <button className="candidate-audition" aria-pressed={audition?.id === asset.id} aria-label={`${contextLabels[context]}: ${asset.title} dinle`} onClick={() => {changeSearch({context,id:asset.id,q:'',provider:'',status:'all'}); setPlayRequest({id:asset.id,nonce:Date.now()});}}><Play size={13} fill="currentColor"/><span>{asset.title}<small>{asset.provider}{asset.ai ? ' · AI' : ''}</small></span></button>
                <button className="candidate-rank" aria-pressed={rank > 0} aria-label={`${asset.title}: ${rank ? `${rank}. sıradan çıkar` : `${ranked.length + 1}. sıraya ekle`}`} disabled={!!operation || (!rank && ranked.length === 5)} onClick={() => toggleRankedEffect(context, asset)}>{rank || 'Seç'}</button>
              </div>;
            })}</div>
            <fieldset className="review-controls scenario-decision" disabled={!!operation}>
            <EffectContexts assets={assets} document={document} context={context} onRemove={asset => toggleRankedEffect(context, asset)} onChange={(context, choice) => reviews.edit(current => {const contextChoices = {...current.contextChoices}; if (choice) contextChoices[context] = choice; else delete contextChoices[context]; return {...current, contextChoices};})}/>
            {audition && document.reviews[audition.id] && <details className="effect-extra-notes"><summary>Bu ses için önceki ek notlar</summary><ReviewEditor key={`${audition.id}:${importEpoch}`} asset={audition} review={document.reviews[audition.id]} onChange={change => updateReview(audition.id, change)}/></details>}
            </fieldset>
          </section>;
        })}</div>
      </Tabs.Content> : <Tabs.Content value={search.tab} className="desk">
        <section className="library" aria-label="Ses kütüphanesi">
          <div className="library-heading"><div><span className="eyebrow">{search.tab === 'music' ? 'KÜTÜPHANE' : 'BU DURUM İÇİN ADAYLAR'}</span><h2>{search.tab === 'music' ? 'Müzik' : contextLabels[effectContext]}<span className="library-count">{contextAssets.length.toString().padStart(2, '0')}</span></h2></div><Disc3 size={30} strokeWidth={1}/></div>
          <div className="library-filters">
            <label className="search-field"><Search size={16}/><input aria-label="Kütüphanede ara" placeholder="Bir ses, kaynak ya da isim ara…" value={search.q} onChange={event => changeSearch({q:event.target.value})}/>{search.q && <button className="icon-button" aria-label="Aramayı temizle" onClick={() => changeSearch({q:''})}><X size={14}/></button>}</label>
            <label className="provider-select"><SlidersHorizontal size={14}/><select aria-label="Kaynağa göre filtrele" value={search.provider} onChange={event => changeSearch({provider:event.target.value})}><option value="">Tüm kaynaklar</option>{providers.map(provider => <option key={provider} value={provider}>{provider}</option>)}</select><ChevronDown size={13}/></label>
            {search.tab === 'music' && <div className="status-filters" aria-label="İnceleme durumuna göre filtrele">{([{value:'all', label:'Tümü', count:contextAssets.length}, {value:'shortlist', label:'Seçki', count:totalShortlist}, {value:'unreviewed', label:'Bekleyen', count:totalUnreviewed}, {value:'rejected', label:'Elenen', count:contextAssets.filter(asset => document.reviews[asset.id]?.status === 'rejected').length}] as const).map(filter => <button key={filter.value} className="filter-pill" aria-pressed={search.status === filter.value} onClick={() => changeSearch({status:filter.value})}>{filter.label}<span>{filter.count}</span></button>)}</div>}
          </div>
          <div className="library-scroll"><table className="asset-table"><thead>{table.getHeaderGroups().map(group => <tr key={group.id}>{group.headers.map(header => <th key={header.id} scope="col" aria-sort={header.column.getIsSorted() === 'asc' ? 'ascending' : header.column.getIsSorted() === 'desc' ? 'descending' : undefined}>{header.column.getCanSort() ? <button onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header, header.getContext())}{header.column.getIsSorted() === 'asc' ? <ArrowUp size={10}/> : header.column.getIsSorted() === 'desc' ? <ArrowDown size={10}/> : null}</button> : flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map(row => <tr key={row.id} className={`asset-row ${selected?.id === row.original.id ? 'is-selected' : ''}`} onDoubleClick={() => select(row.original, true)}>{row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table>
            {!table.getRowModel().rows.length && <div className="empty-library"><Search size={23}/><strong>Bu filtrede ses yok.</strong><p>Aramayı kısaltabilir ya da tüm kaynaklara dönebilirsin.</p><button className="btn" onClick={() => changeSearch({q:'', provider:'', status:'all'})}>Filtreleri temizle</button></div>}
          </div>
          <footer className="library-footer"><span>{table.getRowModel().rows.length} / {contextAssets.length} ses</span><span><Play size={10}/> Çift tıkla, dinle</span></footer>
        </section>

        <section className="workspace" aria-label="Seçili ses ve dinleme notları">
          {selected ? <>
            <div className="track-heading"><div className="track-kicker"><span className="eyebrow">{search.tab === 'music' ? 'ŞİMDİ DİNLENEN' : 'HAREKETİN SESİ'}</span><span>{String(contextAssets.indexOf(selected) + 1).padStart(2, '0')} / {contextAssets.length}</span></div><h1 className="track-title">{selected.title}</h1><div className="track-meta"><span>{selected.provider}</span><span className="meta-dot">·</span><span>{selected.format.toUpperCase()}</span>{selected.ai && <span className="badge">AI</span>}{selected.sourceUrl && <a className="source-link" href={selected.sourceUrl} target="_blank" rel="noreferrer">Kaynak <ExternalLink size={11}/></a>}{selected.licenseUrl && <a className="source-link" href={selected.licenseUrl} target="_blank" rel="noreferrer">{selected.licenseName || 'Lisans'} <ExternalLink size={11}/></a>}</div></div>
            <AudioPlayer asset={selected} request={playRequest} context={effectContext}/>
            <fieldset className="review-controls" disabled={!!operation}>
              <div className="status-control" role="group" aria-label="Bu sesin inceleme durumu">{statuses.map(status => <button type="button" key={status} className={`status-button status-${status}`} aria-pressed={(document.reviews[selected.id]?.status ?? 'unreviewed') === status} onClick={() => updateReview(selected.id, review => ({...review, status}))}><StatusMark status={status}/>{statusLabels[status]}</button>)}</div>
              <ReviewEditor key={`${selected.id}:${importEpoch}`} asset={selected} review={document.reviews[selected.id] ?? emptyReview(document.listener)} onChange={change => updateReview(selected.id, change)}/>
            </fieldset>
            <footer className="workspace-footer"><span>{selected.id}</span><span>Yalnız dinlediğin kadarını doldur.</span></footer>
          </> : <div className="workspace-empty"><Headphones size={34}/><h1>İlk sesi seç.</h1><p>Dinleme notların, seçimlerin ve kaynaklar burada bir arada duracak.</p></div>}
        </section>
      </Tabs.Content>}
    </main>
  </Tabs.Root>;
}

function AudioPlayer({asset, request, context}:{asset:Asset; request:PlayRequest | null; context:Context}) {
  const audio = useRef<HTMLAudioElement>(null);
  useEffect(() => {const element = audio.current; return () => element?.pause();}, []);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(asset.duration);
  const [volume, setVolume] = useState(.8);
  const [error, setError] = useState('');
  const peaks = useMemo(() => {
    const values = asset.waveform.filter(Number.isFinite).map(Math.abs);
    const count = Math.min(180, values.length);
    const scale = Math.max(...values, .001);
    return Array.from({length:count}, (_, index) => {
      const slice = values.slice(Math.floor(index * values.length / count), Math.max(Math.floor((index + 1) * values.length / count), Math.floor(index * values.length / count) + 1));
      return Math.max(...slice, 0) / scale;
    });
  }, [asset.waveform]);
  const play = useCallback(() => {
    if (!audio.current) return;
    setError('');
    void audio.current.play().catch(reason => setError(`Ses başlatılamadı. ${reason instanceof Error ? reason.message : 'Tekrar dene.'}`));
  }, []);
  const toggle = useCallback(() => {if (audio.current?.paused) play(); else audio.current?.pause();}, [play]);
  useEffect(() => {
    audio.current?.pause(); setPlaying(false); setStarted(false); setPosition(0); setDuration(asset.duration); setError('');
    audio.current?.load();
  }, [asset.id, asset.audioUrl, asset.duration, asset.kind === 'effect' ? context : undefined]);
  useEffect(() => {
    if (request?.id !== asset.id || !audio.current) return;
    audio.current.pause(); audio.current.currentTime = 0;
    setPosition(0); setStarted(false); play();
  }, [request?.nonce, asset.id, play]);
  useEffect(() => {if (audio.current) audio.current.volume = volume;}, [volume]);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {if (audio.current) setPosition(audio.current.currentTime); frame = requestAnimationFrame(tick);};
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  useEffect(() => {
    const hotkey = (event:KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.code !== 'Space' || event.repeat || target?.closest('input, textarea, select, button, a, [contenteditable="true"], [role="slider"], [role="checkbox"]')) return;
      event.preventDefault(); toggle();
    };
    window.addEventListener('keydown', hotkey);
    return () => window.removeEventListener('keydown', hotkey);
  }, [toggle]);
  function seek(value:number) {if (audio.current && Number.isFinite(value)) {audio.current.currentTime = value; setPosition(value); setStarted(true);}}
  const length = Number.isFinite(duration) && duration > 0 ? duration : asset.duration;
  const progress = length > 0 ? Math.min(1, position / length) : 0;
  const elapsed = position - (asset.anchor ?? 0);
  const hit = started && elapsed >= 0 && elapsed < .14;
  const completed = started && elapsed >= 0;
  const motionProgress = started ? Math.min(1, Math.max(0, elapsed) / Math.max(.08, Math.min(.8, length - (asset.anchor ?? 0)))) : 0;

  if (!asset.audioUrl) return <div className="player"><p>Bu sesin ham dosyası repoda paylaşılmıyor. Notları ve seçimleri burada inceleyebilirsin.</p>{asset.sourceUrl && <a className="btn" href={asset.sourceUrl} target="_blank" rel="noreferrer">Kaynağında dinle <ExternalLink size={14}/></a>}{asset.kind === 'effect' && <EffectMotion context={context}/>}</div>;

  return <div className="player">
    {asset.audioMode === 'provider' && <p className="player-hint">Ses, sağlayıcının adresinden açılır; internet gerekir.</p>}
    {asset.credit && <p className="player-hint">{asset.credit}</p>}
    {asset.sourceNote && <p className="player-hint">{asset.sourceNote}</p>}
    <audio ref={audio} src={asset.audioUrl} preload="metadata" onLoadedMetadata={() => setDuration(audio.current?.duration || asset.duration)} onPlay={() => {setPlaying(true); setStarted(true);}} onPause={() => setPlaying(false)} onEnded={() => {setPlaying(false); setPosition(audio.current?.currentTime ?? 0);}} onTimeUpdate={() => {if (audio.current) setPosition(audio.current.currentTime);}} onError={() => setError('Ses dosyası okunamadı. Kaynak dosyayı ve sunucu bağlantısını kontrol et.')}/>
    <div className="player-transport"><button className="play-button" onClick={toggle} aria-label={playing ? 'Duraklat' : 'Dinle'}>{playing ? <Pause size={23} fill="currentColor"/> : <Play size={23} fill="currentColor"/>}</button><div className="waveform">
      {peaks.length ? <svg className="wave-bars" viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true">{peaks.map((peak, index) => <rect key={index} x={index * 1000 / peaks.length} y={60 - Math.max(1, peak * 52)} width={Math.max(1, 1000 / peaks.length - 2.2)} height={Math.max(2, peak * 104)} rx="1" fill={(index + .5) / peaks.length <= progress ? 'var(--rust)' : 'var(--wave-ink, #b1aca0)'}/>)}<line className="wave-playhead" x1={progress * 1000} x2={progress * 1000} y1="4" y2="116"/></svg> : <div className="wave-empty">Dalga biçimi yok. Zaman çubuğuyla sarabilirsin.</div>}
      <input className="seek-input" type="range" min={0} max={length || 1} step="0.01" value={Math.min(position, length || 1)} disabled={!length} onChange={event => seek(Number(event.target.value))} aria-label="Ses içinde konum" aria-valuetext={`${timeLabel(position)} / ${timeLabel(length)}`}/>
    </div></div>
    <div className="player-bottom"><span className="timecode"><strong>{timeLabel(position)}</strong><span> / {timeLabel(length)}</span></span><span className="player-hint">Dalga biçimine tıkla · <kbd>boşluk</kbd> dinle / durdur</span><div className="volume"><button className="icon-button" aria-label={volume ? 'Sesi kapat' : 'Sesi aç'} onClick={() => setVolume(volume ? 0 : .8)}>{volume ? <Volume2 size={16}/> : <VolumeX size={16}/>}</button><Slider.Root className="slider-root" value={[volume * 100]} min={0} max={100} step={1} onValueChange={values => setVolume(values[0] / 100)}><Slider.Track className="slider-track"><Slider.Range className="slider-range"/></Slider.Track><Slider.Thumb className="slider-thumb" aria-label="Ses seviyesi"/></Slider.Root></div></div>
    {asset.kind === 'effect' && <div className="context-preview"><div className="preview-label"><span>{contextLabels[context]} önizlemesi</span><button className="btn btn-quiet" onClick={() => {seek(0); play();}}><RotateCcw size={12}/> Birlikte dinle</button></div><EffectMotion key={`${asset.id}:${request?.nonce ?? 0}`} context={context} hit={hit} completed={completed} progress={motionProgress}/></div>}
    {error && <p className="audio-error" role="alert"><CircleAlert size={14}/>{error}<button className="btn btn-quiet" onClick={() => {audio.current?.load(); play();}}>Tekrar dene</button></p>}
  </div>;
}

function ReviewEditor({asset, review, onChange}:{asset:Asset; review:Review; onChange:(change:(review:Review) => Review) => void}) {
  const [avoidText, setAvoidText] = useState(review.avoid_with.join('\n'));
  const launchGroup = useRef<HTMLDetailsElement>(null);
  const questionGroups = useRef<Partial<Record<SelectionKey,HTMLDetailsElement | null>>>({});
  const aiSelected = review.aiSuggestion && review.selections.launch?.length === 5 && review.aiSuggestion.launch.every(option => review.selections.launch?.includes(option));
  useEffect(() => {
    setAvoidText(current => JSON.stringify(current.split('\n').map(line => line.trim()).filter(Boolean)) === JSON.stringify(review.avoid_with) ? current : review.avoid_with.join('\n'));
  }, [review.avoid_with]);
  function applySuggestions() {
    if (!aiSelected) onChange(current => ({...current, selections:{...current.selections, launch:[...current.aiSuggestion!.launch]}}));
    if (launchGroup.current) {
      launchGroup.current.open = true;
      launchGroup.current.scrollIntoView({block:'nearest'});
    }
  }
  function choice(key:SelectionKey, value:string, checked:boolean) {
    onChange(current => {const values = current.selections[key] ?? []; return {...current, selections:{...current.selections, [key]:checked ? [...new Set([...values, value])] : values.filter(item => item !== value)}};});
  }
  function applyAllSuggestions() {
    onChange(current => {
      const selections = {...current.selections, launch:[...current.aiSuggestion!.launch]};
      for (const key of ['feeling','start','change','end'] as const) {
        const values = current.aiSuggestion?.answers?.[key].choices;
        if (values?.length) selections[key] = [...values];
      }
      return {...current, selections};
    });
    Object.values(questionGroups.current).forEach(group => {if (group) group.open = true;});
    questionGroups.current.feeling?.scrollIntoView({block:'nearest'});
  }
  return <div className="review-grid">
    <div className="review-main">{review.aiSuggestion && <section className="ai-suggestion" aria-label="AI kullanım önerileri">
      <h2>{review.aiSuggestion.answers ? 'AI dinleme önerileri' : 'AI’ın önerdiği 5 kullanım'}</h2><p>{review.aiSuggestion.answers ? 'Her sorunun altında öneri ve kısa gerekçesi var. İşaretlerini değiştirmek için uygula; kişisel notların ve dinleyen adı korunur.' : 'İlk seçim önerisi. Dinleyip aşağıdaki işaretleri değiştirebilirsin; mevcut notların korunur.'}</p>
      <ol>{review.aiSuggestion.launch.map(option => <li key={option}>{option}</li>)}</ol>
      <button className="btn" type="button" onClick={applySuggestions}>{aiSelected ? 'Bu beşli seçili · seçimleri göster' : 'Kullanım seçimlerini bu beşliyle değiştir'}</button>
      {review.aiSuggestion.answers && <button className="btn ai-all" type="button" onClick={applyAllSuggestions}>Beş sorunun seçimlerini AI önerileriyle değiştir</button>}
      {review.aiSuggestion.caveat && <p>{review.aiSuggestion.caveat}</p>}
      <details><summary>Nasıl seçildi?</summary><p>{review.aiSuggestion.method}</p><small>{review.aiSuggestion.model}</small></details>
    </section>}<div className="section-heading"><h2>Dinleme notları</h2><span>Her soruda birden fazla seçim</span></div>{questions.map((question, index) => {
      const picked = review.selections[question.key] ?? [];
      const options = [...question.options, ...picked.filter(value => !question.options.includes(value))];
      const answer = question.key === 'launch' ? undefined : review.aiSuggestion?.answers?.[question.key];
      const applied = answer && answer.choices.length === picked.length && answer.choices.every(value => picked.includes(value));
      return <details key={question.key} ref={node => {questionGroups.current[question.key] = node; if (question.key === 'launch') launchGroup.current = node;}} className="question-group" open={index === 0 ? true : undefined}><summary><span className="question-title"><small>0{index + 1}</small>{question.label}</span><span className="question-count">{picked.length ? picked.length : '—'}<ChevronDown size={14}/></span>{picked.length > 0 && <span className="question-answer">{picked.join(' · ')}</span>}</summary>
        {answer && <div className="ai-answer"><strong>AI önerisi: {answer.choices.join(' · ') || 'Emin değil'}</strong><p>{answer.reason}</p><button className="btn" type="button" disabled={!answer.choices.length || applied} aria-label={`${question.label} için AI önerisini uygula`} onClick={() => onChange(current => ({...current, selections:{...current.selections, [question.key]:[...answer.choices]}}))}>{applied && answer.choices.length ? 'Bu öneri seçili' : 'Bu soruya uygula'}</button></div>}
        <div className="choices" role="group" aria-label={question.label}>{options.map(option => <label key={option} className="choice" data-checked={picked.includes(option)}><Checkbox.Root className="checkbox-root" checked={picked.includes(option)} onCheckedChange={checked => choice(question.key, option, checked === true)} aria-label={option}><Checkbox.Indicator className="checkbox-indicator"><Check size={11}/></Checkbox.Indicator></Checkbox.Root><span>{option}</span></label>)}</div></details>;
    })}</div>
    <aside className="review-aside"><div className="section-heading"><h2>Kendi kelimelerinle</h2></div><label className="field-label">Notun<textarea className="text-field note-field" placeholder={asset.kind === 'music' ? 'Aklında kalan bir an, bir yükseliş, kullanmak istediğin bir sahne…' : 'Bu ses hangi hareketle buluşmalı? Neyi iyi yapıyor?'} value={review.notes} onChange={event => onChange(current => ({...current, notes:event.target.value}))}/></label><label className="field-label">Birlikte kullanma<textarea className="text-field avoid-field" placeholder="Her satıra bir durum ya da ses yaz." value={avoidText} onChange={event => {setAvoidText(event.target.value); const values = event.target.value.split('\n').map(value => value.trim()).filter(Boolean); onChange(current => ({...current, avoid_with:values}));}}/></label><span className="field-help">Örneğin bir sahne, anlatım biçimi ya da başka bir parça.</span><label className="field-label review-listener">Bu notu dinleyen<input className="text-field" placeholder="Dinleyenin adı" value={review.listener} onChange={event => onChange(current => ({...current, listener:event.target.value}))}/></label>
      {(review.aiSuggestion?.notes || review.aiSuggestion?.avoid_with?.length) && <section className="ai-answer" aria-label="AI serbest not önerileri"><strong>AI not önerisi</strong>{review.aiSuggestion.notes && <><p>{review.aiSuggestion.notes}</p><button className="btn" type="button" disabled={review.notes.includes(review.aiSuggestion.notes)} onClick={() => onChange(current => ({...current, notes:[current.notes, current.aiSuggestion!.notes].filter(Boolean).join('\n')}))}>Mevcut notuma ekle</button></>}{!!review.aiSuggestion.avoid_with?.length && <><p><strong>Birlikte kullanma önerisi</strong></p><ul>{review.aiSuggestion.avoid_with.map(value => <li key={value}>{value}</li>)}</ul><button className="btn" type="button" disabled={review.aiSuggestion.avoid_with.every(value => review.avoid_with.includes(value))} onClick={() => onChange(current => ({...current, avoid_with:[...new Set([...current.avoid_with, ...current.aiSuggestion!.avoid_with!])]}))}>Birlikte kullanma notlarıma ekle</button></>}</section>}
      {review.legacy && <details className="legacy-notes"><summary>Önceki notların <ChevronDown size={13}/></summary><div className="legacy-content"><p className="field-help">Eski kayıttan, olduğu gibi.</p><span className="legacy-label">His</span><p>{review.legacy.feeling || '—'}</p><span className="legacy-label">Gelişim</span><p>{review.legacy.progression || '—'}</p><span className="legacy-label">Birlikte kullanım</span><p>{review.legacy.use_with.join('\n') || '—'}</p></div></details>}
    </aside>
  </div>;
}

function EffectMotion({context, hit=false, completed=false, progress=0}:{context:Context; hit?:boolean; completed?:boolean; progress?:number}) {
  const p = progress;
  let content:ReactNode;
  switch (context) {
    case 'press': content=<><Check size={15}/> Onayla</>; break;
    case 'complete': content=completed ? <><Check size={18}/> Tamamlandı</> : <><LoaderCircle size={17}/> İşleniyor</>; break;
    case 'message': content=<><Circle size={8} fill="currentColor"/> Yeni bir mesajın var</>; break;
    case 'transition': content=<><span className="preview-window-dot"/> Ürün görünümü <span className="preview-window-line"/></>; break;
    case 'typing': content=<div className="scene-type">{'Merhaba dünya'.slice(0, Math.floor(p * 13))}<i/></div>; break;
    case 'hover': content=<div className="scene-hover"><span data-on={p > .8}>İncele</span><MousePointer2 className="scene-pointer" size={25} style={{transform:`translate(${45*(1-p)}px, ${38*(1-p)}px)`}}/></div>; break;
    case 'toggle': content=<div className="scene-setting"><span>Bildirimler</span><div className="scene-switch" data-on={p > .5}><i style={{transform:`translateX(${p*25}px)`}}/></div></div>; break;
    case 'error': content=<div className="scene-error" data-on={completed} style={{transform:`translateX(${completed ? Math.sin(p*Math.PI*6)*(1-p)*7 : 0}px)`}}><span>{completed ? 'Tekrar dene' : 'Bir işlem yap'}</span>{completed && <X size={19}/>}</div>; break;
    case 'send': content=<div className="scene-send"><span style={{transform:`translateY(${-p*14}px)`,opacity:1-p*.4}}>Merhaba!</span><Send size={23} style={{transform:`translate(${p*40}px, ${-p*30}px)`,opacity:1-p}}/>{p > .9 && <Check size={18}/>}</div>; break;
    case 'search': content=<div className="scene-search"><span><Search size={17}/> kahve</span><small style={{opacity:p,transform:`translateY(${(1-p)*10}px)`}}>3 sonuç bulundu</small></div>; break;
    case 'loading': content=<div className="scene-loading"><i style={{transform:`rotate(${p*360}deg)`}}/><span>{completed ? 'Yükleniyor…' : 'Başlat'}</span></div>; break;
    case 'progress': content=<ol className="scene-steps">{['Hazırla','İşle','Bitir'].map((step,i)=><li key={step} data-on={completed && p >= i/3}><span>{completed && p >= i/3 ? <Check size={13}/> : i+1}</span><small>{step}</small></li>)}</ol>; break;
    case 'reveal': content=<div className="scene-tile" style={{opacity:completed ? p : .15,transform:`translateY(${(1-p)*16}px) scale(${.8+p*.2})`}}><Image size={38}/></div>; break;
    case 'hide': content=<div className="scene-tile" style={{opacity:1-p,transform:`translateY(${-p*22}px) scale(${1-p*.15})`}}><Image size={38}/></div>; break;
    case 'move': content=<div className="scene-track"><i/><span style={{transform:`translateX(${p*145}px)`}}><ArrowRight size={22}/></span><i/></div>; break;
    case 'zoom': content=<div className="scene-zoom" style={{transform:`scale(${1+p*1.3})`}}><span/><div/><small>Detay</small></div>; break;
    case 'impact': content=<div className="scene-impact"><i style={{transform:`scale(${.5+p*1.5})`,opacity:completed ? 1-p : 0}}/><span style={{transform:`scale(${1+Math.sin(p*Math.PI)*.35})`}}>!</span></div>; break;
    case 'count': content=<span className="scene-counter">{Math.round(p*100).toString().padStart(3,'0')}</span>; break;
    case 'transform': content=<div className="scene-morph" style={{borderRadius:`${p*50}%`,transform:`rotate(${p*180}deg)`,background:p>.5?'var(--olive)':'var(--rust)'}}/>; break;
    case 'build': content=<div className="scene-build">{[0,1,2].map(i=><i key={i} style={{transform:`scale(${.35+p*(.65+i*.3)})`,opacity:.18+Math.max(0,p-i*.2)*.5}}/>)}<span style={{transform:`scale(${.7+p*.3})`}}/></div>; break;
  }
  return <div className={`preview-stage preview-${context} ${hit ? 'has-hit' : ''} ${completed ? 'has-completed' : ''}`}><div className="preview-object">{content}</div></div>;
}

function EffectContexts({assets, document, context, onChange, onRemove}:{assets:Asset[]; document:ReviewDocument; context:Context; onChange:(context:Context, choice:EffectChoice | undefined) => void; onRemove:(asset:Asset) => void}) {
  const choice = document.contextChoices[context];
  const ranked = rankedEffects(choice).map(id => assets.find(asset => asset.id === id)!);
  return <section className="context-section" aria-label={`${contextLabels[context]} için kararın`}>
    <div className="rank-heading"><strong>Tercih sıran</strong><span>{ranked.length} / 5</span></div>
    <p className="field-help">En sevdiğini önce seç. Çıkardığında kalanlar sırayla ilerler.{ranked.length === 5 && ' Yeni ses eklemek için birini çıkar.'}</p>
    {ranked.length > 0 && <ol className="ranked-effects">{ranked.map((asset, index) => <li key={asset.id}><span className="rank-number">{index + 1}</span><span>{asset.title}<small>{asset.provider}</small></span><button className="icon-button" aria-label={`${index + 1}. tercihi çıkar: ${asset.title}`} onClick={() => onRemove(asset)}><X size={14}/></button></li>)}</ol>}
    <div className="rank-actions"><button className="btn" aria-pressed={choice?.effect === null} onClick={() => onChange(context, {effect:null, listener:choice?.listener ?? document.listener, reason:choice?.reason ?? '', source:null})}>Sessiz kalsın</button>{choice && <button className="btn btn-quiet" onClick={() => onChange(context, undefined)}>Seçimi temizle</button>}</div>
    <div className="context-form"><label className="field-label">Neden?<textarea className="text-field" disabled={!choice} placeholder={choice ? 'Bu sesler ya da sessizlik neden bu duruma uyuyor?' : 'Önce bir ses ya da sessizlik seç.'} value={choice?.reason ?? ''} onChange={event => choice && onChange(context, {...choice, reason:event.target.value})}/></label><label className="field-label">Dinleyen<input className="text-field" disabled={!choice} placeholder="Adın" value={choice?.listener ?? ''} onChange={event => choice && onChange(context, {...choice, listener:event.target.value})}/></label></div>
    {choice && (!choice.reason.trim() || !choice.listener.trim()) && <p className="field-help">Seçimini tamamlamak için nedenini ve dinleyeni ekle.</p>}
  </section>;
}
