function toggleMenu() {
  const overlay = document.getElementById('menuOverlay');
  const btn = document.getElementById('menuBtn');
  const isOpen = overlay.classList.contains('open');
  if (isOpen) {
    overlay.classList.remove('open');
    btn.classList.remove('active');
  } else {
    overlay.classList.add('open');
    btn.classList.add('active');
  }
}
function closeMenu() {
  document.getElementById('menuOverlay').classList.remove('open');
  document.getElementById('menuBtn').classList.remove('active');
}
function menuGo(id) {
  closeMenu();
  openPage(id);
}
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { closeMenu(); }
});

/* 아코디언 토글 */
function toggleAccordion(el) {
  const item = el.closest('.job-acc-item');
  const body = item.querySelector('.job-acc-body');
  const icon = item.querySelector('.acc-icon');
  const isOpen = item.classList.contains('open');
  // 모두 닫기
  document.querySelectorAll('.job-acc-item.open').forEach(i => {
    i.classList.remove('open');
    i.querySelector('.job-acc-body').style.maxHeight = '0';
    i.querySelector('.acc-icon').style.transform = '';
  });
  if (!isOpen) {
    item.classList.add('open');
    body.style.maxHeight = body.scrollHeight + 'px';
    icon.style.transform = 'rotate(180deg)';
  }
}

/* 검색 필터 */
function searchJobs() {
  const keyword = document.getElementById('jobSearchInput').value.trim().toLowerCase();
  const salary = document.getElementById('salaryFilter').value;
  const outlook = document.getElementById('outlookFilter').value;

  document.querySelectorAll('.job-acc-item').forEach(item => {
    const jobs = item.querySelectorAll('.job-tag');
    let catVisible = false;
    jobs.forEach(tag => {
      const name = tag.textContent.toLowerCase();
      const matchKw = !keyword || name.includes(keyword);
      const matchSal = !salary; // 간단 구현: 선택값 있으면 모두 표시
      const matchOut = !outlook;
      if (matchKw && matchSal && matchOut) {
        tag.style.display = '';
        catVisible = true;
      } else if (keyword) {
        tag.style.display = 'none';
      } else {
        tag.style.display = '';
        catVisible = true;
      }
    });
    item.style.display = catVisible ? '' : 'none';
  });
}
