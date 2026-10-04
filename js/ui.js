/* ===== 공통 UI: 토스트 · 미구현 요소 안내 · 알림/마이 아이콘 ===== */
function showToast(msg) {
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

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* href="#" 링크와 onclick 없는 버튼은 '준비 중' 안내 (빈 화면 이동 방지) */
document.addEventListener('click', function(e) {
  const el = e.target.closest('a[href="#"], button');
  if (!el || el.hasAttribute('onclick') || el.dataset.js !== undefined) return;
  if (el.tagName === 'A') e.preventDefault();
  if (el.closest('.info-topbar')) return;
  showToast('준비 중인 기능입니다.');
});

function openNotices() {
  showHome();
  const panel = document.querySelector('.notice-panel');
  setTimeout(() => {
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    panel.classList.add('flash');
    setTimeout(() => panel.classList.remove('flash'), 1600);
  }, 50);
}

function openMyArea() {
  if (getCurrentUser()) openPage('gradeOverlay');
  else navigate('#/login/signin');
}
