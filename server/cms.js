/* ===== CMS 요청 처리 (api/cms.js에서 호출) =====
   POST /api/cms  { action, token?, ...값 }  →  { ok: true, ... } 또는 { ok: false, error } */
import { verifyPassword, issueToken, verifyToken } from './auth.js';
import { createGitHub } from './github.js';
import { isAllowedPath, validateContent } from './files.js';
import { runCheck, listUpdates, decideUpdate, getUpdate } from './sources.js';
import { aiSuggest, aiTest } from './ai.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function handleCms(body, { env = {}, fetchImpl = fetch } = {}) {
  const action = body && body.action;
  const configured = !!env.GITHUB_TOKEN;
  const aiVia = env.ANTHROPIC_BASE_URL ? (() => { try { return new URL(env.ANTHROPIC_BASE_URL).host; } catch (e) { return '주소 오류'; } })() : 'api.anthropic.com';
  const features = { configured, ai: !!env.ANTHROPIC_API_KEY, aiVia, repo: env.GITHUB_REPO || 'obyungsu-png/gounive' };

  if (action === 'status') return ok({ features });

  if (action === 'login') {
    if (!verifyPassword(body.password, env)) { await sleep(1000); return fail(401, '비밀번호가 올바르지 않습니다.'); }
    if (!configured) return fail(503, '비밀번호는 맞지만 서버 설정이 끝나지 않았습니다. Vercel 환경변수 GITHUB_TOKEN을 등록해 주세요.', { features });
    return ok({ ...issueToken(env), features });
  }

  if (!configured) return fail(503, '서버 설정이 없습니다: Vercel 환경변수 GITHUB_TOKEN을 등록해 주세요.');
  if (!verifyToken(body.token, env)) return fail(401, '로그인이 만료되었습니다. 다시 로그인해 주세요.');

  const gh = createGitHub({ token: env.GITHUB_TOKEN, repo: features.repo, branch: env.GITHUB_BRANCH || 'main', fetchImpl });
  const needPath = () => { if (!isAllowedPath(body.path)) throw Object.assign(new Error('CMS로 수정할 수 없는 파일입니다.'), { status: 400 }); return body.path; };

  try {
    switch (action) {
      case 'get': {
        const f = await gh.getFile(needPath(), body.ref || undefined);
        if (!f) return fail(404, '파일이 없습니다.');
        return ok(f);
      }
      case 'save': {
        const path = needPath();
        const problem = validateContent(path, body.content);
        if (problem) return fail(400, problem);
        const message = `CMS: ${String(body.message || path).slice(0, 120)}`;
        return ok(await gh.putFile(path, body.content, { sha: body.sha, message }));
      }
      case 'history': return ok({ commits: await gh.listCommits(needPath()) });
      case 'check': return ok(await runCheck(gh, { offset: Number(body.offset) || 0, limit: Math.min(Number(body.limit) || 6, 10), fetchImpl }));
      case 'updates': return ok(await listUpdates(gh));
      case 'decide': return ok({ update: await decideUpdate(gh, body) });
      case 'ai': {
        if (!features.ai) return fail(400, 'AI 기능을 쓰려면 Vercel 환경변수 ANTHROPIC_API_KEY를 등록해 주세요.');
        const update = await getUpdate(gh, body.id);
        if (!update) return fail(404, '업데이트 항목을 찾을 수 없습니다.');
        return ok(await aiSuggest(update, { gh, env, fetchImpl }));
      }
      case 'aiTest': {
        if (!features.ai) return fail(400, 'AI 기능을 쓰려면 Vercel 환경변수 ANTHROPIC_API_KEY를 등록해 주세요.');
        return ok(await aiTest({ env, fetchImpl }));
      }
      default: return fail(400, '알 수 없는 요청입니다.');
    }
  } catch (e) {
    return fail(e.status >= 400 && e.status < 600 ? e.status : 500, e.message || '처리 중 오류가 발생했습니다.');
  }
}

function ok(data) { return { status: 200, body: { ok: true, ...data } }; }
function fail(status, error, extra = {}) { return { status, body: { ok: false, error, ...extra } }; }
