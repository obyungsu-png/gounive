/* ===== 전체메뉴 · 알림/마이 아이콘 ===== */
import { openPage, navigate, showHome } from './router.js';
import { Store } from './store.js';

export function toggleMenu() {
  const overlay = document.getElementById('menuOverlay');
  const open = !overlay.classList.contains('open');
  overlay.classList.toggle('open', open);
  const btn = document.getElementById('menuBtn');
  btn.classList.toggle('active', open);
  btn.setAttribute('aria-expanded', String(open));
}

export function closeMenu() {
  document.getElementById('menuOverlay').classList.remove('open');
  const btn = document.getElementById('menuBtn');
  btn.classList.remove('active');
  btn.setAttribute('aria-expanded', 'false');
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
