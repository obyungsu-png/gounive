/* ===== 해외체류기간 계산기 (화면) =====
   계산 규칙은 stay-rules.js, 저장은 Store('stay') */
import { Store } from './store.js';
import { escapeHtml } from './ui.js';
import { GRADES, PEOPLE, ENDPOINT_RULES, DEFAULT_ENDPOINT_RULE, endpointRule, toDay, fromDay, defaultYearEnd, evaluateStay } from './stay-rules.js';

/* ---------- 상태 · 저장 ---------- */
function emptyState() {
  return {
    type: '3년',
    years: [{ grade: '', country: '', start: '', end: '' }],
    visits: { student: [], father: [], mother: [] },
    parentRule: 'both', worker: 'father', endpointRule: DEFAULT_ENDPOINT_RULE,
    grades12: Array(12).fill(false)
  };
}
let state = emptyState();
function save() { Store.save('stay', state); }

const SAMPLE = {
  years: [
    { grade: '중3', country: '미국', start: '2022-08-17', end: '2023-08-15' },
    { grade: '고1', country: '미국', start: '2023-08-16', end: '2024-08-13' },
    { grade: '고2', country: '미국', start: '2024-08-14', end: '2025-08-12' }
  ],
  visits: {
    student: [{ from: '2023-06-10', to: '2023-08-05' }, { from: '2024-06-15', to: '2024-08-08' }],
    father: [{ from: '2023-12-20', to: '2024-01-05' }, { from: '2024-06-15', to: '2024-07-20' }],
    mother: [{ from: '2024-03-01', to: '2024-08-10' }]
  }
};

/* ---------- 화면 ---------- */
const gradeOptions = sel => ['<option value="">선택</option>'].concat(GRADES.map((g, i) => `<option value="${g}"${g === sel ? ' selected' : ''}>${g} (G${i + 7})</option>`)).join('');

function renderInputs() {
  document.getElementById('stayYears').innerHTML = state.years.map((y, i) => `
    <tr>
      <td><select data-kind="year" data-i="${i}" data-field="grade" aria-label="학년">${gradeOptions(y.grade)}</select></td>
      <td><input type="text" data-kind="year" data-i="${i}" data-field="country" value="${escapeHtml(y.country || '')}" placeholder="예) 미국" maxlength="20" aria-label="재학 국가"></td>
      <td><input type="date" data-kind="year" data-i="${i}" data-field="start" value="${y.start}" aria-label="학년 시작일"></td>
      <td><input type="date" data-kind="year" data-i="${i}" data-field="end" value="${y.end}" aria-label="학년 종료일"></td>
      <td><button class="stay-del" data-js data-del="year" data-i="${i}" aria-label="학년 삭제"><i class="fas fa-times"></i></button></td>
    </tr>`).join('');
  document.getElementById('stayPeople').innerHTML = PEOPLE.map(p => `
    <div class="stay-person">
      <div class="stay-person-head">${p.label} <span>${p.ratio[0]}/${p.ratio[1]} 이상</span></div>
      ${(state.visits[p.key] || []).map((v, i) => `
        <div class="stay-visit">
          <label>한국 입국<input type="date" data-kind="visit" data-person="${p.key}" data-i="${i}" data-field="from" value="${v.from}"></label>
          <label>한국 출국<input type="date" data-kind="visit" data-person="${p.key}" data-i="${i}" data-field="to" value="${v.to}"></label>
          <button class="stay-del" data-js data-del="visit" data-person="${p.key}" data-i="${i}" aria-label="기간 삭제"><i class="fas fa-times"></i></button>
        </div>`).join('') || '<div class="stay-empty">한국 방문 기록 없음 (전 기간 해외 체류)</div>'}
      <button class="stay-add" data-js data-add="${p.key}"><i class="fas fa-plus"></i> 한국 체류 기간 추가</button>
    </div>`).join('');
  document.getElementById('stayParentRule').value = state.parentRule;
  document.getElementById('stayWorker').value = state.worker;
  document.getElementById('stayWorkerWrap').classList.toggle('is-hidden', state.parentRule !== 'worker');
  document.getElementById('stayEndpointRule').value = state.endpointRule;
  document.getElementById('stayGrades12').innerHTML = state.grades12.map((on, i) => {
    const label = i < 6 ? `초${i + 1}` : i < 9 ? `중${i - 5}` : `고${i - 8}`;
    return `<label class="stay-grade${on ? ' on' : ''}"><input type="checkbox" data-grade12="${i}"${on ? ' checked' : ''}> ${label}<small>G${i + 1}</small></label>`;
  }).join('');
}

