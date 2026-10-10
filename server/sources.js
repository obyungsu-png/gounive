/* ===== 참조 사이트 업데이트 확인 =====
   - 확인할 주소: cms/sources.json + 특례전형 데이터의 모집요강 링크 + 자료실 링크 (중복 제거)
   - 'CMS → 업데이트 확인'에서 버튼을 눌렀을 때만 실행 (자동 반영 없음)
   - 상태(마지막으로 본 내용의 줄 해시, 감지된 업데이트, 결정)는 cms-state 브랜치의 파일에 저장
     → 사이트 배포에 영향 없음 (vercel.json에서 cms-state 브랜치 배포 끔) */
import { createHash } from 'node:crypto';
import { htmlToText, toLines, lineHash, contentHash, diffLines } from './text.js';

export const STATE_BRANCH = 'cms-state';
export const STATE_PATH = 'cms-state/state.json';
const MAX_LINES = 1500;
const MAX_DECIDED = 150;

const sourceId = url => createHash('sha1').update(url).digest('hex').slice(0, 10);

/* 확인할 주소 목록 만들기 */
export async function buildSources(gh) {
  const read = async path => { const f = await gh.getFile(path); return f ? JSON.parse(f.content) : null; };
  const [extra, adm, lib] = await Promise.all([read('cms/sources.json'), read('src/data/teukrye-admissions.json'), read('src/data/library.json')]);
  const list = [];
  const seen = new Set();
  const add = (url, title, group) => {
    if (!url || !/^https?:\/\//.test(url) || seen.has(url)) return;
    seen.add(url);
    list.push({ id: sourceId(url), url, title, group });
  };
  (extra || []).forEach(s => add(s.url, s.title, s.group || '참조 사이트'));
  ((adm && adm.rows) || []).forEach(r => add(r.url, `${r.univ} ${r.type} 특례 · ${r.source || '모집요강'}`, '특례전형 모집요강'));
  (lib || []).forEach(it => add(it.url, it.title, '자료실'));
  return list;
}

function decode(buf, contentType) {
  const head = buf.subarray(0, 2048).toString('latin1');
  const m = /charset=["']?([\w-]+)/i.exec(contentType || '') || /<meta[^>]+charset=["']?([\w-]+)/i.exec(head);
  const charset = m ? m[1].toLowerCase() : 'utf-8';
  try { return new TextDecoder(charset).decode(buf); } catch (e) { return buf.toString('utf8'); }
}

/* 주소 1개 가져오기 → HTML이면 줄 목록, 파일(PDF 등)이면 해시·크기 */
export async function fetchSource(url, fetchImpl = fetch, timeoutMs = 20000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      redirect: 'follow', signal: ctl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; gounive-cms/1.0; +https://gounive.vercel.app)', Accept: 'text/html,application/pdf,*/*' }
    });
    if (!res.ok) return { error: `접속 실패 (HTTP ${res.status})` };
    const type = res.headers.get('content-type') || '';
    const buf = Buffer.from(await res.arrayBuffer());
    const isPdf = /pdf/i.test(type) || buf.subarray(0, 5).toString('latin1') === '%PDF-';
    if (!isPdf && /html|text|xml/i.test(type)) {
      const lines = toLines(htmlToText(decode(buf, type))).slice(0, MAX_LINES);
      return { kind: 'html', lines, hash: contentHash(lines.join('\n')), size: buf.length };
    }
    return { kind: 'file', hash: contentHash(buf), size: buf.length };
  } catch (e) {
    const cause = (e && e.cause && (e.cause.code || e.cause.message)) || '';
    if (e.name === 'AbortError') return { error: '응답 시간 초과' };
    if (/CERT|SSL|TLS|certificate|VERIFY|ISSUER|SIGNATURE/i.test(cause + ' ' + e.message)) return { error: '사이트 보안 인증서 문제로 접속할 수 없음' };
    return { error: '접속 실패 ' + (cause || e.message) };
  } finally {
    clearTimeout(timer);
  }
}

export async function loadState(gh) {
  await gh.ensureBranch(STATE_BRANCH);
  const f = await gh.getFile(STATE_PATH, STATE_BRANCH);
  const state = f ? JSON.parse(f.content) : { version: 1, sources: {}, updates: [] };
  return { state, sha: f ? f.sha : null };
}

