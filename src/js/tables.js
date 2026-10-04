/* ===== 대학정보 · 학과정보 목록 ===== */
import univData from '../data/universities.json';
import deptData from '../data/departments.json';
import { onRouteEnter } from './router.js';

const ROWS_PER_PAGE = 10;

/* ====== 대학 테이블 렌더 ====== */
let univQuery = '';

export function filterUnivTable(q) {
  univQuery = q.trim();
  const input = document.getElementById('univSearchInput');
  if (input.value !== q) input.value = q;
  renderUnivTable(1);
}

export function renderUnivTable(page) {
  const list = univQuery ? univData.filter(d => d.name.includes(univQuery)) : univData;
  document.getElementById('univTotal').textContent = list.length.toLocaleString() + '건';
  const start = (page-1)*ROWS_PER_PAGE;
  const rows = list.slice(start, start+ROWS_PER_PAGE);
  const body = document.getElementById('univTableBody');
  body.innerHTML = rows.map(d => `
    <tr>
      <td><div class="univ-name-cell">
        <div class="univ-logo">${d.name.charAt(0)}</div>
        <span class="univ-name-text">${d.name}</span>
      </div></td>
      <td><div class="region-cell"><i class="fas fa-map-marker-alt"></i>${d.region}</div></td>
      <td><div class="competition-cell">
        <div>수시 <span class="comp-su">${d.su}</span></div>
        <div>정시 <span class="comp-jeong">${d.jeong}</span></div>
      </div></td>
      <td><a class="num-link" href="#">${d.capacity.toLocaleString()}</a></td>
      <td><a class="num-link" href="#">${d.dept}</a></td>
      <td><a class="num-link" href="#">${d.adm}</a></td>
      <td><button class="compare-btn">✓ 비교</button></td>
      <td><button class="star-btn">★</button></td>
    </tr>`).join('');
  renderPagination('univPagination', page, Math.max(1, Math.ceil(list.length/ROWS_PER_PAGE)), renderUnivTable);
}

/* ====== 학과 테이블 렌더 ====== */
export function renderDeptTable(page) {
  const start = (page-1)*ROWS_PER_PAGE;
  const rows = deptData.slice(start, start+ROWS_PER_PAGE);
  const body = document.getElementById('deptTableBody');
  body.innerHTML = rows.map(d => `
    <tr>
      <td class="dept-name-cell">${d.dept}</td>
      <td><div class="univ-name-cell center">
        <div class="univ-logo sm">${d.univ.charAt(0)}</div>
        <span class="fs-12">${d.univ}</span>
      </div></td>
      <td><div class="region-cell"><i class="fas fa-map-marker-alt"></i>${d.region}</div></td>
      <td><div class="competition-cell">
        <div>수시 <span class="comp-su">${d.su}</span></div>
        <div>정시 <span class="comp-jeong">${d.jeong}</span></div>
      </div></td>
      <td><a class="num-link" href="#">${d.capacity}</a></td>
      <td><button class="result-btn">입시결과</button></td>
      <td><button class="compare-btn">✓ 비교</button></td>
    </tr>`).join('');
  renderPagination('deptPagination', page, Math.ceil(deptData.length/ROWS_PER_PAGE), renderDeptTable);
}

export function renderPagination(containerId, current, total, callback) {
  const c = document.getElementById(containerId);
  const btn = (page, label, active) => `<button class="page-btn${active ? ' active' : ''}" data-js data-page="${page}">${label}</button>`;
  let html = btn(1, '«') + btn(Math.max(1, current - 1), '‹');
  for (let i = 1; i <= Math.min(total, 10); i++) html += btn(i, i, i === current);
  html += btn(Math.min(total, current + 1), '›') + btn(total, '»');
  c.innerHTML = html;
  c.onclick = e => {
    const b = e.target.closest('[data-page]');
    if (b) callback(Number(b.dataset.page));
  };
}

onRouteEnter('univOverlay', () => filterUnivTable(''));
onRouteEnter('deptOverlay', () => renderDeptTable(1));
