import UNIV_GRADE_TABS from '../data/univ-grade-tabs.json';
import { syncRoute, onRouteEnter } from './router.js';

export function switchUnivGradeTab(idx) {
  const tab = UNIV_GRADE_TABS[idx];
  document.querySelectorAll('#univGradeOverlay .grade-tab-univ').forEach((t,i) => t.classList.toggle('active', i === idx));
  document.getElementById('ugBcCur').textContent = tab.label;
  document.getElementById('ugTotal').textContent = tab.univs.reduce((sum,u) => sum + u.count, 0) + '건';
  document.getElementById('ugTags').innerHTML = tab.univs.map(u => `<span class="univ-grade-tag">${u.name} <strong>${u.count}건</strong></span>`).join('');
  syncRoute('univGradeOverlay', idx);
}
switchUnivGradeTab(0);
onRouteEnter('univGradeOverlay', i => switchUnivGradeTab(i));
