/* 해외체류기간 계산 규칙 테스트: npm test */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toDay, fromDay, defaultYearEnd, koreaRanges, abroadDays, evaluateStay } from '../src/js/stay-rules.js';
const t = test;
t('날짜 변환 왕복', () => { assert.equal(fromDay(toDay('2024-02-29')), '2024-02-29'); assert.equal(toDay('2023-02-29'), null); assert.equal(toDay(''), null); });
t('학년 종료일 = 다음 해 같은 날 전날', () => { assert.equal(defaultYearEnd('2023-08-16'), '2024-08-15'); assert.equal(defaultYearEnd('2024-02-29'), '2025-02-28'); assert.equal(defaultYearEnd('2023-03-01'), '2024-02-29'); });
t('한국 방문: 출·입국일은 해외로 계산', () => {
  const r = koreaRanges([{ from: '2024-01-01', to: '2024-01-10' }], true, 0);
  assert.deepEqual(r.map(x => x.map(fromDay)), [['2024-01-02', '2024-01-09']]);   // 8일 한국
  const r2 = koreaRanges([{ from: '2024-01-01', to: '2024-01-10' }], false, 0);
  assert.equal(r2[0][1] - r2[0][0] + 1, 10);
});
t('겹치는 방문 병합', () => {
  const r = koreaRanges([{ from: '2024-01-01', to: '2024-01-10' }, { from: '2024-01-05', to: '2024-01-20' }], false, 0);
  assert.equal(r.length, 1); assert.equal(r[0][1] - r[0][0] + 1, 20);
});
t('해외 일수 = 기간 - 한국 체류 겹침', () => {
  const s = toDay('2023-08-16'), e = toDay('2024-08-14');
  assert.equal(e - s + 1, 365);
  const r = koreaRanges([{ from: '2024-03-01', to: '2024-08-10' }], true, e);
  assert.equal(abroadDays(s, e, r), 365 - 161);   // 3/2~8/9 = 161일 한국
});
t('미귀국(출국일 비움)은 기간 끝까지 한국', () => {
  const s = toDay('2024-01-01'), e = toDay('2024-12-31');
  const r = koreaRanges([{ from: '2024-07-01', to: '' }], true, e);
  assert.equal(abroadDays(s, e, r), toDay('2024-07-01') - s + 1);   // 7/1(입국일)까지 해외
});
const base = (over = {}) => Object.assign({
  years: [
    { grade: '중3', start: '2022-08-17', end: '2023-08-15' },
    { grade: '고1', start: '2023-08-16', end: '2024-08-13' },
    { grade: '고2', start: '2024-08-14', end: '2025-08-12' }],
  visits: { student: [], father: [], mother: [] }, parentRule: 'both', worker: 'father', endpointsAbroad: true }, over);
t('방문 없음 → 충족', () => { const r = evaluateStay(base()); assert.equal(r.ok, true); assert.equal(r.rows[0].cells.student.need, Math.floor(364 * 3 / 4)); });
t('고교 학년 없으면 학력 요건 미충족', () => {
  const r = evaluateStay(base({ years: [{ grade: '중1', start: '2020-08-17' }, { grade: '중2', start: '2021-08-17' }, { grade: '중3', start: '2022-08-17' }] }));
  assert.equal(r.gradeOk, false); assert.equal(r.ok, false);
});
t('2개 학년뿐이면 미충족, 같은 학년 중복은 1개로', () => {
  const r = evaluateStay(base({ years: [{ grade: '고1', start: '2023-08-16' }, { grade: '고1', start: '2024-08-14' }, { grade: '고2', start: '2025-08-13' }] }));
  assert.equal(r.gradeCount, 2); assert.equal(r.gradeOk, false);
});
t('어머니 2/3 미달 → 미충족, 근무 부모 1인 기준이면 충족', () => {
  const visits = { student: [], father: [], mother: [{ from: '2024-03-01', to: '2024-08-10' }] };
  const both = evaluateStay(base({ visits }));
  assert.equal(both.ok, false); assert.ok(both.reasons.some(x => x.includes('어머니')));
  const worker = evaluateStay(base({ visits, parentRule: 'worker', worker: 'father' }));
  assert.equal(worker.ok, true);
});
t('학생 3/4 경계값 (필요일수 정확히 충족/1일 부족)', () => {
  // 고1 학년 2023-08-16~2024-08-13 = 364일, 필요 273일 → 한국 91일까지 허용
  const ok = evaluateStay(base({ endpointsAbroad: false, visits: { student: [{ from: '2024-01-01', to: fromDay(toDay('2024-01-01') + 90) }], father: [], mother: [] } }));
  assert.equal(ok.rows[1].cells.student.days, 273); assert.equal(ok.rows[1].cells.student.ok, true);
  const no = evaluateStay(base({ endpointsAbroad: false, visits: { student: [{ from: '2024-01-01', to: fromDay(toDay('2024-01-01') + 91) }], father: [], mother: [] } }));
  assert.equal(no.rows[1].cells.student.ok, false);
});
