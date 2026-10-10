/* ===== 메인: 주요자료 탭 · 공지사항 — 내용: src/data/home.json (CMS에서 편집) ===== */
import home from '../data/home.json';
import { escapeHtml } from './ui.js';
import { runLink } from './links.js';

const NEWS_TABS = home.newsTabs || [];
let newsTab = 0;

export function newsMore() { if (NEWS_TABS[newsTab]) runLink(NEWS_TABS[newsTab].more); }

export function switchNewsTab(idx) {
  newsTab = idx;
  document.querySelectorAll('.news-tabs .news-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
  document.getElementById('newsList').innerHTML = (NEWS_TABS[idx] ? NEWS_TABS[idx].items : []).map((it, i) => `
    <div class="news-item" data-i="${i}" role="button" tabindex="0">
      <div class="news-thumb"><i class="fas ${escapeHtml(it.icon || 'fa-file-alt')}"></i></div>
      <div class="news-text"><div class="title">${escapeHtml(it.title)}</div><div class="meta">${escapeHtml(it.meta || '')}</div></div>
    </div>`).join('');
}

document.getElementById('newsList').addEventListener('click', e => {
  const item = e.target.closest('.news-item');
  if (item) runLink(NEWS_TABS[newsTab].items[Number(item.dataset.i)].link);
});

document.getElementById('newsTabs').innerHTML = NEWS_TABS.map((t, i) =>
  `<span class="news-tab${i === 0 ? ' active' : ''}" onclick="switchNewsTab(${i})">${escapeHtml(t.label)}</span>`).join('');
switchNewsTab(0);

/* 공지사항 */
const NOTICES = home.notices || [];
document.getElementById('noticeList').innerHTML = NOTICES.map((n, i) => `
  <div class="notice-item clickable" data-i="${i}" role="button" tabindex="0">
    <span class="notice-badge${n.style === 'general' ? ' general' : ''}">${escapeHtml(n.badge || '안내')}</span>
    <span class="notice-text">${escapeHtml(n.text)}</span>
  </div>`).join('');
document.getElementById('noticeList').addEventListener('click', e => {
  const item = e.target.closest('.notice-item');
  if (item) runLink(NOTICES[Number(item.dataset.i)].link);
});
