/* ===== GitHub 저장소 읽기·쓰기 (Contents API) =====
   CMS에서 게시하면 이 모듈이 저장소에 커밋하고, Vercel이 자동으로 다시 배포한다.
   fetch는 테스트에서 가짜로 바꿀 수 있게 주입받는다. */
const API = 'https://api.github.com';

export function createGitHub({ token, repo, branch = 'main', fetchImpl = fetch }) {
  if (!token) throw new Error('서버 설정이 없습니다: Vercel 환경변수 GITHUB_TOKEN을 등록해 주세요.');
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'gounive-cms'
  };

  async function call(method, path, body) {
    const res = await fetchImpl(`${API}/repos/${repo}${path}`, {
      method, headers: body ? { ...headers, 'Content-Type': 'application/json' } : headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(githubMessage(res.status, data));
      err.status = res.status;
      throw err;
    }
    return data;
  }

  const enc = s => Buffer.from(s, 'utf8').toString('base64');
  const dec = b64 => Buffer.from(b64 || '', 'base64').toString('utf8');
  const q = path => path.split('/').map(encodeURIComponent).join('/');

  return {
    repo, branch,
    /* 파일 읽기 → { content, sha } (없으면 null) */
    async getFile(path, ref = branch) {
      try {
        const d = await call('GET', `/contents/${q(path)}?ref=${encodeURIComponent(ref)}`);
        if (d.encoding === 'none' || (!d.content && d.size > 0)) {   // 1MB 넘는 파일은 원문으로 다시 받기
          const raw = await fetchImpl(`${API}/repos/${repo}/contents/${q(path)}?ref=${encodeURIComponent(ref)}`, { headers: { ...headers, Accept: 'application/vnd.github.raw+json' } });
          return { content: await raw.text(), sha: d.sha };
        }
        return { content: dec(d.content), sha: d.sha };
      } catch (e) {
        if (e.status === 404) return null;
        throw e;
      }
    },
    /* 파일 쓰기(커밋). sha가 다르면 409 → 다른 곳에서 먼저 바뀐 것 */
    async putFile(path, content, { sha, message, ref = branch } = {}) {
      const d = await call('PUT', `/contents/${q(path)}`, { message, content: enc(content), sha: sha || undefined, branch: ref });
      return { sha: d.content.sha, commit: d.commit.sha, url: d.commit.html_url };
    },
    async listCommits(path, ref = branch, perPage = 15) {
      const list = await call('GET', `/commits?sha=${encodeURIComponent(ref)}&path=${encodeURIComponent(path)}&per_page=${perPage}`);
      return list.map(c => ({ sha: c.sha, message: c.commit.message.split('\n')[0], date: c.commit.author.date, url: c.html_url }));
    },
    /* 상태 저장용 브랜치가 없으면 기본 브랜치에서 만든다 */
    async ensureBranch(name) {
      try { await call('GET', `/git/ref/heads/${encodeURIComponent(name)}`); return false; }
      catch (e) {
        if (e.status !== 404) throw e;
        const base = await call('GET', `/git/ref/heads/${encodeURIComponent(branch)}`);
        await call('POST', '/git/refs', { ref: `refs/heads/${name}`, sha: base.object.sha });
        return true;
      }
    }
  };
}

function githubMessage(status, data) {
  const m = (data && data.message) || '';
  if (status === 401) return 'GitHub 토큰이 올바르지 않거나 만료되었습니다 (GITHUB_TOKEN 확인).';
  if (status === 403) return 'GitHub 토큰에 저장소 쓰기 권한이 없습니다 (Contents: Read and write).';
  if (status === 404) return '저장소나 파일을 찾을 수 없습니다 (GITHUB_REPO 확인).';
  if (status === 409) return '다른 곳에서 먼저 수정되었습니다. 새로고침해서 최신 내용으로 다시 편집해 주세요.';
  if (status === 422) return '저장 요청이 거부되었습니다: ' + m;
  return `GitHub 오류 (${status}) ${m}`;
}
