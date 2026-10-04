/* ===== 3년 특례 체류 요건 계산 규칙 (화면과 무관한 순수 함수) =====
   - 학년 단위(학기 개시일 ~ 다음 학년도 같은 날 전일)마다 학생 3/4, 부모 2/3 이상 해외 체류
   - 필요 일수는 소수점 이하 절사, 중·고교 3개 학년 이상 + 고교 1개 학년 이상 포함
   - 날짜는 UTC '일 번호'로 계산해 서머타임·시간대 영향을 받지 않음 */
const DAY = 86400000;
export const GRADES = ['중1', '중2', '중3', '고1', '고2', '고3'];
const HIGH = ['고1', '고2', '고3'];
export const PEOPLE = [
  { key: 'student', label: '학생', ratio: [3, 4] },
  { key: 'father', label: '아버지', ratio: [2, 3] },
  { key: 'mother', label: '어머니', ratio: [2, 3] }
];

/* ---------- 순수 계산 함수 ---------- */
export function toDay(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str || '')) return null;
  const [y, m, d] = str.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d);
  return new Date(t).getUTCDate() === d ? Math.round(t / DAY) : null;
}
export function fromDay(n) { return new Date(n * DAY).toISOString().slice(0, 10); }

/* 학년 종료일 = 다음 해 같은 날의 전날 */
export function defaultYearEnd(startStr) {
  const s = toDay(startStr);
  if (s === null) return '';
  const d = new Date(s * DAY);
  return fromDay(Math.round(Date.UTC(d.getUTCFullYear() + 1, d.getUTCMonth(), d.getUTCDate()) / DAY) - 1);
}

/* 한국 방문 목록 → 한국에 있었던 날 구간(병합). 출·입국일을 해외로 보면 양 끝 하루씩 제외 */
export function koreaRanges(visits, endpointsAbroad, openEnd) {
  const ranges = [];
  visits.forEach(v => {
    const a = toDay(v.from);
    if (a === null) return;
    const b = v.to ? toDay(v.to) : openEnd + (endpointsAbroad ? 1 : 0);
    if (b === null || b < a) return;
    const from = endpointsAbroad ? a + 1 : a;
    const to = endpointsAbroad ? b - 1 : b;
    if (to >= from) ranges.push([from, to]);
  });
  ranges.sort((x, y) => x[0] - y[0]);
  const merged = [];
  ranges.forEach(r => {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1] + 1) last[1] = Math.max(last[1], r[1]);
    else merged.push(r.slice());
  });
  return merged;
}

export function abroadDays(start, end, ranges) {
  let inKorea = 0;
  ranges.forEach(([a, b]) => {
    const lo = Math.max(a, start), hi = Math.min(b, end);
    if (hi >= lo) inKorea += hi - lo + 1;
  });
  return (end - start + 1) - inKorea;
}

export function evaluateStay(state) {
  const years = state.years
    .map(y => ({ grade: y.grade, country: y.country, start: toDay(y.start), end: toDay(y.end || defaultYearEnd(y.start)) }))
    .filter(y => y.grade && y.start !== null && y.end !== null && y.end >= y.start)
    .sort((a, b) => a.start - b.start);
  const reasons = [];
  if (!years.length) return { empty: true };

  const grades = new Set(years.map(y => y.grade));
  const gradeOk = grades.size >= 3 && HIGH.some(g => grades.has(g));
  if (grades.size < 3) reasons.push(`해외 이수 학년이 ${grades.size}개로, 중·고교 3개 학년 이상이 필요합니다.`);
  if (!HIGH.some(g => grades.has(g))) reasons.push('해외 이수 학년에 고등학교 과정(고1~고3)이 1개 학년 이상 포함되어야 합니다.');
  if (grades.size < years.length) reasons.push('같은 학년을 두 번 이수한 기간은 1개 학년으로만 계산했습니다.');

  const lastEnd = years[years.length - 1].end;
  const required = PEOPLE.filter(p => p.key === 'student' || state.parentRule === 'both' || state.worker === p.key).map(p => p.key);
  const rows = years.map(y => {
    const total = y.end - y.start + 1;
    const cells = {};
    PEOPLE.forEach(p => {
      const need = Math.floor(total * p.ratio[0] / p.ratio[1]);
      const days = abroadDays(y.start, y.end, koreaRanges(state.visits[p.key] || [], state.endpointsAbroad, lastEnd));
      cells[p.key] = { days, need, ok: days >= need, required: required.includes(p.key) };
    });
    return { grade: y.grade, country: y.country, start: fromDay(y.start), end: fromDay(y.end), total, cells };
  });

  rows.forEach(r => PEOPLE.forEach(p => {
    const c = r.cells[p.key];
    if (c.required && !c.ok) reasons.push(`${r.grade}(${r.start} ~ ${r.end}): ${p.label} 해외 체류 ${c.days}일 — ${p.ratio[0]}/${p.ratio[1]} 기준 ${c.need}일에 ${c.need - c.days}일 부족`);
  }));
  const stayOk = rows.every(r => PEOPLE.every(p => !r.cells[p.key].required || r.cells[p.key].ok));
  return { empty: false, ok: gradeOk && stayOk, gradeOk, stayOk, gradeCount: grades.size, rows, reasons };
}
