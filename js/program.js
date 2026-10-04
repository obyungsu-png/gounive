/* ===== 특례 준비 가이드 (탭 · 체크리스트) ===== */
const PROGRAM_TABS = ['준비 로드맵', '전형요소별 준비', '특례 일정', '체크리스트', '용어사전'];

function openProgram(idx) {
  openPage('programOverlay', idx);
}

function switchProgramTab(idx) {
  document.querySelectorAll('#programOverlay .ok-tab').forEach((t,i) => t.classList.toggle('active', i === idx));
  document.querySelectorAll('#programOverlay .ok-tab-panel').forEach((p,i) => p.classList.toggle('active', i === idx));
  document.getElementById('programBcCur').textContent = PROGRAM_TABS[idx];
  syncRoute('programOverlay', idx);
}


function renderChecklist() {
  const boxes = document.querySelectorAll('#checklist input');
  const done = Array.from(boxes).filter(b => b.checked).length;
  boxes.forEach(b => b.parentElement.classList.toggle('done', b.checked));
  document.getElementById('checklistBar').style.width = (done / boxes.length * 100) + '%';
  document.getElementById('checklistText').textContent = `${done} / ${boxes.length} 완료`;
  document.getElementById('checklistSummary').textContent = done ? `${boxes.length}개 중 ${done}개 완료` : `${boxes.length}개 항목 점검하기`;
}

function saveChecklist() {
  const state = Array.from(document.querySelectorAll('#checklist input')).map(b => b.checked);
  Store.save('checklist', state);
  renderChecklist();
}

function resetChecklist() {
  document.querySelectorAll('#checklist input').forEach(b => { b.checked = false; });
  saveChecklist();
}

function applyChecklist(saved) {
  document.querySelectorAll('#checklist input').forEach((b,i) => { b.checked = !!(saved && saved[i]); });
  renderChecklist();
}

(function initChecklist() {
  document.querySelectorAll('#checklist input').forEach(b => b.addEventListener('change', saveChecklist));
  applyChecklist(Store.loadLocal('checklist', []));
  // 서버 모드 로그인 시 서버 기록 우선, 없으면 이 기기의 체크 상태를 서버로 올림
  Store.onChange(async user => {
    if (!Store.isServer) return;
    if (!user) { applyChecklist([]); return; }
    const remote = await Store.loadRemote('checklist');
    if (Array.isArray(remote)) { applyChecklist(remote); Store.save('checklist', remote); }
    else if (Store.loadLocal('checklist', []).some(Boolean)) saveChecklist();
  });
})();
