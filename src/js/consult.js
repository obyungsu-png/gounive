/* ===== 특례 입시상담 (Store: Supabase 또는 데모) ===== */
import { Store } from './store.js';
import { showToast, escapeHtml } from './ui.js';
import { navigate } from './router.js';

const getCurrentUser = () => Store.getUser();
let consultScope = 'mine';

export function setConsultScope(scope) {
  consultScope = scope;
  document.querySelectorAll('#consultScope button').forEach((b, i) => b.classList.toggle('active', (i === 0) === (scope === 'all')));
  document.getElementById('consultScopeLabel').textContent = scope === 'all' ? '공개 상담' : '내 상담';
  renderConsults();
}

async function renderConsults() {
  const box = document.getElementById('consultList');
  if (consultScope === 'mine' && !getCurrentUser()) {
    document.getElementById('consultCount').textContent = 0;
    box.innerHTML = '<div class="empty-state"><i class="fas fa-lock"></i> 로그인하면 내 상담 내역을 볼 수 있어요.</div>';
    return;
  }
  let list;
  try {
    list = await Store.listConsults(consultScope);
  } catch (e) {
    box.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i> ${escapeHtml(e.message)}</div>`;
    return;
  }
  if (consultScope === 'all') list = list.filter(c => c.open || c.mine);
  document.getElementById('consultCount').textContent = list.length;
  box.innerHTML = list.length
    ? list.map(c => `
      <div class="consult-item">
        <div class="consult-item-head">
          <span class="adm-type-badge">${escapeHtml(c.field)}</span><span class="adm-type-badge blue">${escapeHtml(c.type)}</span>
          <span class="consult-status${c.status === '답변완료' ? ' done' : ''}">${escapeHtml(c.status || '답변대기')}</span>
        </div>
        <div class="consult-item-title">${escapeHtml(c.title)}</div>
        <div class="consult-item-body">${escapeHtml(c.body)}</div>
        ${c.answer ? `<div class="consult-answer"><b>답변</b><br>${escapeHtml(c.answer)}</div>` : ''}
        <div class="consult-item-meta">${escapeHtml(c.date || '')} · ${c.open ? '공개' : '비공개'}${c.mine ? ' · 내 글' : ''}</div>
      </div>`).join('')
    : `<div class="empty-state"><i class="fas fa-exclamation-circle"></i>${consultScope === 'all' ? '공개된 상담이 아직 없어요.' : '작성하신 상담이 없어요.'}</div>`;
}

export function openConsultForm() {
  if (!getCurrentUser()) {
    showToast('상담 신청은 로그인 후 이용할 수 있어요.');
    sessionStorage.setItem('afterLogin', '#/consult');
    navigate('#/login/signin');
    return;
  }
  document.getElementById('consultModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeConsultForm() {
  document.getElementById('consultModal').classList.remove('open');
  document.body.style.overflow = '';
}

export async function submitConsult() {
  const title = document.getElementById('consultTitle').value.trim();
  const body = document.getElementById('consultBody').value.trim();
  const err = document.getElementById('consultError');
  if (!title || body.length < 10) { err.textContent = '제목과 10자 이상의 상담 내용을 입력해주세요.'; return; }
  err.textContent = '';
  const btn = document.getElementById('consultSubmit');
  btn.disabled = true;
  try {
    await Store.addConsult({
      field: document.getElementById('consultField').value,
      type: document.getElementById('consultType').value,
      title, body,
      open: document.getElementById('consultOpen').checked
    });
  } catch (e) {
    err.textContent = e.message;
    return;
  } finally {
    btn.disabled = false;
  }
  document.getElementById('consultTitle').value = '';
  document.getElementById('consultBody').value = '';
  closeConsultForm();
  setConsultScope('mine');
  showToast(Store.isServer ? '상담이 등록되었습니다. 답변이 등록되면 이곳에서 확인할 수 있어요.' : '상담이 등록되었습니다. (데모: 이 브라우저에만 저장)');
}

Store.onChange(() => renderConsults());
