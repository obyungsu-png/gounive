/* ===== CMS 서버 호출 (POST /api/cms) — 로그인 토큰은 이 탭(sessionStorage)에만 보관 ===== */
const TOKEN_KEY = 'gounive-cms-token';

export const session = {
  get() { try { const t = JSON.parse(sessionStorage.getItem(TOKEN_KEY)); return t && t.expires > Date.now() ? t : null; } catch (e) { return null; } },
  set(t) { try { sessionStorage.setItem(TOKEN_KEY, JSON.stringify(t)); } catch (e) {} },
  clear() { try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {} }
};

export class CmsError extends Error {
  constructor(message, status, extra = {}) { super(message); this.status = status; Object.assign(this, extra); }
}

export async function cms(action, data = {}) {
  const t = session.get();
  let res;
  try {
    res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, token: t && t.token, ...data })
    });
  } catch (e) {
    throw new CmsError('CMS 서버에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.', 0);
  }
  let body = null;
  try { body = await res.json(); } catch (e) { /* 서버 함수가 없는 환경 (로컬 미리보기 등) */ }
  if (!body) throw new CmsError('CMS 서버가 응답하지 않습니다. 배포된 사이트(gounive.vercel.app)에서 이용해 주세요.', res.status);
  if (!body.ok) {
    if (res.status === 401 && action !== 'login') session.clear();
    throw new CmsError(body.error || '요청을 처리하지 못했습니다.', res.status, body);
  }
  return body;
}
