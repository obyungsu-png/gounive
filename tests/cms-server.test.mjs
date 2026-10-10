/* CMS 서버 테스트: npm test (가짜 GitHub · 가짜 외부 사이트 · 가짜 Claude API 사용, 네트워크 없음) */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleCms } from '../server/cms.js';
import { verifyPassword } from '../server/auth.js';
import { isAllowedPath } from '../server/files.js';
import { htmlToText, toLines, diffLines, lineHash } from '../server/text.js';
import { createFakeGitHub, createFakeWeb } from './helpers/fake-github.mjs';

// 실제 기본 비밀번호는 저장소(공개)에 적지 않음 → 테스트는 CMS_PASSWORD로 바꾼 값을 사용
const PW = 'test-pass';
const ENV = { GITHUB_TOKEN: 'test-token', CMS_PASSWORD: PW };
const ADM = { year: 2027, univs: [], rows: [{ univ: '연세대학교(서울)', type: '3년', name: '재외국민전형', quota: '71명', method: '서류', tags: ['서류'], schedule: '원서 7.6~7.8', url: 'https://univ.example/guide', source: '연세대 모집요강' }] };
const LIB = [{ cat: '모집요강', year: '2027', title: '자료 PDF', desc: '', org: 'x', url: 'https://univ.example/file.pdf', kind: 'pdf' }];
const SOURCES = [{ group: 'OKEP', title: '모집요강 게시판', url: 'https://okep.example/board' }];

