/* ===== 메인 배너 슬라이더 — 내용: src/data/home.json (CMS에서 편집) ===== */
import home from '../data/home.json';
import { escapeHtml } from './ui.js';
import { runLink } from './links.js';

let currentSlide = 0;
let totalSlides = 0;
let slideInterval;

const text = s => escapeHtml(s || '').replace(/\n/g, '<br>');

/* 배너 1개의 HTML (CMS 미리보기에서도 사용) */
export function bannerHtml(b, active = false) {
  return `
    <div class="banner-slide slide-${Number(b.theme) || 1}${active ? ' active' : ''}">
      <div class="banner-content">
        <div class="banner-title">${b.kicker ? `<span class="banner-kicker">${escapeHtml(b.kicker)}</span>` : ''}${text(b.title)}${b.em ? ` <em>${escapeHtml(b.em)}</em>` : ''}</div>
        ${b.desc ? `<div class="banner-desc">${text(b.desc)}</div>` : ''}
        ${(b.buttons || []).length ? `<div class="banner-btns">${b.buttons.filter(x => x.label).map(x =>
          `<button type="button" class="banner-btn ${escapeHtml(x.style || 'btn-fill-brand')}" data-link="${escapeHtml(x.link || '')}">${escapeHtml(x.label)}</button>`).join('')}</div>` : ''}
      </div>
      <div class="banner-illustration"><i class="${(b.icon || '').startsWith('fab ') ? '' : 'fas '}${escapeHtml(b.icon || 'fa-star')} main-icon"></i></div>
    </div>`;
}

export function renderBanners(list) {
  const slider = document.getElementById('bannerSlider');
  slider.querySelectorAll('.banner-slide').forEach(s => s.remove());
  slider.insertAdjacentHTML('afterbegin', list.map((b, i) => bannerHtml(b, i === 0)).join(''));
  totalSlides = list.length;
  document.getElementById('bannerDots').innerHTML = list.map((_, i) =>
    `<span class="dot${i === 0 ? ' active' : ''}" data-js data-dot="${i}" role="button" aria-label="${i + 1}번째 배너"></span>`).join('') +
    `<span class="counter" id="bannerCounter">‖ 1/${totalSlides}</span>`;
  currentSlide = 0;
  slider.classList.toggle('is-single', totalSlides < 2);
  resetSlideTimer();
}

export function bannerGo(idx) {
  if (!totalSlides) return;
  currentSlide = idx;
  document.querySelectorAll('#bannerSlider .banner-slide').forEach((s, i) => s.classList.toggle('active', i === idx));
  document.querySelectorAll('#bannerDots .dot').forEach((d, i) => d.classList.toggle('active', i === idx));
  document.getElementById('bannerCounter').textContent = `‖ ${idx + 1}/${totalSlides}`;
  resetSlideTimer();
}

export function bannerNext() { bannerGo((currentSlide + 1) % totalSlides); }
export function bannerPrev() { bannerGo((currentSlide - 1 + totalSlides) % totalSlides); }

export function resetSlideTimer() {
  clearInterval(slideInterval);
  if (totalSlides > 1) slideInterval = setInterval(bannerNext, 5000);
}

(function initBanner() {
  const slider = document.getElementById('bannerSlider');
  slider.addEventListener('click', e => {
    const btn = e.target.closest('[data-link]');
    if (btn) { runLink(btn.dataset.link); return; }
    const dot = e.target.closest('[data-dot]');
    if (dot) bannerGo(Number(dot.dataset.dot));
  });
  /* 모바일: 배너 좌우 스와이프 */
  let startX = null;
  slider.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40 && totalSlides > 1) (dx < 0 ? bannerNext : bannerPrev)();
    startX = null;
  });
  renderBanners(home.banners || []);
})();
