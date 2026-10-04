/* ===== 전체메뉴 · 알림/마이 아이콘 ===== */
import { openPage, navigate, showHome } from './router.js';
import { Store } from './store.js';

export function toggleMenu() {
  const overlay = document.getElementById('menuOverlay');
  const open = !overlay.classList.contains('open');
  overlay.classList.toggle('open', open);
  document.getElementById('menuBtn').classList.toggle('active', open);
}

export function closeMenu() {
  document.getElementById('menuOverlay').classList.remove('open');
  document.getElementById('menuBtn').classList.remove('active');
}

export function menuGo(id) {
  closeMenu();
  openPage(id);
}

export function openNotices() {
  showHome();
  const panel = document.querySelector('.notice-panel');
  setTimeout(() => {
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    panel.classList.add('flash');
    setTimeout(() => panel.classList.remove('flash'), 1600);
  }, 50);
}

export function openMyArea() {
  if (Store.getUser()) openPage('gradeOverlay');
  else navigate('#/login/signin');
}
