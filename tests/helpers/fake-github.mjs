/* 테스트용 가짜 GitHub API (메모리 저장소). createGitHub에 fetchImpl로 넣어 쓴다. */
import { createHash } from 'node:crypto';

export function createFakeGitHub(initialFiles = {}, repo = 'obyungsu-png/gounive') {
  let seq = 0;
  const sha = s => createHash('sha1').update(s + ':' + (seq++)).digest('hex');
  const branches = { main: { files: {}, commits: [] } };
  for (const [p, c] of Object.entries(initialFiles)) branches.main.files[p] = { content: c, sha: sha(c) };
  const calls = [];

  const json = (status, data) => ({
    ok: status >= 200 && status < 300, status,
    headers: new Map([['content-type', 'application/json']]),
    json: async () => data, text: async () => JSON.stringify(data)
  });

  async function fetchImpl(url, opts = {}) {
    const u = new URL(url);
    const prefix = `/repos/${repo}`;
    if (u.hostname !== 'api.github.com' || !u.pathname.startsWith(prefix)) return json(404, { message: 'Not Found' });
    const path = decodeURIComponent(u.pathname.slice(prefix.length));
    const method = opts.method || 'GET';
    calls.push(`${method} ${path}`);
    const body = opts.body ? JSON.parse(opts.body) : null;

    let m;
    if ((m = /^\/contents\/(.+)$/.exec(path))) {
      const file = m[1];
      if (method === 'GET') {
        const ref = u.searchParams.get('ref') || 'main';
        const br = branches[ref];
        let f = br && br.files[file];
        if (!br) {   // 커밋 sha로 읽기 (변경 이력 보기·되돌리기)
          const c = Object.values(branches).flatMap(x => x.commits).find(x => x.sha === ref && x.path === file);
          if (c) f = { content: c.content, sha: 'blob-' + c.sha };
        }
        if (!f) return json(404, { message: 'Not Found' });
        if ((opts.headers || {}).Accept === 'application/vnd.github.raw+json') return { ok: true, status: 200, text: async () => f.content };
        return json(200, { content: Buffer.from(f.content).toString('base64'), encoding: 'base64', sha: f.sha, size: f.content.length });
      }
      if (method === 'PUT') {
        const br = branches[body.branch || 'main'];
        if (!br) return json(404, { message: 'Branch not found' });
        const cur = br.files[file];
        if (cur && body.sha !== cur.sha) return json(409, { message: `${file} does not match ${body.sha}` });
        if (!cur && body.sha) return json(422, { message: 'sha wasn\'t supplied' });
        const content = Buffer.from(body.content, 'base64').toString('utf8');
        const fsha = sha(content);
        br.files[file] = { content, sha: fsha };
        const csha = sha('commit' + file);
        br.commits.unshift({ sha: csha, path: file, message: body.message, date: new Date().toISOString(), content });
        return json(200, { content: { sha: fsha }, commit: { sha: csha, html_url: `https://github.com/${repo}/commit/${csha}` } });
      }
    }
    if (path === '/commits' && method === 'GET') {
      const br = branches[u.searchParams.get('sha') || 'main'];
      const list = br.commits.filter(c => c.path === u.searchParams.get('path')).slice(0, Number(u.searchParams.get('per_page')) || 30);
      return json(200, list.map(c => ({ sha: c.sha, commit: { message: c.message, author: { date: c.date } }, html_url: `https://github.com/${repo}/commit/${c.sha}` })));
    }
    if ((m = /^\/git\/ref\/heads\/(.+)$/.exec(path)) && method === 'GET') {
      return branches[m[1]] ? json(200, { object: { sha: 'head-' + m[1] } }) : json(404, { message: 'Not Found' });
    }
    if (path === '/git/refs' && method === 'POST') {
      const name = body.ref.replace('refs/heads/', '');
      branches[name] = { files: JSON.parse(JSON.stringify(branches.main.files)), commits: [] };
      return json(201, { ref: body.ref });
    }
    return json(404, { message: 'Not Found' });
  }

  /* 특정 커밋 시점 내용 (복원 테스트용) */
  const fileAt = (file, commitSha, branch = 'main') => (branches[branch].commits.find(c => c.sha === commitSha && c.path === file) || {}).content;
  return { fetchImpl, branches, calls, fileAt };
}

/* 테스트용 가짜 외부 사이트: pages[url] = { type, body } */
export function createFakeWeb(pages) {
  return async function fetchImpl(url) {
    const p = pages[url];
    if (!p) return { ok: false, status: 404, headers: new Map(), arrayBuffer: async () => new ArrayBuffer(0) };
    if (p.throw) throw Object.assign(new Error('fetch failed'), { cause: { code: p.throw } });
    const buf = Buffer.from(p.body);
    return { ok: true, status: 200, headers: { get: k => (k.toLowerCase() === 'content-type' ? p.type : null) }, arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length) };
  };
}
