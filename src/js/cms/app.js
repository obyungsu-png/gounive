/* ===== CMS 화면 (고객센터 › CMS 관리) =====
   - 로그인: 비밀번호는 서버(api/cms.js)에서만 확인
   - 콘텐츠 편집: JSON 데이터(배너·공지·특례전형·자료실·기관·설정)를 항목 단위로 추가·수정·삭제·순서 변경
   - 화면(HTML) 편집: 각 화면 파일을 직접 고침
   - 게시하면 GitHub에 커밋되고 Vercel이 약 1분 뒤 사이트에 반영. 변경 이력에서 이전 버전으로 되돌릴 수 있음
   - 참조 사이트 업데이트: 버튼을 눌렀을 때만 확인, 반영/참고만/무시는 운영자가 결정 (자동 반영 없음) */
import '../../css/cms.css';
import { cms, session } from './api.js';
import { COLLECTIONS, PAGE_FILES, LINK_CHOICES } from './schemas.js';
import { escapeHtml, showToast } from '../ui.js';
import { bannerHtml } from '../banner.js';
import { syncRoute } from '../router.js';
import { formatJson } from './format.js';

const esc = v => escapeHtml(v === undefined || v === null ? '' : String(v));
const TABS = [['content', '콘텐츠 편집', 'fa-edit'], ['pages', '화면(HTML) 편집', 'fa-code'], ['updates', '참조 사이트 업데이트', 'fa-sync-alt']];
const RESULT_LABEL = { baseline: '처음 확인 (기준 저장)', same: '변화 없음', changed: '바뀜', error: '접속 실패' };
const STATUS_LABEL = { pending: '검토 대기', applied: '반영함', referenced: '참고만', ignored: '무시' };

const st = {
  features: null, tab: 0,
  files: {},                       // path → { data, sha, dirty }
  coll: COLLECTIONS[0].id, editing: null, filter: '',
  pages: {},                       // path → { content, sha, dirty }
  pagePath: PAGE_FILES[0][0],
  upd: { list: [], sources: [], view: 'pending', checking: false, run: null, ai: {} }
};
let started = false;
const $ = id => document.getElementById(id);
const app = () => $('cmsApp');

/* ---------------- 진입 · 로그인 ---------------- */
export function enterCms(tab) {
  if (!started) start();
  st.tab = tab || 0;
  if (session.get()) showApp(); else showLogin();
}

function start() {
  started = true;
  $('cmsLoginBtn').addEventListener('click', login);
  $('cmsPassword').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
  $('cmsLogoutBtn').addEventListener('click', () => {
    if (anyDirty() && !confirm('게시하지 않은 변경사항이 있습니다. 로그아웃할까요?')) return;
    session.clear(); st.files = {}; st.pages = {}; showLogin();
  });
  app().addEventListener('click', onClick);
  app().addEventListener('input', onInput);
  app().addEventListener('change', onChange);
  window.addEventListener('beforeunload', e => { if (anyDirty()) { e.preventDefault(); e.returnValue = ''; } });
  cms('status').then(r => { st.features = r.features; if (!r.features.configured) setupNote(); }).catch(e => setupNote(e.message));
}

function setupNote(msg) {
  const n = $('cmsSetupNote');
  n.classList.remove('is-hidden');
  n.innerHTML = msg ? esc(msg) : '<b>서버 설정이 아직 없습니다.</b> 저장하려면 Vercel 환경변수 <code>GITHUB_TOKEN</code>을 등록해야 합니다. (README의 CMS 설정 참고)';
}

function showLogin(message = '') {
  $('cmsLogin').classList.remove('is-hidden');
  app().classList.add('is-hidden');
  $('cmsLogoutBtn').classList.add('is-hidden');
  $('cmsLoginError').textContent = message;
  setTimeout(() => $('cmsPassword').focus(), 50);
}

async function login() {
  const btn = $('cmsLoginBtn');
  btn.disabled = true;
  $('cmsLoginError').textContent = '';
  try {
    const r = await cms('login', { password: $('cmsPassword').value });
    session.set({ token: r.token, expires: r.expires });
    st.features = r.features;
    $('cmsPassword').value = '';
    showApp();
  } catch (e) {
    $('cmsLoginError').textContent = e.message;
    if (e.status === 503) setupNote();
  } finally { btn.disabled = false; }
}

/* 서버 오류 공통 처리: 로그인 만료면 로그인 화면으로 */
function fail(e) {
  if (e.status === 401) { showLogin(e.message); return; }
  showToast(e.message);
}

function showApp() {
  $('cmsLogin').classList.add('is-hidden');
  app().classList.remove('is-hidden');
  $('cmsLogoutBtn').classList.remove('is-hidden');
  if (!st.features) cms('status').then(r => { st.features = r.features; }).catch(() => {});
  app().innerHTML = `
    <div class="ok-tabs cms-tabs">${TABS.map(([id, label, icon], i) => `<span class="ok-tab" data-act="tab" data-i="${i}"><i class="fas ${icon}"></i> ${label}</span>`).join('')}</div>
    <div class="cms-publish-bar is-hidden" id="cmsPublishBar"></div>
    <div id="cmsPanel"></div>`;
  switchTab(st.tab);
}

