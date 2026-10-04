/* ===== 대학별 성적분석: 특례 전형 운영 대학 목록 (데이터: teukrye-admissions.json) ===== */
import { escapeHtml } from './ui.js';
import { openPage, syncRoute, onRouteEnter } from './router.js';
import { admRows, renderAdmTable } from './teukrye-adm.js';

const TABS = [{ label: '3년 특례', type: '3년' }, { label: '12년 특례', type: '12년' }];

export function switchUnivGradeTab(idx) {
  const tab = TABS[idx];
  const rows = admRows.filter(r => r.type === tab.type);
  document.querySelectorAll('#univGradeOverlay .grade-tab-univ').forEach((t,i) => t.classList.toggle('active', i === idx));
  document.getElementById('ugBcCur').textContent = tab.label;
  document.getElementById('ugTotal').textContent = rows.length + '개 대학';
  document.getElementById('ugTags').innerHTML = rows.map(r =>
    `<button class="univ-grade-tag" data-js data-univ="${escapeHtml(r.univ)}" data-type="${r.type}">${escapeHtml(r.univ)}${r.quota ? ` <strong>${escapeHtml(r.quota.split(' ')[0])}</strong>` : ''}</button>`).join('');
  syncRoute('univGradeOverlay', idx);
}

document.getElementById('ugTags').addEventListener('click', e => {
  const tag = e.target.closest('[data-univ]');
  if (!tag) return;
  openPage('admOverlay', tag.dataset.type === '12년' ? 1 : 0);
  document.getElementById('admKeyword').value = tag.dataset.univ.replace(/\(.*\)/, '');
  renderAdmTable();
});

switchUnivGradeTab(0);
onRouteEnter('univGradeOverlay', i => switchUnivGradeTab(i));
