/* ===== 대학별 특례 정보 (대학마다 3년·12년 특례 카드) — 데이터: src/data/teukrye-admissions.json ===== */
import admissions from '../data/teukrye-admissions.json';
import { escapeHtml } from './ui.js';
import { openPage } from './router.js';
import { endpointRule } from './stay-rules.js';
import { useEndpointRule } from './stay-calc.js';

let query = '';
let typeFilter = '';

function track(u, type) {
  const r = admissions.rows.find(x => x.univ === u.univ && x.type === type);
  const blue = type === '12년' ? ' blue' : '';
  if (!r) return `<div class="uc-track none"><span class="adm-type-badge${blue}">${type} 특례</span><p>${escapeHtml(u.note || '확인된 자료 없음')}</p></div>`;
  return `
    <div class="uc-track">
      <div class="uc-track-head"><span class="adm-type-badge${blue}">${type} 특례</span><span class="uc-track-name">${escapeHtml(r.name)}</span></div>
      <dl>
        <dt>모집인원</dt><dd>${r.quota ? escapeHtml(r.quota) : '<span class="text-muted">모집요강 확인</span>'}</dd>
        <dt>전형방법</dt><dd>${r.tags.map(t => `<span class="adm-method">${t}</span>`).join('')} ${escapeHtml(r.method)}</dd>
        <dt>일정</dt><dd>${r.schedule ? escapeHtml(r.schedule) : '<span class="text-muted">모집요강 확인</span>'}</dd>
      </dl>
      <a class="uc-doc" href="${r.url}" target="_blank" rel="noopener" title="${escapeHtml(r.source)}">모집요강 <i class="fas fa-external-link-alt"></i></a>
    </div>`;
}

export function renderUnivCards() {
  const list = admissions.univs.filter(u =>
    (!query || u.univ.includes(query)) &&
    (!typeFilter || admissions.rows.some(r => r.univ === u.univ && r.type === typeFilter)));
  document.getElementById('univTotal').textContent = `${list.length}개 대학 · ${admissions.year}학년도`;
  document.getElementById('univEmpty').classList.toggle('is-hidden', list.length > 0);
  document.getElementById('univCards').innerHTML = list.map(u => {
    const rule = u.dayRule ? endpointRule(u.dayRule) : null;
    return `
    <article class="uc-card">
      <div class="uc-head">
        <div class="univ-logo">${escapeHtml(u.univ.charAt(0))}</div>
        <h2 class="uc-name">${escapeHtml(u.univ)}</h2>
        <a class="uc-home" href="${u.home}" target="_blank" rel="noopener">입학처 <i class="fas fa-external-link-alt"></i></a>
      </div>
      <div class="uc-tracks">${track(u, '3년')}${track(u, '12년')}</div>
      ${rule ? `<div class="uc-foot"><span><i class="fas fa-plane"></i> 출·입국일 산정: ${escapeHtml(rule.label.split(' (')[0])}</span>
        <button type="button" class="ok-btn line" data-js data-rule="${rule.key}">이 기준으로 체류기간 계산</button></div>` : ''}
    </article>`;
  }).join('');
}

/* 통합검색 등에서 대학 이름으로 바로 거르기 */
export function showUniversity(name) {
  openPage('univOverlay');
  query = name;
  document.getElementById('univSearchInput').value = name;
  renderUnivCards();
}

(function initUnivInfo() {
  const input = document.getElementById('univSearchInput');
  input.addEventListener('input', () => { query = input.value.trim(); renderUnivCards(); });
  document.getElementById('univTypeFilter').addEventListener('click', e => {
    const b = e.target.closest('[data-type]');
    if (!b) return;
    typeFilter = b.dataset.type;
    document.querySelectorAll('#univTypeFilter button').forEach(x => x.classList.toggle('active', x === b));
    renderUnivCards();
  });
  document.getElementById('univCards').addEventListener('click', e => {
    const b = e.target.closest('[data-rule]');
    if (!b) return;
    openPage('stayOverlay');
    useEndpointRule(b.dataset.rule);
  });
  renderUnivCards();
})();
