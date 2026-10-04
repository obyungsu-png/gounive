/* ===== 특례 입시상담 (서버 연동 전: 이 브라우저에만 저장) ===== */
const CONSULT_KEY = 'teukrye-consults';

function readConsults() {
  try { return JSON.parse(localStorage.getItem(CONSULT_KEY)) || []; } catch (e) { return []; }
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderConsults() {
  const list = readConsults();
  document.getElementById('consultCount').textContent = list.length;
  document.getElementById('consultList').innerHTML = list.length
    ? list.map(c => `
      <div class="consult-item">
        <div class="consult-item-head"><span class="adm-type-badge">${escapeHtml(c.field)}</span><span class="adm-type-badge blue">${escapeHtml(c.type)}</span><span class="consult-status">답변대기</span></div>
        <div class="consult-item-title">${escapeHtml(c.title)}</div>
        <div class="consult-item-body">${escapeHtml(c.body)}</div>
        <div class="consult-item-meta">${c.date} · ${c.open ? '공개' : '비공개'}</div>
      </div>`).join('')
    : '<div class="empty-state"><i class="fas fa-exclamation-circle"></i>작성하신 상담이 없어요.</div>';
}

function openConsultForm() {
  if (!getCurrentUser()) {
    showToast('상담 신청은 로그인 후 이용할 수 있어요.');
    sessionStorage.setItem('afterLogin', '#/consult');
    openPage('loginOverlay');
    return;
  }
  document.getElementById('consultModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeConsultForm() {
  document.getElementById('consultModal').classList.remove('open');
  document.body.style.overflow = '';
}

function submitConsult() {
  const title = document.getElementById('consultTitle').value.trim();
  const body = document.getElementById('consultBody').value.trim();
  const err = document.getElementById('consultError');
  if (!title || body.length < 10) { err.textContent = '제목과 10자 이상의 상담 내용을 입력해주세요.'; return; }
  err.textContent = '';
  const list = readConsults();
  list.unshift({
    field: document.getElementById('consultField').value,
    type: document.getElementById('consultType').value,
    title, body,
    open: document.getElementById('consultOpen').checked,
    date: new Date().toLocaleDateString('ko-KR')
  });
  try { localStorage.setItem(CONSULT_KEY, JSON.stringify(list)); } catch (e) {}
  document.getElementById('consultTitle').value = '';
  document.getElementById('consultBody').value = '';
  closeConsultForm();
  renderConsults();
  showToast('상담이 등록되었습니다. (데모: 이 브라우저에만 저장)');
}

renderConsults();