function switchTab(i) {
  st.tab = i;
  app().querySelectorAll('.cms-tabs .ok-tab').forEach((t, j) => t.classList.toggle('active', j === i));
  syncRoute('cmsOverlay', i);
  const id = TABS[i][0];
  if (id === 'content') renderContent();
  else if (id === 'pages') renderPages();
  else renderUpdates();
}

/* ---------------- 공통: 경로 값 읽기/쓰기 ---------------- */
function getPath(obj, path) {
  if (!path) return obj;
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => (o[k] == null ? (o[k] = {}) : o[k]), obj);
  target[last] = value;
}

/* ---------------- 파일 불러오기 · 게시 ---------------- */
async function loadFile(path) {
  if (st.files[path]) return st.files[path];
  const r = await cms('get', { path });
  st.files[path] = { data: JSON.parse(r.content), sha: r.sha, dirty: false };
  return st.files[path];
}
const anyDirty = () => Object.values(st.files).some(f => f.dirty) || Object.values(st.pages).some(p => p.dirty);

function markDirty(path) {
  st.files[path].dirty = true;
  renderPublishBar();
  const dot = app().querySelector(`[data-file-dot="${CSS.escape(path)}"]`);
  if (dot) dot.classList.add('on');
}

function renderPublishBar() {
  const bar = $('cmsPublishBar');
  if (!bar) return;
  const dirty = Object.entries(st.files).filter(([, f]) => f.dirty).map(([p]) => p);
  bar.classList.toggle('is-hidden', !dirty.length || TABS[st.tab][0] !== 'content');
  if (!dirty.length) return;
  const labels = dirty.map(p => [...new Set(COLLECTIONS.filter(c => c.file === p).map(c => c.label))].join('·'));
  bar.innerHTML = `<span><i class="fas fa-exclamation-circle"></i> 게시하지 않은 변경: <b>${esc(labels.join(', '))}</b></span>
    <span class="cms-bar-btns"><button class="ok-btn line" data-act="discard-all">변경 취소</button><button class="ok-btn" data-act="publish-all"><i class="fas fa-upload"></i> 사이트에 게시</button></span>`;
}

async function publishFiles(paths) {
  for (const path of paths) {
    const f = st.files[path];
    const labels = [...new Set(COLLECTIONS.filter(c => c.file === path).map(c => c.label))].join('·');
    const r = await cms('save', { path, content: formatJson(f.data) + '\n', sha: f.sha, message: `${labels} 수정` });
    f.sha = r.sha;
    f.dirty = false;
  }
}

/* ---------------- 콘텐츠 편집 ---------------- */
const coll = () => COLLECTIONS.find(c => c.id === st.coll);

async function renderContent() {
  const groups = [...new Set(COLLECTIONS.map(c => c.group))];
  $('cmsPanel').innerHTML = `
    <div class="cms-content">
      <aside class="cms-side">
        <select class="cms-side-select" data-act="coll-select" aria-label="편집할 항목">${COLLECTIONS.map(c => `<option value="${c.id}"${c.id === st.coll ? ' selected' : ''}>${esc(c.group)} › ${esc(c.label)}</option>`).join('')}</select>
        ${groups.map(g => `<div class="cms-side-group">${esc(g)}</div>${COLLECTIONS.filter(c => c.group === g).map(c =>
          `<button class="cms-side-item${c.id === st.coll ? ' active' : ''}" data-act="coll" data-id="${c.id}">${esc(c.label)}<span class="cms-dot${st.files[c.file] && st.files[c.file].dirty ? ' on' : ''}" data-file-dot="${esc(c.file)}"></span></button>`).join('')}`).join('')}
      </aside>
      <section class="cms-main" id="cmsMain"><div class="cms-loading"><i class="fas fa-spinner fa-spin"></i> 불러오는 중…</div></section>
    </div>`;
  renderPublishBar();
  const c = coll();
  try { await loadFile(c.file); } catch (e) { fail(e); $('cmsMain').innerHTML = `<div class="cms-error">${esc(e.message)}</div>`; return; }
  renderCollection();
}

