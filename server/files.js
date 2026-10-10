/* ===== CMS가 고칠 수 있는 파일 (허용 목록) =====
   이 목록 밖의 파일(코드·설정·api 등)은 CMS로 바꿀 수 없다. */
const ALLOWED = [
  /^src\/data\/[a-z0-9-]+\.json$/,
  /^src\/partials\/(pages|layout|modals)\/[a-z0-9-]+\.html$/,
  /^src\/partials\/home\.html$/,
  /^cms\/sources\.json$/
];

export function isAllowedPath(path) {
  return typeof path === 'string' && !path.includes('..') && ALLOWED.some(re => re.test(path));
}

/* 저장 전 형식 검사: JSON은 파싱되어야 하고, HTML은 비어 있으면 안 됨 */
export function validateContent(path, content) {
  if (typeof content !== 'string') return '내용이 비어 있습니다.';
  if (content.length > 900 * 1024) return '파일이 너무 큽니다 (900KB 이하).';
  if (path.endsWith('.json')) {
    try { JSON.parse(content); } catch (e) { return 'JSON 형식이 올바르지 않습니다: ' + e.message; }
  } else if (!content.trim()) return 'HTML 내용이 비어 있습니다.';
  return null;
}