export async function saveState(gh, state, sha, message) {
  // 결정이 끝난 항목은 최근 것만 보관
  const pending = state.updates.filter(u => u.status === 'pending');
  const decided = state.updates.filter(u => u.status !== 'pending').slice(-MAX_DECIDED);
  state.updates = [...decided, ...pending].sort((a, b) => a.detectedAt.localeCompare(b.detectedAt));
  return gh.putFile(STATE_PATH, JSON.stringify(state), { sha, message, ref: STATE_BRANCH });
}

/* offset부터 limit개 주소를 확인 (함수 실행 시간 제한 때문에 화면에서 여러 번 나눠 호출) */
export async function runCheck(gh, { offset = 0, limit = 6, fetchImpl = fetch, now = new Date() } = {}) {
  const sources = await buildSources(gh);
  const batch = sources.slice(offset, offset + limit);
  const { state, sha } = await loadState(gh);
  const at = now.toISOString();
  const fetched = await Promise.all(batch.map(s => fetchSource(s.url, fetchImpl)));
  const results = [];
  batch.forEach((s, i) => {
    const r = fetched[i];
    const prev = state.sources[s.id];
    const base = { id: s.id, url: s.url, title: s.title, group: s.group };
    if (r.error) {
      state.sources[s.id] = { ...(prev || {}), url: s.url, title: s.title, group: s.group, checkedAt: at, error: r.error };
      results.push({ ...base, result: 'error', message: r.error });
      return;
    }
    const snap = { url: s.url, title: s.title, group: s.group, kind: r.kind, hash: r.hash, size: r.size, checkedAt: at, changedAt: prev ? prev.changedAt : at, error: null,
      lineHashes: r.kind === 'html' ? r.lines.map(lineHash) : undefined };
    if (!prev || !prev.hash) {
      state.sources[s.id] = snap;
      results.push({ ...base, result: 'baseline' });
      return;
    }
    if (prev.hash === r.hash) {
      state.sources[s.id] = { ...snap, changedAt: prev.changedAt };
      results.push({ ...base, result: 'same' });
      return;
    }
    const update = { id: `${s.id}-${now.getTime()}`, sourceId: s.id, url: s.url, title: s.title, group: s.group, kind: r.kind, detectedAt: at, status: 'pending', note: '', decidedAt: null };
    if (r.kind === 'html' && prev.kind === 'html') {
      const d = diffLines(prev.lineHashes, r.lines);
      if (!d.addedCount && !d.removedCount) {               // 줄 순서만 바뀜 → 알리지 않음
        state.sources[s.id] = { ...snap, changedAt: prev.changedAt };
        results.push({ ...base, result: 'same' });
        return;
      }
      Object.assign(update, d);
    } else {
      Object.assign(update, { sizeFrom: prev.size, sizeTo: r.size });
    }
    state.updates.push(update);
    state.sources[s.id] = { ...snap, changedAt: at };
    results.push({ ...base, result: 'changed', updateId: update.id });
  });
  const saved = await saveState(gh, state, sha, `CMS 참조 사이트 확인 ${offset + 1}~${offset + batch.length}/${sources.length}`);
  return { total: sources.length, offset, next: offset + batch.length < sources.length ? offset + batch.length : null, results, stateSha: saved.sha };
}

export async function listUpdates(gh) {
  const { state } = await loadState(gh);
  const sources = Object.entries(state.sources).map(([id, s]) => ({ id, url: s.url, title: s.title, group: s.group, kind: s.kind, checkedAt: s.checkedAt, changedAt: s.changedAt, error: s.error }));
  return { updates: state.updates.slice().reverse(), sources };
}

const DECISIONS = ['applied', 'referenced', 'ignored', 'pending'];
export async function decideUpdate(gh, { id, decision, note = '' }, now = new Date()) {
  if (!DECISIONS.includes(decision)) throw Object.assign(new Error('알 수 없는 결정입니다.'), { status: 400 });
  const { state, sha } = await loadState(gh);
  const u = state.updates.find(x => x.id === id);
  if (!u) throw Object.assign(new Error('업데이트 항목을 찾을 수 없습니다.'), { status: 404 });
  u.status = decision;
  u.note = String(note).slice(0, 500);
  u.decidedAt = decision === 'pending' ? null : now.toISOString();
  await saveState(gh, state, sha, `CMS 업데이트 결정: ${u.title} → ${decision}`);
  return u;
}

export async function getUpdate(gh, id) {
  const { state } = await loadState(gh);
  return state.updates.find(x => x.id === id) || null;
}
