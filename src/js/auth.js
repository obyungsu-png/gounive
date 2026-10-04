/* ===== 회원 (로그인 · 회원가입 · 비밀번호 찾기) =====
   실제 저장은 Store가 담당: Supabase 설정 시 서버, 아니면 데모(이 브라우저) */
import { Store } from './store.js';
import { showToast, escapeHtml } from './ui.js';
import { navigate, onRouteEnter } from './router.js';

const SAVED_EMAIL_KEY = 'teukrye-saved-email';
const AUTH_PANELS = ['signin', 'signup', 'reset', 'update'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getCurrentUser() { return Store.getUser(); }

export function showAuthPanel(idx) {
  document.querySelectorAll('#loginOverlay .auth-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === AUTH_PANELS[idx]));
}

/* 버튼을 잠그고 비동기 작업 실행, 오류는 해당 칸에 표시 */
async function runAuthAction(btnId, errId, fn) {
  const btn = document.getElementById(btnId);
  const err = document.getElementById(errId);
  err.textContent = '';
  btn.disabled = true;
  try { await fn(err); }
  catch (e) { err.textContent = e.message; }
  finally { btn.disabled = false; }
}

function goAfterLogin() {
  const back = sessionStorage.getItem('afterLogin');
  sessionStorage.removeItem('afterLogin');
  navigate(back || '#/');
}

export function loginUser() {
  runAuthAction('loginSubmit', 'loginError', async (err) => {
    const email = document.getElementById('loginEmail').value.trim();
    const pw = document.getElementById('loginPw').value;
    if (!EMAIL_RE.test(email)) { err.textContent = '이메일을 정확히 입력해주세요.'; return; }
    if (pw.length < (Store.isServer ? 6 : 4)) { err.textContent = `비밀번호를 ${Store.isServer ? 6 : 4}자 이상 입력해주세요.`; return; }
    const user = await Store.signIn(email, pw);
    try {
      if (document.getElementById('loginSaveId').checked) localStorage.setItem(SAVED_EMAIL_KEY, email);
      else localStorage.removeItem(SAVED_EMAIL_KEY);
    } catch (e) {}
    document.getElementById('loginPw').value = '';
    goAfterLogin();
    showToast(`${user.name}님, 로그인되었습니다.${Store.isServer ? '' : ' (데모)'}`);
  });
}

export function signupUser() {
  runAuthAction('signupSubmit', 'signupError', async (err) => {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const pw = document.getElementById('signupPw').value;
    const role = document.querySelector('input[name="signupRole"]:checked').value;
    if (!name) { err.textContent = '이름을 입력해주세요.'; return; }
    if (!EMAIL_RE.test(email)) { err.textContent = '이메일을 정확히 입력해주세요.'; return; }
    if (pw.length < 6) { err.textContent = '비밀번호는 6자 이상이어야 합니다.'; return; }
    if (pw !== document.getElementById('signupPw2').value) { err.textContent = '비밀번호 확인이 일치하지 않습니다.'; return; }
    if (!document.getElementById('signupAgree').checked) { err.textContent = '개인정보 수집·이용에 동의해주세요.'; return; }
    const { needsConfirm } = await Store.signUp({ email, password: pw, name, role });
    ['signupPw', 'signupPw2'].forEach(id => { document.getElementById(id).value = ''; });
    if (needsConfirm) {
      navigate('#/login/signin');
      document.getElementById('loginEmail').value = email;
      showToast('인증 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인해주세요.');
    } else {
      goAfterLogin();
      showToast(`${name}님, 가입을 환영합니다!`);
    }
  });
}

export function requestPasswordReset() {
  runAuthAction('resetSubmit', 'resetError', async (err) => {
    const email = document.getElementById('resetEmail').value.trim();
    if (!EMAIL_RE.test(email)) { err.textContent = '이메일을 정확히 입력해주세요.'; return; }
    await Store.resetPassword(email);
    showToast('비밀번호 재설정 메일을 보냈습니다. 메일함을 확인해주세요.');
    navigate('#/login/signin');
  });
}

export function saveNewPassword() {
  runAuthAction('updateSubmit', 'updateError', async (err) => {
    const pw = document.getElementById('newPw').value;
    if (pw.length < 6) { err.textContent = '비밀번호는 6자 이상이어야 합니다.'; return; }
    if (pw !== document.getElementById('newPw2').value) { err.textContent = '비밀번호 확인이 일치하지 않습니다.'; return; }
    await Store.updatePassword(pw);
    showToast('비밀번호가 변경되었습니다.');
    navigate('#/');
  });
}

export async function logoutUser() {
  await Store.signOut();
  showToast('로그아웃되었습니다.');
}

function renderAuthState(user) {
  document.getElementById('loginBeforeBox').style.display = user ? 'none' : 'flex';
  document.getElementById('loginAfterBox').style.display = user ? 'block' : 'none';
  document.getElementById('menuLoginLink').textContent = user ? `${user.name}님 · 마이페이지 ›` : '로그인해주세요 ›';
  const links = document.getElementById('topLinks');
  if (user) {
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileRole').textContent = user.role;
    links.innerHTML = `<a href="#/grades"><b>${escapeHtml(user.name)}</b>님</a><span>|</span><a href="#" onclick="logoutUser();return false;">로그아웃</a><span>|</span><a href="#" onclick="toggleMenu();return false;">사이트맵</a>`;
  } else {
    links.innerHTML = `<a href="#/login/signin">로그인</a><span>|</span><a href="#/login/signup">회원가입</a><span>|</span><a href="#" onclick="toggleMenu();return false;">사이트맵</a>`;
  }
}

(function initAuth() {
  document.getElementById('demoNote').style.display = Store.isServer ? 'none' : 'block';
  try {
    const saved = localStorage.getItem(SAVED_EMAIL_KEY);
    if (saved) document.getElementById('loginEmail').value = saved;
  } catch (e) {}
  const enter = (ids, fn) => ids.forEach(id => document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') fn(); }));
  enter(['loginEmail', 'loginPw'], loginUser);
  enter(['signupPw2'], signupUser);
  enter(['resetEmail'], requestPasswordReset);
  enter(['newPw2'], saveNewPassword);
  Store.onChange(renderAuthState);
  Store.onRecovery(() => navigate('#/login/update'));
  onRouteEnter('loginOverlay', i => showAuthPanel(i));
})();
