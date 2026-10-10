/* ===== CMS 저장 형식 =====
   (브라우저·테스트 공용, CSS를 불러오지 않는 모듈) */
/* 저장 형식: 목록은 한 줄에 한 항목 (기존 파일 형식과 같게, 변경 비교가 쉬움) */
export function formatJson(value, depth = 0) {
  const pad = '  '.repeat(depth + 1);
  const end = '  '.repeat(depth);
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    if (value.every(v => v && typeof v === 'object' && !Array.isArray(v))) return `[\n${value.map(v => pad + JSON.stringify(v)).join(',\n')}\n${end}]`;
    return JSON.stringify(value);
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    if (!keys.length) return '{}';
    return `{\n${keys.map(k => `${pad}${JSON.stringify(k)}: ${formatJson(value[k], depth + 1)}`).join(',\n')}\n${end}}`;
  }
  return JSON.stringify(value);
}