function renderCollection() {
  const c = coll();
  const f = st.files[c.file];
  const main = $('cmsMain');
  const head = `
    <div class="cms-head">
      <div><h2>${esc(c.label)}</h2><div class="cms-path"><i class="far fa-file-code"></i> ${esc(c.file)}</div></div>
      <div class="cms-head-btns"><button class="ok-btn line" data-act="history" data-path="${esc(c.file)}"><i class="fas fa-history"></i> 변경 이력</button></div>
    </div>`;
  if (c.kind === 'object') {
    main.innerHTML = head + `<div class="cms-form">${c.fields.map(fd => fieldHtml(fd, getPath(f.data, fd.key), fd.key)).join('')}</div>`;
    return;
  }
  const list = getPath(f.data, c.key) || [];
  const q = st.filter.trim();
  const rows = list.map((it, i) => ({ it, i })).filter(({ it }) => !q || `${c.title(it)} ${c.sub ? c.sub(it) : ''}`.includes(q));
  main.innerHTML = head + `
    ${st.editing !== null && list[st.editing] ? itemFormHtml(c, list[st.editing], st.editing) : ''}
    <div class="cms-list-bar">
      <input type="search" class="cms-filter" data-act="filter" value="${esc(st.filter)}" placeholder="목록에서 찾기" aria-label="목록에서 찾기">
      <span class="cms-count">${list.length}개${q ? ` 중 ${rows.length}개` : ''}</span>
      <button class="ok-btn" data-act="add"><i class="fas fa-plus"></i> 새 항목</button>
    </div>
    <div class="cms-list">${rows.map(({ it, i }) => `
      <div class="cms-row${i === st.editing ? ' editing' : ''}">
        <span class="cms-row-no">${i + 1}</span>
        <div class="cms-row-text" data-act="edit" data-i="${i}"><b>${esc(c.title(it) || '(제목 없음)')}</b>${c.sub ? `<small>${esc(c.sub(it))}</small>` : ''}</div>
        <span class="cms-row-btns">
          <button data-act="up" data-i="${i}" aria-label="위로" ${i === 0 ? 'disabled' : ''}><i class="fas fa-arrow-up"></i></button>
          <button data-act="down" data-i="${i}" aria-label="아래로" ${i === list.length - 1 ? 'disabled' : ''}><i class="fas fa-arrow-down"></i></button>
          <button data-act="edit" data-i="${i}" aria-label="편집"><i class="fas fa-pen"></i></button>
          <button data-act="copy" data-i="${i}" aria-label="복제"><i class="far fa-copy"></i></button>
          <button data-act="del" data-i="${i}" aria-label="삭제" class="danger"><i class="fas fa-trash-alt"></i></button>
        </span>
      </div>`).join('') || '<div class="cms-empty">항목이 없습니다.</div>'}
    </div>`;
}

function itemFormHtml(c, item, i) {
  return `
    <div class="cms-item-form" id="cmsItemForm">
      <div class="cms-item-form-head"><b>${i + 1}번 항목 편집</b><button class="ok-btn line" data-act="close-edit"><i class="fas fa-check"></i> 편집 완료</button></div>
      ${c.preview === 'banner' ? `<div class="cms-preview-label">미리보기</div><div class="cms-banner-preview" id="cmsBannerPreview">${bannerPreview(item)}</div>` : ''}
      <div class="cms-form">${c.fields.map(fd => fieldHtml(fd, item[fd.key], fd.key)).join('')}</div>
      <div class="cms-hint">입력하는 즉시 편집 중인 내용에 반영되며, 위의 <b>사이트에 게시</b>를 눌러야 실제 사이트에 저장됩니다.</div>
    </div>`;
}
const bannerPreview = item => `<div class="banner-slider">${bannerHtml(item, true)}</div>`;

function fieldHtml(fd, value, path) {
  const id = 'cmsf-' + path.replace(/\W/g, '-');
  const label = `<label class="cms-label" for="${id}">${esc(fd.label)}</label>`;
  const hint = fd.hint ? `<div class="cms-field-hint">${esc(fd.hint)}</div>` : '';
  const v = value === undefined || value === null ? '' : value;
  const opts = (fd.options || []).map(o => (Array.isArray(o) ? o : [o, o]));
  let input;
  switch (fd.type) {
    case 'textarea': input = `<textarea id="${id}" data-path="${esc(path)}" rows="${fd.rows || 3}">${esc(v)}</textarea>`; break;
    case 'number': input = `<input id="${id}" type="number" data-path="${esc(path)}" data-num="1" value="${esc(v)}">`; break;
    case 'select': input = `<select id="${id}" data-path="${esc(path)}"${fd.number ? ' data-num="1"' : ''}>${opts.map(([val, lab]) => `<option value="${esc(val)}"${String(val) === String(v) ? ' selected' : ''}>${esc(lab)}</option>`).join('')}</select>`; break;
    case 'tags': input = `<div class="cms-tags">${opts.map(([val, lab]) => `<label><input type="checkbox" data-tag-path="${esc(path)}" value="${esc(val)}"${(v || []).includes(val) ? ' checked' : ''}> ${esc(lab)}</label>`).join('')}</div>`; break;
    case 'icon': input = `<div class="cms-icon-field"><input id="${id}" type="text" data-path="${esc(path)}" value="${esc(v)}"><i class="fas ${esc(v)}" data-icon-for="${esc(path)}"></i></div>`; break;
    case 'link': input = `<div class="cms-link-field"><input id="${id}" type="text" data-path="${esc(path)}" value="${esc(v)}" placeholder="#/화면 또는 https://주소">
      <select data-link-for="${esc(path)}" aria-label="자주 쓰는 화면"><option value="">화면 고르기 ▾</option>${LINK_CHOICES.map(([val, lab]) => `<option value="${esc(val)}">${esc(lab)}</option>`).join('')}</select></div>`; break;
    case 'list': {
      const items = Array.isArray(v) ? v : [];
      input = `<div class="cms-sublist">${items.map((sub, j) => `
        <div class="cms-subrow">
          ${fd.fields.map(sf => `<div class="cms-subcell">${fieldHtml(sf, sub[sf.key], `${path}.${j}.${sf.key}`)}</div>`).join('')}
          <span class="cms-row-btns"><button data-act="sub-up" data-path="${esc(path)}" data-i="${j}" aria-label="위로" ${j === 0 ? 'disabled' : ''}><i class="fas fa-arrow-up"></i></button><button data-act="sub-del" data-path="${esc(path)}" data-i="${j}" class="danger" aria-label="삭제"><i class="fas fa-times"></i></button></span>
        </div>`).join('') || '<div class="cms-empty sm">없음</div>'}
        <button class="ok-btn line sm" data-act="sub-add" data-path="${esc(path)}"><i class="fas fa-plus"></i> ${esc(fd.label)} 추가</button></div>`;
      break;
    }
    default: input = `<input id="${id}" type="${fd.type === 'url' ? 'url' : 'text'}" data-path="${esc(path)}" value="${esc(v)}"${fd.datalist ? ` list="cmsList-${fd.datalist}"` : ''}>${fd.datalist ? datalistHtml(fd.datalist) : ''}`;
  }
  return `<div class="cms-field${fd.type === 'list' ? ' wide' : ''}">${label}${input}${hint}</div>`;
}

