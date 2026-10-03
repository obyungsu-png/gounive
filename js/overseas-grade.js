/* ===== 해외학교 성적 입력 (평균·단순 비율 환산) ===== */
const OG_KEY = 'teukrye-overseas-grades';
const OG_SCALES = {
  gpa4: { label: '4.0 GPA 기준', max: 4, step: 0.01 },
  gpa5: { label: '5.0 GPA(가중) 기준', max: 5, step: 0.01 },
  pct:  { label: '100점 기준', max: 100, step: 0.1 },
  ib:   { label: 'IB 7점 기준', max: 7, step: 1 }
};
const OG_TERMS = ['G9 1학기','G9 2학기','G10 1학기','G10 2학기','G11 1학기','G11 2학기','G12 1학기','G12 2학기'];
const OG_SUBJECTS = 5;

let ogState = { scale: 'gpa4', grades: OG_TERMS.map(() => Array(OG_SUBJECTS).fill('')), tests: {} };

function ogLoad() {
  try {
    const saved = JSON.parse(localStorage.getItem(OG_KEY));
    if (saved && saved.grades) ogState = Object.assign(ogState, saved);
  } catch (e) {}
}
function ogSave() {
  try { localStorage.setItem(OG_KEY, JSON.stringify(ogState)); } catch (e) {}
}

function ogAverage(values) {
  const nums = values.filter(v => v !== '' && !isNaN(v)).map(Number);
  return nums.length ? nums.reduce((a,b) => a + b, 0) / nums.length : null;
}
function ogFormat(v) {
  if (v === null) return '-';
  return ogState.scale === 'pct' ? v.toFixed(1) : v.toFixed(2);
}

function renderOverseasTable() {
  const scale = OG_SCALES[ogState.scale];
  document.getElementById('ogTableBody').innerHTML = OG_TERMS.map((term, r) => `
    <tr>
      <td class="row-label">${term}</td>
      ${ogState.grades[r].map((v, c) => `<td><input class="og-input" type="number" min="0" max="${scale.max}" step="${scale.step}" value="${v}" data-r="${r}" data-c="${c}" aria-label="${term} 과목${c+1}"></td>`).join('')}
      <td class="og-row-avg" id="ogRowAvg${r}">-</td>
    </tr>`).join('');
  document.querySelectorAll('#ogTableBody .og-input').forEach(inp => inp.addEventListener('input', onOverseasInput));
  updateOverseasSummary();
}

function onOverseasInput(e) {
  const inp = e.target;
  const max = OG_SCALES[ogState.scale].max;
  if (inp.value !== '' && (Number(inp.value) < 0 || Number(inp.value) > max)) {
    inp.classList.add('invalid');
    return;
  }
  inp.classList.remove('invalid');
  ogState.grades[inp.dataset.r][inp.dataset.c] = inp.value;
  ogSave();
  updateOverseasSummary();
}

function updateOverseasSummary() {
  const scale = OG_SCALES[ogState.scale];
  const rowAvgs = ogState.grades.map(row => ogAverage(row));
  rowAvgs.forEach((avg, r) => { document.getElementById('ogRowAvg' + r).textContent = ogFormat(avg); });
  for (let c = 0; c < OG_SUBJECTS; c++) {
    document.getElementById('ogColAvg' + c).textContent = ogFormat(ogAverage(ogState.grades.map(row => row[c])));
  }
  const all = ogAverage(ogState.grades.flat());
  document.getElementById('ogColAvgAll').textContent = ogFormat(all);
  document.getElementById('ogAvg').textContent = ogFormat(all);
  document.getElementById('ogPct').textContent = all === null ? '-' : (all / scale.max * 100).toFixed(1) + '점';
  document.getElementById('ogScaleLabel').textContent = scale.label;
  const filled = rowAvgs.map((a, i) => [a, i]).filter(x => x[0] !== null);
  document.getElementById('ogTerms').textContent = filled.length;
  const trend = document.getElementById('ogTrend');
  if (filled.length < 2) {
    trend.textContent = '-';
    trend.className = 'og-sum-value';
  } else {
    const diff = filled[filled.length - 1][0] - filled[filled.length - 2][0];
    trend.textContent = (diff > 0 ? '▲ ' : diff < 0 ? '▼ ' : '') + Math.abs(diff).toFixed(ogState.scale === 'pct' ? 1 : 2);
    trend.className = 'og-sum-value ' + (diff > 0 ? 'up' : diff < 0 ? 'down' : '');
  }
}

function setOverseasScale(scale) {
  if (scale !== ogState.scale && ogState.grades.flat().some(v => v !== '')) {
    if (!confirm('성적 체계를 바꾸면 입력한 성적이 초기화됩니다. 계속할까요?')) return;
    ogState.grades = OG_TERMS.map(() => Array(OG_SUBJECTS).fill(''));
  }
  ogState.scale = scale;
  document.querySelectorAll('#ogScaleBtns button').forEach(b => b.classList.toggle('primary', b.dataset.scale === scale));
  ogSave();
  renderOverseasTable();
}

function resetOverseasGrades() {
  if (!confirm('입력한 해외학교 성적과 공인시험 기록을 모두 지울까요?')) return;
  ogState.grades = OG_TERMS.map(() => Array(OG_SUBJECTS).fill(''));
  ogState.tests = {};
  document.querySelectorAll('#gradeOverlay [data-test]').forEach(inp => { inp.value = ''; });
  ogSave();
  renderOverseasTable();
}

(function initOverseasGrades() {
  ogLoad();
  document.querySelectorAll('#ogScaleBtns button').forEach(b => {
    b.classList.toggle('primary', b.dataset.scale === ogState.scale);
    b.addEventListener('click', () => setOverseasScale(b.dataset.scale));
  });
  document.querySelectorAll('#gradeOverlay [data-test]').forEach(inp => {
    inp.value = ogState.tests[inp.dataset.test] || '';
    inp.addEventListener('input', () => { ogState.tests[inp.dataset.test] = inp.value; ogSave(); });
  });
  renderOverseasTable();
})();
