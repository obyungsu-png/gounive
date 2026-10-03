/* ===== 특례 준비 가이드 (탭 · 체크리스트) ===== */
const PROGRAM_TABS = ['준비 로드맵', '전형요소별 준비', '특례 일정', '체크리스트', '용어사전'];
const CHECKLIST_KEY = 'teukrye-checklist';

function openProgram(idx) {
  openPage('programOverlay');
  switchProgramTab(idx);
}

function switchProgramTab(idx) {
  document.querySelectorAll('#programOverlay .ok-tab').forEach((t,i) => t.classList.toggle('active', i === idx));
  document.querySelectorAll('#programOverlay .ok-tab-panel').forEach((p,i) => p.classList.toggle('active', i === idx));
  document.getElementById('programBcCur').textContent = PROGRAM_TABS[idx];
}

function readChecklist() {
  try { return JSON.parse(localStorage.getItem(CHECKLIST_KEY)) || []; } catch (e) { return []; }
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
  try { localStorage.setItem(CHECKLIST_KEY, JSON.stringify(state)); } catch (e) {}
  renderChecklist();
}

function resetChecklist() {
  document.querySelectorAll('#checklist input').forEach(b => { b.checked = false; });
  saveChecklist();
}

(function initChecklist() {
  const saved = readChecklist();
  document.querySelectorAll('#checklist input').forEach((b,i) => {
    b.checked = !!saved[i];
    b.addEventListener('change', saveChecklist);
  });
  renderChecklist();
})();