function datalistHtml(name) {
  if (name !== 'univs') return '';
  const f = st.files['src/data/teukrye-admissions.json'];
  const univs = f ? (f.data.univs || []).map(u => u.univ) : [];
  return `<datalist id="cmsList-univs">${univs.map(u => `<option value="${esc(u)}">`).join('')}</datalist>`;
}

/* 지금 편집 중인 대상(목록 항목 또는 설정 객체) */
function editTarget() {
  const c = coll();
  const data = st.files[c.file].data;
  if (c.kind === 'object') return getPath(data, c.key);
  return (getPath(data, c.key) || [])[st.editing];
}

/* ---------------- 화면(HTML) 편집 ---------------- */
async function renderPages() {
  renderPublishBar();
  $('cmsPanel').innerHTML = `
    <div class="cms-content">
      <aside class="cms-side">
        <select class="cms-side-select" data-act="page-select" aria-label="편집할 화면">${PAGE_FILES.map(([p, l]) => `<option value="${esc(p)}"${p === st.pagePath ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>
        <div class="cms-side-group">화면 파일</div>
        ${PAGE_FILES.map(([p, l]) => `<button class="cms-side-item${p === st.pagePath ? ' active' : ''}" data-act="page" data-path="${esc(p)}">${esc(l)}<span class="cms-dot${st.pages[p] && st.pages[p].dirty ? ' on' : ''}"></span></button>`).join('')}
      </aside>
      <section class="cms-main" id="cmsMain"><div class="cms-loading"><i class="fas fa-spinner fa-spin"></i> 불러오는 중…</div></section>
    </div>`;
  const path = st.pagePath;
  try {
    if (!st.pages[path]) { const r = await cms('get', { path }); st.pages[path] = { content: r.content, sha: r.sha, dirty: false }; }
  } catch (e) { fail(e); $('cmsMain').innerHTML = `<div class="cms-error">${esc(e.message)}</div>`; return; }
  const p = st.pages[path];
  $('cmsMain').innerHTML = `
    <div class="cms-head">
      <div><h2>${esc((PAGE_FILES.find(x => x[0] === path) || [])[1])}</h2><div class="cms-path"><i class="far fa-file-code"></i> ${esc(path)}</div></div>
      <div class="cms-head-btns">
        <button class="ok-btn line" data-act="history" data-path="${esc(path)}"><i class="fas fa-history"></i> 변경 이력</button>
        <button class="ok-btn line" data-act="page-discard" ${p.dirty ? '' : 'disabled'}>편집 취소</button>
        <button class="ok-btn" data-act="page-publish" ${p.dirty ? '' : 'disabled'}><i class="fas fa-upload"></i> 사이트에 게시</button>
      </div>
    </div>
    <div class="cms-warn"><i class="fas fa-exclamation-triangle"></i> HTML 태그와 <code>id</code>·<code>onclick</code> 같은 속성은 화면 동작에 쓰이므로 글자만 고치는 것을 권장합니다. 문제가 생기면 <b>변경 이력</b>에서 이전 버전으로 되돌릴 수 있습니다.</div>
    <textarea class="cms-code" id="cmsCode" spellcheck="false" aria-label="HTML 내용">${esc(p.content)}</textarea>`;
}

/* ---------------- 참조 사이트 업데이트 ---------------- */
async function renderUpdates(reload = true) {
  renderPublishBar();
  const u = st.upd;
  const pending = u.list.filter(x => x.status === 'pending');
  const decided = u.list.filter(x => x.status !== 'pending');
  $('cmsPanel').innerHTML = `
    <div class="cms-upd">
      <div class="cms-intro">
        <b>참조 사이트 업데이트 확인</b> — <b>지금 확인하기</b>를 누를 때만 교육부 OKEP·대교협·nikangs·대학 모집요강 등 참조 사이트를 확인합니다.
        바뀐 내용은 <b>검토 대기</b>에 쌓이고, 사이트에 <b>반영할지 · 참고만 할지 · 무시할지</b>는 직접 고릅니다. 사이트 내용은 자동으로 바뀌지 않습니다.
        ${st.features && st.features.ai ? ' <span class="cms-badge ai"><i class="fas fa-magic"></i> AI 요약·제안 사용 가능</span>' : ' <span class="cms-badge">AI 요약·제안: Vercel에 ANTHROPIC_API_KEY를 등록하면 사용 가능</span>'}
      </div>
      <div class="cms-upd-actions">
        <button class="ok-btn" data-act="check" ${u.checking ? 'disabled' : ''}><i class="fas fa-sync-alt${u.checking ? ' fa-spin' : ''}"></i> ${u.checking ? '확인 중…' : '지금 확인하기'}</button>
        <span class="cms-progress" id="cmsProgress">${u.run ? runSummary(u.run) : '처음 확인할 때는 각 사이트의 현재 내용을 기준으로 저장하고, 그다음 확인부터 바뀐 점을 알려 드립니다.'}</span>
      </div>
      <div class="cms-upd-tabs">
        <button class="${u.view === 'pending' ? 'active' : ''}" data-act="upd-view" data-v="pending">검토 대기 <b>${pending.length}</b></button>
        <button class="${u.view === 'decided' ? 'active' : ''}" data-act="upd-view" data-v="decided">결정한 항목 <b>${decided.length}</b></button>
        <button class="${u.view === 'sources' ? 'active' : ''}" data-act="upd-view" data-v="sources">확인 대상 사이트 <b>${u.sources.length}</b></button>
      </div>
      <div id="cmsUpdList">${u.view === 'sources' ? sourcesHtml() : (u.view === 'pending' ? pending : decided).map(updateCard).join('') || `<div class="cms-empty">${u.view === 'pending' ? '검토할 업데이트가 없습니다.' : '아직 결정한 항목이 없습니다.'}</div>`}</div>
    </div>`;
  if (reload) {
    try {
      const r = await cms('updates');
      u.list = r.updates; u.sources = r.sources;
      renderUpdates(false);
    } catch (e) { fail(e); }
  }
}

function runSummary(run) {
  const count = k => run.results.filter(r => r.result === k).length;
  const errors = run.results.filter(r => r.result === 'error');
  return `${run.done ? '확인 완료' : '확인 중'} ${run.results.length}/${run.total} · 바뀜 <b>${count('changed')}</b> · 변화 없음 ${count('same')} · 기준 저장 ${count('baseline')} · 접속 실패 ${errors.length}` +
    (errors.length && run.done ? `<div class="cms-errors">${errors.map(r => `<div><i class="fas fa-times-circle"></i> ${esc(r.title)} — ${esc(r.message)}</div>`).join('')}</div>` : '');
}

function updateCard(u) {
  const ai = st.upd.ai[u.id];
  const body = u.kind === 'html'
    ? `<div class="cms-diff">${(u.added || []).map(l => `<div class="add">+ ${esc(l)}</div>`).join('')}${u.addedCount > (u.added || []).length ? `<div class="more">… 새 줄 ${u.addedCount - u.added.length}개 더</div>` : ''}${!u.addedCount ? '<div class="more">새로 생긴 줄 없음</div>' : ''}${u.removedCount ? `<div class="del">− 없어진 줄 ${u.removedCount}개</div>` : ''}</div>`
    : `<div class="cms-diff"><div class="more">파일(PDF 등)이 바뀌었습니다: 크기 ${Number(u.sizeFrom || 0).toLocaleString()} → ${Number(u.sizeTo || 0).toLocaleString()} 바이트. 원문을 열어 확인하세요.</div></div>`;
  return `
    <div class="cms-card${u.status !== 'pending' ? ' decided' : ''}">
      <div class="cms-card-head">
        <span class="cms-badge">${esc(u.group || '')}</span>
        ${u.status !== 'pending' ? `<span class="cms-badge st-${u.status}">${STATUS_LABEL[u.status]}</span>` : ''}
        <b>${esc(u.title)}</b>
        <a href="${esc(u.url)}" target="_blank" rel="noopener" class="cms-card-link">원문 열기 <i class="fas fa-external-link-alt"></i></a>
      </div>
      <div class="cms-card-meta">감지 ${fmtDate(u.detectedAt)}${u.decidedAt ? ` · 결정 ${fmtDate(u.decidedAt)}` : ''}</div>
      ${body}
      ${ai ? aiHtml(u, ai) : ''}
      ${u.status === 'pending' ? `
        <input type="text" class="cms-note-input" data-note-for="${esc(u.id)}" placeholder="메모 (선택) 예: 2028 요강 나오면 반영" maxlength="500">
        <div class="cms-card-btns">
          <button class="ok-btn" data-act="decide" data-id="${esc(u.id)}" data-d="applied"><i class="fas fa-check"></i> 반영함</button>
          <button class="ok-btn line" data-act="decide" data-id="${esc(u.id)}" data-d="referenced"><i class="far fa-bookmark"></i> 참고만</button>
          <button class="ok-btn line gray" data-act="decide" data-id="${esc(u.id)}" data-d="ignored"><i class="fas fa-ban"></i> 무시</button>
          <button class="ok-btn line" data-act="jump" data-id="${esc(u.id)}"><i class="fas fa-edit"></i> 관련 항목 편집</button>
          ${st.features && st.features.ai ? `<button class="ok-btn line" data-act="ai" data-id="${esc(u.id)}"><i class="fas fa-magic"></i> AI 요약·제안</button>` : ''}
        </div>` : `
        ${u.note ? `<div class="cms-card-note"><i class="far fa-sticky-note"></i> ${esc(u.note)}</div>` : ''}
        <div class="cms-card-btns"><button class="ok-btn line" data-act="decide" data-id="${esc(u.id)}" data-d="pending">다시 검토 대기로</button></div>`}
    </div>`;
}

function aiHtml(u, ai) {
  if (ai.loading) return '<div class="cms-ai"><i class="fas fa-spinner fa-spin"></i> AI가 변경 내용을 읽는 중…</div>';
  if (ai.error) return `<div class="cms-ai error">${esc(ai.error)}</div>`;
  const s = ai.suggestion;
  const REC = { apply: '반영 추천', reference: '참고만 추천', ignore: '무시 추천' };
  const IMP = { high: '중요', medium: '보통', low: '낮음' };
  return `
    <div class="cms-ai">
      <div class="cms-ai-head"><i class="fas fa-magic"></i> AI 의견 <span class="cms-badge">${IMP[s.importance] || ''}</span> <span class="cms-badge st-${s.recommendation === 'apply' ? 'applied' : s.recommendation === 'ignore' ? 'ignored' : 'referenced'}">${REC[s.recommendation] || ''}</span></div>
      <p>${esc(s.summary)}</p><p class="cms-ai-reason">${esc(s.reason)}</p>
      ${(s.suggestions || []).length ? `<div class="cms-ai-sugs">${s.suggestions.map((g, k) => `
        <div class="cms-ai-sug"><div><b>${esc(g.match)}</b> · ${esc(g.field)}<br><span class="old">${esc(g.current)}</span> → <span class="new">${esc(g.proposed)}</span><br><small>${esc(g.why)}</small></div>
        <button class="ok-btn line sm" data-act="ai-apply" data-id="${esc(u.id)}" data-k="${k}">편집기에 넣기</button></div>`).join('')}</div>
      <div class="cms-hint">'편집기에 넣기'는 콘텐츠 편집 화면의 편집 중인 내용만 바꿉니다. 확인한 뒤 <b>사이트에 게시</b>를 눌러야 저장됩니다.</div>` : ''}
    </div>`;
}

function sourcesHtml() {
  const list = st.upd.sources;
  if (!list.length) return '<div class="cms-empty">아직 확인한 적이 없습니다. <b>지금 확인하기</b>를 눌러 주세요. 확인 대상은 콘텐츠 편집 › 사이트 설정 › 참조 사이트 목록과 특례전형·자료실의 링크입니다.</div>';
  return `<div class="cms-sources">${list.map(s => `
    <div class="cms-source${s.error ? ' err' : ''}">
      <span class="cms-badge">${esc(s.group || '')}</span>
      <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>
      <small>${s.error ? `<i class="fas fa-times-circle"></i> ${esc(s.error)}` : `${s.kind === 'file' ? '파일' : '페이지'} · 확인 ${fmtDate(s.checkedAt)} · 마지막 변경 ${fmtDate(s.changedAt)}`}</small>
    </div>`).join('')}</div>`;
}

const fmtDate = iso => { if (!iso) return '-'; const d = new Date(iso); return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

async function runCheck() {
  const u = st.upd;
  u.checking = true;
  u.run = { total: 0, results: [], done: false };
  renderUpdates(false);
  try {
    let offset = 0;
    while (offset !== null) {
      const r = await cms('check', { offset, limit: 6 });
      u.run.total = r.total;
      u.run.results.push(...r.results);
      $('cmsProgress').innerHTML = runSummary(u.run);
      offset = r.next;
    }
    u.run.done = true;
    const changed = u.run.results.filter(r => r.result === 'changed').length;
    showToast(changed ? `바뀐 곳 ${changed}곳을 검토 대기에 추가했습니다.` : '새로 바뀐 곳이 없습니다.');
  } catch (e) { fail(e); }
  u.checking = false;
  u.view = 'pending';
  renderUpdates(true);
}

/* 업데이트와 관련된 편집 항목으로 이동 */
async function jumpTo(update) {
  const targets = [['src/data/teukrye-admissions.json', 'admRows', d => d.rows, r => r.univ], ['src/data/library.json', 'library', d => d, r => r.title], ['cms/sources.json', 'sources', d => d, r => r.title]];
  for (const [file, id, list, label] of targets) {
    try {
      const f = await loadFile(file);
      const hit = (list(f.data) || []).find(r => r.url === update.url);
      if (hit) { st.coll = id; st.filter = label(hit).replace(/\(.*\)/, ''); st.editing = null; switchTab(0); return; }
    } catch (e) { fail(e); return; }
  }
  showToast('같은 주소를 쓰는 편집 항목을 찾지 못했습니다. 콘텐츠 편집에서 직접 찾아 주세요.');
}

/* AI 제안 1건을 편집 중인 내용에 넣기 (저장은 하지 않음) */
async function applySuggestion(g) {
  try {
    const f = await loadFile(g.file);
    let item;
    if (g.file.endsWith('teukrye-admissions.json')) {
      const [univ, type] = g.match.split('|');
      item = (f.data.rows || []).find(r => r.univ === univ && r.type === type);
    } else item = (Array.isArray(f.data) ? f.data : []).find(r => r.url === g.match);
    if (!item) { showToast('제안 대상 항목을 찾지 못했습니다. 직접 편집해 주세요.'); return; }
    item[g.field] = g.field === 'tags' ? g.proposed.split(/[,·\s]+/).filter(Boolean) : g.proposed;
    markDirty(g.file);
    showToast('편집기에 넣었습니다. 콘텐츠 편집에서 확인한 뒤 게시하세요.');
  } catch (e) { fail(e); }
}

/* ---------------- 변경 이력 (창) ---------------- */
async function openHistory(path) {
  const box = document.createElement('div');
  box.className = 'cms-modal';
  box.innerHTML = `<div class="cms-modal-box"><div class="cms-modal-head"><b>변경 이력</b> <small>${esc(path)}</small><button data-close aria-label="닫기"><i class="fas fa-times"></i></button></div><div class="cms-modal-body"><i class="fas fa-spinner fa-spin"></i> 불러오는 중…</div></div>`;
  document.body.appendChild(box);
  const close = () => box.remove();
  box.addEventListener('click', e => { if (e.target === box || e.target.closest('[data-close]')) close(); });
  const body = box.querySelector('.cms-modal-body');
  let commits;
  try { commits = (await cms('history', { path })).commits; } catch (e) { close(); fail(e); return; }
  body.innerHTML = commits.length ? `<div class="cms-hint">최근 변경 ${commits.length}개 · 되돌리면 그 버전 내용으로 새로 게시됩니다.</div>${commits.map(c => `
    <div class="cms-commit"><div><b>${esc(c.message)}</b><small>${fmtDate(c.date)} · <a href="${esc(c.url)}" target="_blank" rel="noopener">GitHub에서 보기</a></small></div>
    <span><button class="ok-btn line sm" data-view="${esc(c.sha)}">내용 보기</button> <button class="ok-btn sm" data-restore="${esc(c.sha)}">이 버전으로 되돌리기</button></span></div>`).join('')}<pre class="cms-commit-view is-hidden"></pre>` : '<div class="cms-empty">변경 이력이 없습니다.</div>';
  body.addEventListener('click', async e => {
    const view = e.target.closest('[data-view]');
    const restore = e.target.closest('[data-restore]');
    if (!view && !restore) return;
    const ref = (view || restore).dataset.view || (view || restore).dataset.restore;
    try {
      const old = await cms('get', { path, ref });
      if (view) { const pre = body.querySelector('.cms-commit-view'); pre.textContent = old.content; pre.classList.remove('is-hidden'); pre.scrollIntoView({ block: 'nearest' }); return; }
      if (!confirm('이 버전 내용으로 되돌려 사이트에 게시할까요? (편집 중인 변경은 사라집니다)')) return;
      const cur = await cms('get', { path });
      await cms('save', { path, content: old.content, sha: cur.sha, message: `이전 버전으로 되돌림 (${ref.slice(0, 7)})` });
      delete st.files[path]; delete st.pages[path];
      close();
      showToast('되돌렸습니다. 약 1분 뒤 사이트에 반영됩니다.');
      switchTab(st.tab);
    } catch (err) { fail(err); }
  });
}

/* ---------------- 이벤트 ---------------- */
async function onClick(e) {
  const el = e.target.closest('[data-act]');
  if (!el || el.tagName === 'SELECT' || (el.tagName === 'INPUT' && el.type !== 'button')) return;
  const act = el.dataset.act;
  const i = Number(el.dataset.i);
  const c = coll();
  const list = () => getPath(st.files[c.file].data, c.key);

  if (act === 'tab') { switchTab(i); return; }
  if (act === 'coll') { st.coll = el.dataset.id; st.editing = null; st.filter = ''; renderContent(); return; }
  if (act === 'history') { openHistory(el.dataset.path); return; }
  if (act === 'edit') { st.editing = st.editing === i ? null : i; renderCollection(); if (st.editing !== null) $('cmsItemForm').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  if (act === 'close-edit') { st.editing = null; renderCollection(); return; }
  if (act === 'add') { list().push(c.blank()); st.editing = list().length - 1; markDirty(c.file); renderCollection(); $('cmsItemForm').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  if (act === 'copy') { list().splice(i + 1, 0, JSON.parse(JSON.stringify(list()[i]))); st.editing = i + 1; markDirty(c.file); renderCollection(); return; }
  if (act === 'del') {
    if (!confirm(`'${c.title(list()[i]) || '이 항목'}'을(를) 삭제할까요? (게시하기 전까지는 취소할 수 있습니다)`)) return;
    list().splice(i, 1); st.editing = null; markDirty(c.file); renderCollection(); return;
  }
  if (act === 'up' || act === 'down') {
    const j = act === 'up' ? i - 1 : i + 1;
    const arr = list();
    [arr[i], arr[j]] = [arr[j], arr[i]];
    if (st.editing === i) st.editing = j; else if (st.editing === j) st.editing = i;
    markDirty(c.file); renderCollection(); return;
  }
  if (act === 'sub-add' || act === 'sub-del' || act === 'sub-up') {
    const target = editTarget();
    const field = c.fields.find(fd => fd.key === el.dataset.path) || { blank: () => ({}) };
    const arr = getPath(target, el.dataset.path) || [];
    if (act === 'sub-add') arr.push(field.blank ? field.blank() : {});
    if (act === 'sub-del') arr.splice(i, 1);
    if (act === 'sub-up') [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
    setPath(target, el.dataset.path, arr);
    markDirty(c.file); renderCollection(); return;
  }
  if (act === 'publish-all') {
    const paths = Object.entries(st.files).filter(([, f]) => f.dirty).map(([p]) => p);
    el.disabled = true;
    try { await publishFiles(paths); showToast('게시했습니다. 약 1분 뒤 사이트에 반영됩니다.'); }
    catch (err) { fail(err); }
    renderContent(); return;
  }
  if (act === 'discard-all') {
    if (!confirm('게시하지 않은 변경을 모두 취소할까요?')) return;
    Object.keys(st.files).forEach(p => { if (st.files[p].dirty) delete st.files[p]; });
    st.editing = null; renderContent(); return;
  }
  if (act === 'page') { st.pagePath = el.dataset.path; renderPages(); return; }
  if (act === 'page-discard') { delete st.pages[st.pagePath]; renderPages(); return; }
  if (act === 'page-publish') {
    const p = st.pages[st.pagePath];
    el.disabled = true;
    try {
      const r = await cms('save', { path: st.pagePath, content: p.content, sha: p.sha, message: `${(PAGE_FILES.find(x => x[0] === st.pagePath) || [])[1]} 화면 수정` });
      p.sha = r.sha; p.dirty = false;
      showToast('게시했습니다. 약 1분 뒤 사이트에 반영됩니다.');
    } catch (err) { fail(err); }
    renderPages(); return;
  }
  if (act === 'check') { runCheck(); return; }
  if (act === 'upd-view') { st.upd.view = el.dataset.v; renderUpdates(false); return; }
  if (act === 'decide') {
    const note = (app().querySelector(`[data-note-for="${CSS.escape(el.dataset.id)}"]`) || {}).value || '';
    try {
      const r = await cms('decide', { id: el.dataset.id, decision: el.dataset.d, note });
      const idx = st.upd.list.findIndex(x => x.id === r.update.id);
      if (idx >= 0) st.upd.list[idx] = r.update;
      showToast(`'${STATUS_LABEL[el.dataset.d]}'(으)로 기록했습니다.`);
      renderUpdates(false);
    } catch (err) { fail(err); }
    return;
  }
  if (act === 'jump') { jumpTo(st.upd.list.find(x => x.id === el.dataset.id)); return; }
  if (act === 'ai') {
    const id = el.dataset.id;
    st.upd.ai[id] = { loading: true };
    renderUpdates(false);
    try { st.upd.ai[id] = await cms('ai', { id }); }
    catch (err) { st.upd.ai[id] = { error: err.message }; if (err.status === 401) fail(err); }
    renderUpdates(false); return;
  }
  if (act === 'ai-apply') { const s = st.upd.ai[el.dataset.id].suggestion.suggestions[Number(el.dataset.k)]; applySuggestion(s); }
}

function onInput(e) {
  const t = e.target;
  if (t.dataset.act === 'filter') { st.filter = t.value; renderCollection(); const f = app().querySelector('.cms-filter'); f.focus(); f.setSelectionRange(f.value.length, f.value.length); return; }
  if (t.id === 'cmsCode') {
    const p = st.pages[st.pagePath];
    p.content = t.value;
    if (!p.dirty) { p.dirty = true; app().querySelectorAll('[data-act="page-publish"],[data-act="page-discard"]').forEach(b => { b.disabled = false; }); }
    return;
  }
  if (t.dataset.path !== undefined && TABS[st.tab][0] === 'content') {
    const target = editTarget();
    if (!target) return;
    setPath(target, t.dataset.path, t.dataset.num ? (t.value === '' ? '' : Number(t.value)) : t.value);
    markDirty(coll().file);
    const icon = app().querySelector(`[data-icon-for="${CSS.escape(t.dataset.path)}"]`);
    if (icon) icon.className = 'fas ' + t.value;
    const pv = $('cmsBannerPreview');
    if (pv) pv.innerHTML = bannerPreview(target);
  }
}

function onChange(e) {
  const t = e.target;
  if (t.dataset.act === 'coll-select') { st.coll = t.value; st.editing = null; st.filter = ''; renderContent(); return; }
  if (t.dataset.act === 'page-select') { st.pagePath = t.value; renderPages(); return; }
  if (t.dataset.linkFor) {
    if (!t.value) return;
    const input = t.parentElement.querySelector('input');
    input.value = t.value;
    t.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }
  if (t.dataset.tagPath) {
    const target = editTarget();
    const boxes = [...t.closest('.cms-tags').querySelectorAll('input')];
    setPath(target, t.dataset.tagPath, boxes.filter(b => b.checked).map(b => b.value));
    markDirty(coll().file);
    return;
  }
  if (t.tagName === 'SELECT' && t.dataset.path !== undefined) onInput(e);
}
