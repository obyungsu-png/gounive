function toggleOkFaq(el) {
  el.parentElement.classList.toggle('open');
}
function switchInstTab(idx) {
  document.querySelectorAll('#instOverlay .ok-tab').forEach((t,i) => t.classList.toggle('active', i === idx));
  document.querySelectorAll('#instOverlay .ok-tab-panel').forEach((p,i) => p.classList.toggle('active', i === idx));
  syncRoute('instOverlay', idx);
}
