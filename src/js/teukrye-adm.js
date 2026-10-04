/* ===== 특례전형정보 (유형 탭 · 필터) — 데이터: src/data/teukrye-admissions.json ===== */
import admissions from '../data/teukrye-admissions.json';
import { escapeHtml } from './ui.js';
import { syncRoute, onRouteEnter } from './router.js';

export const admRows = admissions.rows;
let admType = '3년';

export function setAdmType(type) {
  admType = type;
  document.querySelectorAll('#admTypeTabs .tab-btn').forEach(b => b.classList.toggle('active', b.textContent.startsWith(type)));
  document.getElementById('admBcCur').textContent = type + ' 특례';
  renderAdmTable();
  syncRoute('admOverlay', type === '12년' ? 1 : 0);
}

export function renderAdmTable() {
  const kw = document.getElementById('admKeyword').value.trim();
  const method = document.getElementById('admMethod').value;
  const rows = admRows.filter(d =>
    d.type === admType &&
    (!kw || d.univ.includes(kw) || d.name.includes(kw)) &&
    (!method || d.tags.includes(method)));
  document.getElementById('admTotal').textContent = rows.length + '건';
  document.getElementById('admEmpty').style.display = rows.length ? 'none' : 'block';
  document.getElementById('admTableBody').innerHTML = rows.map(d => `
    <tr>
      <td><div class="univ-name-cell"><div class="univ-logo">${d.univ.charAt(0)}</div><span class="univ-name-text">${escapeHtml(d.univ)}</span></div></td>
      <td><span class="adm-type-badge${d.type === '12년' ? ' blue' : ''}">${d.type} 특례</span><div class="adm-name">${escapeHtml(d.name)}</div></td>
      <td>${d.quota ? escapeHtml(d.quota) : '<span class="text-muted">모집요강 확인</span>'}</td>
      <td class="adm-method-cell">${d.tags.map(t => `<span class="adm-method">${t}</span>`).join('')}<div>${escapeHtml(d.method)}</div></td>
      <td class="fs-12">${d.schedule ? escapeHtml(d.schedule) : '<span class="text-muted">모집요강 확인</span>'}</td>
      <td><a class="adm-result-btn" href="${d.url}" target="_blank" rel="noopener" title="${escapeHtml(d.source)}">모집요강 <i class="fas fa-external-link-alt"></i></a></td>
    </tr>`).join('');
}

export function resetAdmFilters() {
  document.getElementById('admKeyword').value = '';
  document.getElementById('admMethod').value = '';
  renderAdmTable();
}

document.getElementById('admApply').textContent = `${admissions.year}학년도 원서접수 ${admissions.common.apply}`;
document.getElementById('admApplySource').textContent = `(${admissions.common.applySource})`;
document.getElementById('admNote').textContent = admissions.note;
document.getElementById('admUpdated').textContent = `· ${admissions.updated} 기준`;
renderAdmTable();
onRouteEnter('admOverlay', i => setAdmType(i === 1 ? '12년' : '3년'));
