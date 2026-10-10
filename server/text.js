/* ===== 참조 사이트 변경 감지용 텍스트 처리 =====
   HTML → 줄 단위 텍스트 → 줄마다 짧은 해시. 이전 해시 목록과 비교해 '새로 생긴 줄'을 찾는다.
   (이전 원문 전체를 저장하지 않아 상태 파일이 작다) */
import { createHash } from 'node:crypto';

const ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", middot: '·', hellip: '…', ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”' };

export function htmlToText(html) {
  return String(html)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|iframe|template)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(br|hr)\b[^>]*>/gi, '\n')
    .replace(/<\/?(p|div|li|ul|ol|tr|table|thead|tbody|h[1-6]|section|article|header|footer|nav|dd|dt|dl|option|select|form|label|td|th)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#') {
        const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : ' ';
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    });
}

/* 비교할 줄 목록: 공백 정리, 너무 짧거나 매번 바뀌는 줄(시계·방문자 수 등) 제외, 중복 제거 */
const VOLATILE = [
  /^\d{1,2}:\d{2}(:\d{2})?$/,                       // 시각만 있는 줄
  /(today|total|방문자|접속자)\s*[:：]?\s*[\d,]+/i,   // 방문자 수
  /^(copyright|ⓒ|©)/i
];
export function toLines(text) {
  const seen = new Set();
  const out = [];
  for (const raw of String(text).split('\n')) {
    const line = raw.replace(/\s+/g, ' ').trim();
    if (line.length < 2 || VOLATILE.some(re => re.test(line)) || seen.has(line)) continue;
    seen.add(line);
    out.push(line);
  }
  return out;
}

export const lineHash = line => createHash('sha1').update(line).digest('base64url').slice(0, 8);
export const contentHash = data => createHash('sha256').update(data).digest('hex');

/* 이전 줄 해시 목록과 비교 → 새로 생긴 줄(원문), 없어진 줄 수 */
export function diffLines(prevHashes, lines, maxShown = 60) {
  const prev = new Set(prevHashes || []);
  const now = new Set();
  const added = [];
  for (const line of lines) {
    const h = lineHash(line);
    now.add(h);
    if (!prev.has(h)) added.push(line);
  }
  let removed = 0;
  prev.forEach(h => { if (!now.has(h)) removed++; });
  return { added: added.slice(0, maxShown), addedCount: added.length, removedCount: removed };
}
