/* ===== 화면(오버레이) 표시 ===== */
export const ALL_PAGES = ['univOverlay','admOverlay','gradeOverlay','dataOverlay','consultOverlay','univGradeOverlay','loginOverlay','systemOverlay','instOverlay','returnOverlay','programOverlay','stayOverlay','enOverlay','policyOverlay'];

export function displayPage(id) {
  const wasOpen = document.getElementById(id).classList.contains('open');
  document.getElementById('mainWrap').style.display = 'none';
  ALL_PAGES.forEach(p => document.getElementById(p).classList.toggle('open', p === id));
  if (!wasOpen) window.scrollTo(0, 0);
}

export function displayHome() {
  ALL_PAGES.forEach(p => document.getElementById(p).classList.remove('open'));
  document.getElementById('mainWrap').style.display = '';
}
