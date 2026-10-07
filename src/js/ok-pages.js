/* ===== 제도안내 FAQ · 재외교육기관 탭 — 기관 목록: src/data/institutions.json ===== */
import inst from '../data/institutions.json';
import { syncRoute, onRouteEnter } from './router.js';
import { escapeHtml } from './ui.js';

export function toggleOkFaq(el) {
  el.parentElement.classList.toggle('open');
}
export function switchInstTab(idx) {
  document.querySelectorAll('#instOverlay .ok-tab').forEach((t,i) => t.classList.toggle('active', i === idx));
  document.querySelectorAll('#instOverlay .ok-tab-panel').forEach((p,i) => p.classList.toggle('active', i === idx));
  syncRoute('instOverlay', idx);
}

onRouteEnter('instOverlay', i => switchInstTab(i));

/* 나라별로 묶어 기관 수가 많은 나라부터 표시 */
function renderInstList(id, list) {
  const groups = new Map();
  list.forEach(it => { if (!groups.has(it.country)) groups.set(it.country, []); groups.get(it.country).push(it); });
  document.getElementById(id).innerHTML = [...groups].sort((a, b) => b[1].length - a[1].length).map(([country, items]) => `
    <div class="inst-group">
      <div class="inst-country">${escapeHtml(country)} <small>${items.length}</small></div>
      <div class="inst-items">${items.map(it => `<a href="${it.url}" target="_blank" rel="noopener">${escapeHtml(it.name)}${it.type ? ` <span class="inst-tag">${escapeHtml(it.type)}</span>` : ''}</a>`).join('')}</div>
    </div>`).join('');
  return groups.size;
}
const schoolCountries = renderInstList('instSchools', inst.schools);
const centerCountries = renderInstList('instCenters', inst.centers);
document.getElementById('instSchoolCount').textContent = `${schoolCountries}개국 ${inst.schools.length}개교 · ${inst.asOf} 기준`;
document.getElementById('instCenterCount').textContent = `${centerCountries}개국 ${inst.centers.length}개원 · ${inst.asOf} 기준`;