function cell(c) {
  const cls = c.ok ? 'ok' : c.required ? 'bad' : 'muted';
  return `<td class="stay-cell ${cls}">${c.days}<small> / ${c.need}일</small>${c.required ? (c.ok ? ' <i class="fas fa-check"></i>' : ' <i class="fas fa-times"></i>') : '<br><small>판정 제외</small>'}</td>`;
}

function renderResult() {
  const r = evaluateStay(state);
  const box = document.getElementById('stayResult');
  if (r.empty) {
    box.innerHTML = '<div class="stay-summary"><i class="fas fa-info-circle"></i> 해외 재학 학년의 학년과 시작일을 입력하면 결과가 표시됩니다.</div>';
  } else {
    box.innerHTML = `
      <div class="stay-summary ${r.ok ? 'ok' : 'bad'}">
        <i class="fas ${r.ok ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
        <div><b>${r.ok ? '입력한 기록 기준으로 3년 특례 요건을 충족합니다.' : '입력한 기록 기준으로 3년 특례 요건을 충족하지 못합니다.'}</b>
        <div class="stay-summary-sub">학력 요건 ${r.gradeOk ? '충족' : '미충족'} (해외 이수 ${r.gradeCount}개 학년) · 체류 요건 ${r.stayOk ? '충족' : '미충족'} · 산정 방식: ${escapeHtml(endpointRule(state.endpointRule).label)}</div></div>
      </div>
      ${r.reasons.length ? `<ul class="ok-list stay-reasons">${r.reasons.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul>` : ''}
      <div class="stay-table-wrap">
        <table class="stay-table result">
          <thead><tr><th>학년</th><th>기간</th><th>일수</th>${PEOPLE.map(p => `<th>${p.label}<br><small>${p.ratio[0]}/${p.ratio[1]} 이상</small></th>`).join('')}</tr></thead>
          <tbody>${r.rows.map(row => `
            <tr><td><b>${row.grade}</b>${row.country ? `<br><small>${escapeHtml(row.country)}</small>` : ''}</td><td>${row.start}<br>~ ${row.end}</td><td>${row.total}일</td>${PEOPLE.map(p => cell(row.cells[p.key])).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }
  const missing = state.grades12.map((on, i) => on ? null : (i < 6 ? `초${i + 1}` : i < 9 ? `중${i - 5}` : `고${i - 8}`)).filter(Boolean);
  document.getElementById('stayResult12').innerHTML = `
    <div class="stay-summary ${missing.length ? 'bad' : 'ok'}">
      <i class="fas ${missing.length ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i>
      <div><b>${missing.length ? `해외 이수가 확인되지 않은 학년: ${missing.join(', ')}` : '12개 학년 모두 해외 이수 — 12년 특례 학력 요건 충족(참고)'}</b>
      <div class="stay-summary-sub">학년별 재학·성적증명서로 빠짐없이 증빙해야 하며, 중간에 국내 학교 재학 기간이 있으면 12년 특례 대상이 아닙니다.</div></div>
    </div>`;
}

function update() { save(); renderResult(); }

/* 대학별 특례 정보 화면 등에서 출·입국일 산정 방식을 지정해 열 때 */
export function useEndpointRule(key) {
  state.endpointRule = endpointRule(key).key;
  setType('3년');
  renderInputs();
  update();
}

function setType(type) {
  state.type = type;
  document.querySelectorAll('#stayTypeTabs .ok-tab').forEach(t => t.classList.toggle('active', t.dataset.type === type));
  document.querySelectorAll('#stayOverlay .stay-panel').forEach(p => p.classList.toggle('is-hidden', p.dataset.panel !== type));
}

function applyState(saved) {
  state = Object.assign(emptyState(), saved || {});
  // 예전 저장값(endpointsAbroad: 출·입국일 모두 해외 체크 해제)을 새 산정 방식으로 옮김
  if (saved && !saved.endpointRule && saved.endpointsAbroad === false) state.endpointRule = 'bothKorea';
  delete state.endpointsAbroad;
  state.endpointRule = endpointRule(state.endpointRule).key;
  state.visits = Object.assign({ student: [], father: [], mother: [] }, state.visits);
  renderInputs();
  setType(state.type);
  renderResult();
}

(function initStay() {
  const root = document.getElementById('stayOverlay');
  document.getElementById('stayEndpointRule').innerHTML = ENDPOINT_RULES.map(r => `<option value="${r.key}">${r.label}</option>`).join('');
  root.addEventListener('input', e => {
    const t = e.target, d = t.dataset;
    if (d.kind === 'year') {
      const y = state.years[d.i];
      y[d.field] = t.value;
      // 시작일을 바꾸면 종료일 자동 채움
      if (d.field === 'start') {
        y.end = defaultYearEnd(t.value);
        t.closest('tr').querySelector('[data-field="end"]').value = y.end;
      }
      update();
    } else if (d.kind === 'visit') {
      state.visits[d.person][d.i][d.field] = t.value;
      update();
    }
  });
  root.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.grade12 !== undefined) {
      state.grades12[t.dataset.grade12] = t.checked;
      t.parentElement.classList.toggle('on', t.checked);
      update();
    } else if (t.id === 'stayParentRule' || t.id === 'stayWorker' || t.id === 'stayEndpointRule') {
      state.parentRule = document.getElementById('stayParentRule').value;
      state.worker = document.getElementById('stayWorker').value;
      state.endpointRule = document.getElementById('stayEndpointRule').value;
      document.getElementById('stayWorkerWrap').classList.toggle('is-hidden', state.parentRule !== 'worker');
      update();
    } else if (t.dataset.kind === 'year' && t.tagName === 'SELECT') {
      update();
    }
  });
  root.addEventListener('click', e => {
    const b = e.target.closest('button[data-js], .ok-tab');
    if (!b) return;
    if (b.classList.contains('ok-tab')) { setType(b.dataset.type); save(); return; }
    if (b.id === 'stayAddYear') {
      const last = state.years[state.years.length - 1];
      const next = last && last.end ? fromDay(toDay(last.end) + 1) : '';
      state.years.push({ grade: '', country: last ? last.country : '', start: next, end: defaultYearEnd(next) });
    } else if (b.dataset.add) {
      state.visits[b.dataset.add].push({ from: '', to: '' });
    } else if (b.dataset.del === 'year') {
      state.years.splice(b.dataset.i, 1);
      if (!state.years.length) state.years.push({ grade: '', country: '', start: '', end: '' });
    } else if (b.dataset.del === 'visit') {
      state.visits[b.dataset.person].splice(b.dataset.i, 1);
    } else if (b.id === 'staySample') {
      Object.assign(state, JSON.parse(JSON.stringify(SAMPLE)));
    } else if (b.id === 'stayReset') {
      if (!confirm('입력한 체류 기록을 모두 지울까요?')) return;
      state = emptyState();
    } else return;
    renderInputs();
    update();
  });

  applyState(Store.loadLocal('stay', null));
  // 서버 모드 로그인 시 서버 기록 우선, 없으면 이 기기의 입력을 서버로 올림
  Store.onChange(async user => {
    if (!Store.isServer) return;
    if (!user) { applyState(null); return; }
    const remote = await Store.loadRemote('stay');
    if (remote) { applyState(remote); Store.save('stay', state); }
    else if (state.years.some(y => y.start)) save();
  });
})();
