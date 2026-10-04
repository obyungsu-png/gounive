/* ===== 메인 배너 슬라이더 ====== */
let currentSlide = 0;
const totalSlides = 7;
let slideInterval;

export function bannerGo(idx) {
  currentSlide = idx;
  document.querySelectorAll('.banner-slide').forEach((s,i) => {
    s.classList.toggle('active', i === idx);
  });
  document.querySelectorAll('.banner-dots .dot').forEach((d,i) => {
    d.classList.toggle('active', i === idx);
  });
  document.getElementById('bannerCounter').textContent = `‖ ${idx+1}/${totalSlides}`;
  resetSlideTimer();
}

export function bannerNext() {
  bannerGo((currentSlide + 1) % totalSlides);
}

export function bannerPrev() {
  bannerGo((currentSlide - 1 + totalSlides) % totalSlides);
}

export function resetSlideTimer() {
  clearInterval(slideInterval);
  slideInterval = setInterval(bannerNext, 5000);
}

resetSlideTimer();

/* 모바일: 배너 좌우 스와이프 */
(function initBannerSwipe() {
  const slider = document.getElementById('bannerSlider');
  let startX = null;
  slider.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) (dx < 0 ? bannerNext : bannerPrev)();
    startX = null;
  });
})();
