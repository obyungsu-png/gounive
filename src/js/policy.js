/* ===== 운영 정책 (개인정보처리방침 · 이용약관 · 이메일무단수집거부) + 푸터 운영자 정보
   운영자 이름·연락처는 src/data/site.json에서 바꿈 (비어 있으면 입시상담 게시판으로 안내) ===== */
import site from '../data/site.json';
import { escapeHtml } from './ui.js';
import { syncRoute, onRouteEnter } from './router.js';

const TABS = ['개인정보처리방침', '이용약관', '이메일무단수집거부'];
const consultLink = '<a class="text-brand fw-600" href="#/consult">입시상담 게시판</a>(비공개 글)';
const email = site.contactEmail ? `<a class="text-brand fw-600" href="mailto:${escapeHtml(site.contactEmail)}">${escapeHtml(site.contactEmail)}</a>` : '';

const FIELDS = {
  name: escapeHtml(site.name),
  policyDate: escapeHtml(site.policyDate),
  dataRegion: escapeHtml(site.dataRegion),
  operatorLabel: escapeHtml(site.operator || `${site.name} 운영자`),
  contactHtml: email ? `${email} · ${consultLink}` : consultLink,
  footerContact: `${site.operator ? `운영: ${escapeHtml(site.operator)} · ` : ''}문의: ${email ? `${email} · ` : ''}사이트 <a href="#/consult">입시상담 게시판</a>`
};
document.querySelectorAll('[data-site]').forEach(el => { el.innerHTML = FIELDS[el.dataset.site] || ''; });

export function switchPolicyTab(idx) {
  document.querySelectorAll('#policyTabs .ok-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
  document.querySelectorAll('#policyOverlay .ok-tab-panel').forEach((p, i) => p.classList.toggle('active', i === idx));
  document.getElementById('policyBcCur').textContent = TABS[idx];
  syncRoute('policyOverlay', idx);
}

onRouteEnter('policyOverlay', i => switchPolicyTab(i || 0));
