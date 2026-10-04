const ROWS_PER_PAGE = 10;

/* ====== 대학 테이블 렌더 ====== */
let univQuery = '';

function filterUnivTable(q) {
  univQuery = q.trim();
  const input = document.getElementById('univSearchInput');
  if (input.value !== q) input.value = q;
  renderUnivTable(1);
}

function renderUnivTable(page) {
  const list = univQuery ? univData.filter(d => d.name.includes(univQuery)) : univData;
  document.getElementById('univTotal').textContent = list.length.toLocaleString() + '건';
  const start = (page-1)*ROWS_PER_PAGE;
  const rows = list.slice(start, start+ROWS_PER_PAGE);
  const body = document.getElementById('univTableBody');
  body.innerHTML = rows.map(d => `
    <tr>
      <td><div class="univ-name-cell">
        <div class="univ-logo">${d.name.charAt(0)}</div>
        <span class="univ-name-text">${d.name}</span>
      </div></td>
      <td><div class="region-cell"><i class="fas fa-map-marker-alt"></i>${d.region}</div></td>
      <td><div class="competition-cell">
        <div>수시 <span class="comp-su">${d.su}</span></div>
        <div>정시 <span class="comp-jeong">${d.jeong}</span></div>
      </div></td>
      <td><a class="num-link" href="#">${d.capacity.toLocaleString()}</a></td>
      <td><a class="num-link" href="#">${d.dept}</a></td>
      <td><a class="num-link" href="#">${d.adm}</a></td>
      <td><button class="compare-btn">✓ 비교</button></td>
      <td><button class="star-btn">★</button></td>
    </tr>`).join('');
  renderPagination('univPagination', page, Math.max(1, Math.ceil(list.length/ROWS_PER_PAGE)), renderUnivTable);
}

/* ====== 학과 테이블 렌더 ====== */
function renderDeptTable(page) {
  const start = (page-1)*ROWS_PER_PAGE;
  const rows = deptData.slice(start, start+ROWS_PER_PAGE);
  const body = document.getElementById('deptTableBody');
  body.innerHTML = rows.map(d => `
    <tr>
      <td style="text-align:left;font-weight:600;">${d.dept}</td>
      <td><div class="univ-name-cell" style="justify-content:center;">
        <div class="univ-logo" style="width:28px;height:28px;font-size:11px;">${d.univ.charAt(0)}</div>
        <span style="font-size:12px;">${d.univ}</span>
      </div></td>
      <td><div class="region-cell"><i class="fas fa-map-marker-alt"></i>${d.region}</div></td>
      <td><div class="competition-cell">
        <div>수시 <span class="comp-su">${d.su}</span></div>
        <div>정시 <span class="comp-jeong">${d.jeong}</span></div>
      </div></td>
      <td><a class="num-link" href="#">${d.capacity}</a></td>
      <td><button class="result-btn">입시결과</button></td>
      <td><button class="compare-btn">✓ 비교</button></td>
    </tr>`).join('');
  renderPagination('deptPagination', page, Math.ceil(deptData.length/ROWS_PER_PAGE), renderDeptTable);
}

/* ====== 페이지네이션 ====== */
function renderPagination(containerId, current, total, callback) {
  const c = document.getElementById(containerId);
  let html = `<button class="page-btn" onclick="${callback.name}(1)">«</button>
              <button class="page-btn" onclick="${callback.name}(Math.max(1,${current}-1))">‹</button>`;
  for(let i=1;i<=Math.min(total,10);i++){
    html += `<button class="page-btn${i===current?' active':''}" onclick="${callback.name}(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" onclick="${callback.name}(Math.min(${total},${current}+1))">›</button>
           <button class="page-btn" onclick="${callback.name}(${total})">»</button>`;
  c.innerHTML = html;
}

/* ====== 페이지 표시 (주소 변경은 router.js가 담당) ====== */
const ALL_PAGES = ['univOverlay','deptOverlay','jobOverlay','admOverlay','gradeOverlay','dataOverlay','compOverlay','consultOverlay','univGradeOverlay','loginOverlay','systemOverlay','instOverlay','returnOverlay','programOverlay'];

function displayPage(id) {
  const wasOpen = document.getElementById(id).classList.contains('open');
  document.getElementById('mainWrap').style.display = 'none';
  ALL_PAGES.forEach(p => document.getElementById(p).classList.toggle('open', p === id));
  if (!wasOpen) window.scrollTo(0, 0);
}

function displayHome() {
  ALL_PAGES.forEach(p => document.getElementById(p).classList.remove('open'));
  document.getElementById('mainWrap').style.display = '';
}

/* 화면 이동: 주소(#/경로)를 바꾸면 router.js가 해당 화면을 표시 */
function openPage(id, sub) { navigate(routePath(id, sub)); }
function showHome() { navigate('#/'); }

/* ESC → 열린 메뉴·모달 닫기 */
document.addEventListener('keydown', function(e){
  if (e.key !== 'Escape') return;
  closeMenu();
  document.querySelectorAll('.guide-modal-overlay.open, .novice-modal-overlay.open, .docs-modal-overlay.open, .ui-modal-overlay.open')
    .forEach(m => m.classList.remove('open'));
  document.body.style.overflow = '';
});

/* ====== 배너 슬라이더 ====== */
let currentSlide = 0;
const totalSlides = 7;
let slideInterval;

function bannerGo(idx) {
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

function bannerNext() {
  bannerGo((currentSlide + 1) % totalSlides);
}

function bannerPrev() {
  bannerGo((currentSlide - 1 + totalSlides) % totalSlides);
}

function resetSlideTimer() {
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
