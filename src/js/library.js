/* ===== 재외국민 대입정보자료실 — 데이터: src/data/library.json (공식 기관 링크) ===== */
import items from '../data/library.json';
import { escapeHtml } from './ui.js';

const THUMB = { '모집요강': '', '기본사항·시행계획': 'orange', '자격·서류': 'green', '귀국학생': 'green' };

function renderLibrary() {
  const kw = document.getElementById('libKeyword').value.trim();
  const cat = document.getElementById('libCat').value;
  const list = items.filter(it => (!cat || it.cat === cat) && (!kw || `${it.title} ${it.org} ${it.desc}`.includes(kw)));
  document.getElementById('libTotal').textContent = list.length + '건';
  document.getElementById('libEmpty').style.display = list.length ? 'none' : 'block';
  document.getElementById('libGrid').innerHTML = list.map(it => `
    <a class="data-card" href="${it.url}" target="_blank" rel="noopener">
      <div class="data-thumb ${THUMB[it.cat] || ''}"><span>${escapeHtml(it.cat).replace('·', '<br>')}<br><small>${escapeHtml(it.year)}</small></span></div>
      <div class="data-info">
        <div class="data-tags"><span>${escapeHtml(it.year)}</span> <span>${escapeHtml(it.cat)}</span></div>
        <div class="data-title">${escapeHtml(it.title)}</div>
        <div class="data-desc">${escapeHtml(it.desc)}</div>
        <div class="data-file">${it.kind === 'pdf' ? 'PDF 열기' : '페이지 열기'} <i class="fas fa-${it.kind === 'pdf' ? 'file-pdf' : 'external-link-alt'}"></i></div>
        <div class="data-meta">${escapeHtml(it.org)}</div>
      </div>
    </a>`).join('');
}

document.getElementById('libKeyword').addEventListener('input', renderLibrary);
document.getElementById('libSearchBtn').addEventListener('click', renderLibrary);
document.getElementById('libCat').addEventListener('change', renderLibrary);
renderLibrary();
