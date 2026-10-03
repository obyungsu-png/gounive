/* ===== 데모 로그인 (서버 연동 전: 이 브라우저에만 저장) ===== */
const USER_KEY = 'teukrye-demo-user';
const SAVED_ID_KEY = 'teukrye-saved-id';

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) { return null; }
}

function loginUser() {
  const id = document.getElementById('loginId').value.trim();
  const pw = document.getElementById('loginPw').value;
  const role = document.querySelector('input[name="loginRole"]:checked').value;
  const err = document.getElementById('loginError');
  if (id.length < 4) { err.textContent = '아이디를 4자 이상 입력해주세요.'; return; }
  if (pw.length < 4) { err.textContent = '비밀번호를 4자 이상 입력해주세요.'; return; }
  err.textContent = '';
  try {
    localStorage.setItem(USER_KEY, JSON.stringify({ id, role }));
    if (document.getElementById('loginSaveId').checked) localStorage.setItem(SAVED_ID_KEY, id);
    else localStorage.removeItem(SAVED_ID_KEY);
  } catch (e) {}
  document.getElementById('loginPw').value = '';
  renderAuthState();
  showHome();
  showToast(`${id}님, 로그인되었습니다. (데모)`);
}

function logoutUser() {
  try { localStorage.removeItem(USER_KEY); } catch (e) {}
  renderAuthState();
  showToast('로그아웃되었습니다.');
}

function renderAuthState() {
  const user = getCurrentUser();
  document.getElementById('loginBeforeBox').style.display = user ? 'none' : 'flex';
  document.getElementById('loginAfterBox').style.display = user ? 'block' : 'none';
  const links = document.getElementById('topLinks');
  document.getElementById('menuLoginLink').textContent = user ? `${user.id}님 · 마이페이지 ›` : '로그인해주세요 ›';
  if (user) {
    document.getElementById('profileName').textContent = user.id;
    document.getElementById('profileRole').textContent = user.role;
    links.innerHTML = `<a href="#" onclick="openPage('gradeOverlay');return false;"><b>${user.id}</b>님</a><span>|</span><a href="#" onclick="logoutUser();return false;">로그아웃</a><span>|</span><a href="#" onclick="toggleMenu();return false;">사이트맵</a>`;
  } else {
    links.innerHTML = `<a href="#" onclick="openPage('loginOverlay');return false;">로그인</a><span>|</span><a href="#" onclick="showToast('회원가입은 서버 연동 후 제공됩니다.');return false;">회원가입</a><span>|</span><a href="#" onclick="toggleMenu();return false;">사이트맵</a>`;
  }
}

(function initAuth() {
  try {
    const saved = localStorage.getItem(SAVED_ID_KEY);
    if (saved) document.getElementById('loginId').value = saved;
  } catch (e) {}
  ['loginId', 'loginPw'].forEach(id => document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') loginUser(); }));
  renderAuthState();
})();
