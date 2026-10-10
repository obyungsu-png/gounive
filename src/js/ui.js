/* ===== 공통 UI: 토스트 · HTML 이스케이프 · 미구현 요소 안내 ===== */
export function showToast(msg) {
  let box = document.getElementById('toast');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toast';
    box.className = 'toast';
    box.setAttribute('role', 'status');
    document.body.appendChild(box);
  }
  box.textContent = msg;
  box.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => box.classList.remove('show'), 2400);
}

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* onclick이 달린 div·span 등(버튼·링크가 아닌 요소)을 키보드로도 쓸 수 있게: 포커스 가능 + Enter/Space로 실행 */
const NATIVE = 'A,BUTTON,INPUT,SELECT,TEXTAREA,LABEL,OPTION,I,SVG';
document.querySelectorAll('[onclick]').forEach(el => {
  if (NATIVE.split(',').includes(el.tagName) || /overlay/.test(el.className) || /stopPropagation/.test(el.getAttribute('onclick'))) return;
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
  if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute && e.target.getAttribute('role') === 'button' && !NATIVE.split(',').includes(e.target.tagName)) {
    e.preventDefault();
    e.target.click();
  }
});

/* href="#" 링크와 onclick 없는 버튼은 '준비 중' 안내 (빈 화면 이동 방지) */
document.addEventListener('click', function(e) {
  const el = e.target.closest('a[href="#"], button');
  // 자기 처리기가 다시 그려 화면에서 빠진 요소, data-act/data-link로 처리되는 버튼, CMS 화면은 제외
  if (!el || !el.isConnected || el.hasAttribute('onclick') || el.dataset.js !== undefined || el.dataset.act !== undefined || el.dataset.link !== undefined || el.closest('#cmsOverlay, .cms-modal')) return;
  if (el.tagName === 'A') e.preventDefault();
  if (el.closest('.info-topbar')) return;
  showToast('준비 중인 기능입니다.');
});
