/* ===== 제도안내 FAQ · 재외교육기관 탭 ===== */
import { syncRoute, onRouteEnter } from './router.js';

export function toggleOkFaq(el) {
  el.parentElement.classList.toggle('open');
}
export function switchInstTab(idx) {
  document.querySelectorAll('#instOverlay .ok-tab').forEach((t,i) => t.classList.toggle('active', i === idx));
  document.querySelectorAll('#instOverlay .ok-tab-panel').forEach((p,i) => p.classList.toggle('active', i === idx));
  syncRoute('instOverlay', idx);
}

onRouteEnter('instOverlay', i => switchInstTab(i));