function setup(pages = {}) {
  const gh = createFakeGitHub({
    'src/data/teukrye-admissions.json': JSON.stringify(ADM),
    'src/data/library.json': JSON.stringify(LIB),
    'src/data/home.json': JSON.stringify({ banners: [], notices: [], newsTabs: [] }),
    'cms/sources.json': JSON.stringify(SOURCES),
    'src/partials/pages/en.html': '<div>en</div>'
  });
  const web = { ...pages };
  const webFetch = createFakeWeb(web);
  const anthropic = { requests: [], reply: null };
  const fetchImpl = async (url, opts) => {
    const host = new URL(url).hostname;
    if (host === 'api.github.com') return gh.fetchImpl(url, opts);
    if (host === 'api.anthropic.com') {
      anthropic.requests.push({ url, headers: new Headers(opts.headers), body: JSON.parse(opts.body) });
      return new Response(JSON.stringify(anthropic.reply), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return webFetch(url, opts);
  };
  const call = (body, env = ENV) => handleCms(body, { env, fetchImpl });
  return { gh, web, call, anthropic };
}

async function login(call, env = ENV) {
  const r = await call({ action: 'login', password: PW }, env);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return r.body.token;
}

test('비밀번호: 맞는 값만 통과, 환경변수로 바꿀 수 있음', () => {
  assert.equal(verifyPassword('', {}), false);
  assert.equal(verifyPassword('wrong-guess', {}), false);
  assert.equal(verifyPassword('new-pass', { CMS_PASSWORD: 'new-pass' }), true);
  assert.equal(verifyPassword('NEW-PASS', { CMS_PASSWORD: 'new-pass' }), false);
  // 기본 비밀번호(코드에는 해시만 있음)는 값을 아는 사람이 CMS_TEST_DEFAULT_PASSWORD로 넘겨 확인
  const real = process.env.CMS_TEST_DEFAULT_PASSWORD;
  if (real) {
    assert.equal(verifyPassword(real, {}), true);
    assert.equal(verifyPassword(real.toUpperCase(), {}), false);
    assert.equal(verifyPassword(real, { CMS_PASSWORD: 'other' }), false);
  }
});

test('허용 경로: 데이터·화면 HTML만, 코드·설정은 불가', () => {
  for (const p of ['src/data/home.json', 'src/partials/pages/en.html', 'src/partials/home.html', 'src/partials/layout/footer.html', 'cms/sources.json']) assert.ok(isAllowedPath(p), p);
  for (const p of ['vercel.json', 'api/cms.js', 'server/auth.js', 'src/js/router.js', 'src/data/../../vercel.json', 'package.json', 'index.html']) assert.ok(!isAllowedPath(p), p);
});

test('로그인: 서버 설정 없음 / 틀린 비밀번호 / 토큰 없이 요청', async () => {
  const { call } = setup();
  assert.equal((await call({ action: 'status' }, {})).body.features.configured, false);
  assert.equal((await call({ action: 'login', password: PW }, { CMS_PASSWORD: PW })).status, 503);
  assert.equal((await call({ action: 'login', password: 'wrong' })).status, 401);
  assert.equal((await call({ action: 'get', path: 'src/data/home.json' })).status, 401);
  assert.equal((await call({ action: 'get', path: 'src/data/home.json', token: 'x.y' })).status, 401);
});

test('파일 읽기·저장·충돌·이력', async () => {
  const { call, gh } = setup();
  const token = await login(call);
  assert.equal((await call({ action: 'get', path: 'vercel.json', token })).status, 400);
  const f = await call({ action: 'get', path: 'src/data/home.json', token });
  assert.equal(f.status, 200);
  assert.deepEqual(JSON.parse(f.body.content).banners, []);

  const bad = await call({ action: 'save', path: 'src/data/home.json', content: '{oops', sha: f.body.sha, token });
  assert.equal(bad.status, 400);
  assert.match(bad.body.error, /JSON/);

  const next = JSON.stringify({ banners: [{ title: '새 배너' }], notices: [], newsTabs: [] });
  const saved = await call({ action: 'save', path: 'src/data/home.json', content: next, sha: f.body.sha, message: '배너 추가', token });
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.equal(gh.branches.main.files['src/data/home.json'].content, next);

  const stale = await call({ action: 'save', path: 'src/data/home.json', content: next, sha: f.body.sha, token });
  assert.equal(stale.status, 409);
  assert.match(stale.body.error, /먼저 수정/);

  const hist = await call({ action: 'history', path: 'src/data/home.json', token });
  assert.equal(hist.body.commits.length, 1);
  assert.equal(hist.body.commits[0].message, 'CMS: 배너 추가');
  assert.equal(gh.fileAt('src/data/home.json', hist.body.commits[0].sha), next);
});

test('텍스트 추출과 줄 비교', () => {
  const t = htmlToText('<html><script>var a=1</script><style>p{}</style><p>공지&nbsp;1 &amp; 2</p><div>2028학년도 &#47784;집요강</div><!-- x --></html>');
  const lines = toLines(t);
  assert.deepEqual(lines, ['공지 1 & 2', '2028학년도 모집요강']);
  const d = diffLines(['공지 1 & 2', '삭제된 줄'].map(lineHash), [...lines, '새 공지']);
  assert.deepEqual(d.added, ['2028학년도 모집요강', '새 공지']);
  assert.equal(d.removedCount, 1);
});

test('참조 사이트 확인: 처음은 기준점, 바뀌면 새 줄과 함께 검토 목록에, 결정 저장', async () => {
  const page = body => ({ type: 'text/html; charset=utf-8', body: `<html><body><ul>${body}</ul></body></html>` });
  const { call, web, gh } = setup({
    'https://okep.example/board': page('<li>2027 모집요강</li>'),
    'https://univ.example/guide': page('<p>모집인원 71명</p>'),
    'https://univ.example/file.pdf': { type: 'application/pdf', body: '%PDF-1.4 v1' }
  });
  const token = await login(call);

  const first = await call({ action: 'check', offset: 0, limit: 10, token });
  assert.equal(first.status, 200, JSON.stringify(first.body));
  assert.equal(first.body.total, 3);
  assert.deepEqual(first.body.results.map(r => r.result), ['baseline', 'baseline', 'baseline']);
  assert.ok(gh.branches['cms-state'], '상태 브랜치 생성');
  assert.ok(!gh.branches.main.files['cms-state/state.json'], '상태 파일은 main에 쓰지 않음');

  // 바뀐 내용
  web['https://okep.example/board'] = page('<li>2027 모집요강</li><li>2028학년도 연세대 재외국민 모집요강</li>');
  web['https://univ.example/file.pdf'] = { type: 'application/pdf', body: '%PDF-1.4 version two' };
  web['https://univ.example/guide'] = { throw: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' };

  // 두 번에 나눠 확인 (화면에서 하는 방식)
  const a = await call({ action: 'check', offset: 0, limit: 2, token });
  assert.equal(a.body.next, 2);
  const b = await call({ action: 'check', offset: 2, limit: 2, token });
  assert.equal(b.body.next, null);
  const all = [...a.body.results, ...b.body.results];
  assert.deepEqual(all.map(r => r.result), ['changed', 'error', 'changed']);
  assert.match(all[1].message, /인증서/);

  const list = await call({ action: 'updates', token });
  const pending = list.body.updates.filter(u => u.status === 'pending');
  assert.equal(pending.length, 2);
  const html = pending.find(u => u.kind === 'html');
  assert.deepEqual(html.added, ['2028학년도 연세대 재외국민 모집요강']);
  const pdf = pending.find(u => u.kind === 'file');
  assert.ok(pdf.sizeTo > pdf.sizeFrom);

  const d = await call({ action: 'decide', id: html.id, decision: 'referenced', note: '2028 요강 나오면 반영', token });
  assert.equal(d.body.update.status, 'referenced');
  assert.equal((await call({ action: 'decide', id: html.id, decision: 'delete-all', token })).status, 400);
  const after = await call({ action: 'updates', token });
  assert.equal(after.body.updates.find(u => u.id === html.id).note, '2028 요강 나오면 반영');

  // 같은 내용으로 다시 확인하면 새 항목이 생기지 않음
  web['https://univ.example/guide'] = page('<p>모집인원 71명</p>');
  const again = await call({ action: 'check', offset: 0, limit: 10, token });
  assert.deepEqual(again.body.results.map(r => r.result), ['same', 'same', 'same']);
});

test('AI 제안: 키 없으면 안내, 있으면 Claude 요청 형식 확인', async () => {
  const page = body => ({ type: 'text/html', body: `<p>${body}</p>` });
  const { call, web, anthropic } = setup({ 'https://okep.example/board': page('a'), 'https://univ.example/guide': page('모집인원 71명'), 'https://univ.example/file.pdf': { type: 'application/pdf', body: '%PDF-1' } });
  const token = await login(call);
  await call({ action: 'check', offset: 0, limit: 10, token });
  web['https://univ.example/guide'] = page('모집인원 72명');
  await call({ action: 'check', offset: 0, limit: 10, token });
  const id = (await call({ action: 'updates', token })).body.updates[0].id;

  assert.equal((await call({ action: 'ai', id, token })).status, 400);

  const env = { ...ENV, ANTHROPIC_API_KEY: 'sk-test' };
  const token2 = await login(call, env);
  const suggestion = { summary: '모집인원이 71명에서 72명으로 바뀌었습니다.', importance: 'high', recommendation: 'apply', reason: '정원 변경', suggestions: [{ file: 'src/data/teukrye-admissions.json', match: '연세대학교(서울)|3년', field: 'quota', current: '71명', proposed: '72명', why: '모집요강 페이지' }] };
  anthropic.reply = { id: 'msg_1', type: 'message', role: 'assistant', model: 'claude-opus-5-5', content: [{ type: 'text', text: JSON.stringify(suggestion) }], stop_reason: 'end_turn', usage: { input_tokens: 10, output_tokens: 10 } };
  const r = await call({ action: 'ai', id, token: token2 }, env);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.deepEqual(r.body.suggestion, suggestion);
  const req = anthropic.requests[0];
  assert.equal(req.body.model, 'claude-opus-5-5');
  assert.equal(req.body.fallbacks, 'default');
  assert.equal(req.body.output_config.format.type, 'json_schema');
  assert.match(req.headers.get('anthropic-beta'), /server-side-fallback-2026-07-01/);
  assert.match(req.body.messages[0].content, /모집인원 72명/);
  assert.match(req.body.messages[0].content, /"quota": "71명"/);

  anthropic.reply = { ...anthropic.reply, content: [], stop_reason: 'refusal' };
  assert.equal((await call({ action: 'ai', id, token: token2 }, env)).status, 422);
});

test('CMS 저장 형식: 모든 데이터 파일이 내용 그대로 다시 읽힘', async () => {
  const { formatJson } = await import('../src/js/cms/format.js');
  const fs = await import('node:fs');
  const files = ['home', 'teukrye-admissions', 'library', 'institutions', 'site'].map(n => `src/data/${n}.json`).concat('cms/sources.json');
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8'));
    const out = formatJson(data);
    assert.deepEqual(JSON.parse(out), data, f);
    if (Array.isArray(data) || Object.values(data).some(Array.isArray)) assert.ok(out.split('\n').length > 3, f + ' 목록은 줄 단위');
  }
});
