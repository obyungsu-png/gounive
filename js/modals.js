/* ===== 자격요건 가이드 모달 ===== */
function openGuideModal() {
  document.getElementById('guideModalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeGuideModal() {
  document.getElementById('guideModalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
function switchGuideTab(btn, idx) {
  document.querySelectorAll('.guide-tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const titles = [
    '재외국민 자격요건 입력 가이드',
    '해외체류기간 입력 가이드',
    '학력증빙서류 OCR 입력 가이드',
    '해외학교 성적 입력 가이드',
    '서류 HTML 입력 가이드'
  ];
  document.querySelector('#guideContent h2').textContent = titles[idx];
}

/* ===== 초보자 가이드 모달 ===== */
function openNoviceGuide() {
  document.getElementById('noviceModalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeNoviceGuide() {
  document.getElementById('noviceModalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* ===== 서류준비 가이드 모달 ===== */
function openDocsGuide() {
  document.getElementById('docsModalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDocsGuide() {
  document.getElementById('docsModalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
