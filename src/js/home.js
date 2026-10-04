import { openPage } from './router.js';
import { openProgram } from './program.js';
import { openDocsGuide } from './modals.js';

/* ===== 메인: 주요자료 탭 ===== */
const NEWS_TABS = [
  { more: () => openPage('systemOverlay'), items: [
    { icon: 'fa-balance-scale', title: '3년 특례 vs 12년 특례, 무엇이 다를까?', meta: '특례 공통', run: () => openPage('systemOverlay') },
    { icon: 'fa-school', title: '한국학교 16개국 34개교 · 한국교육원 22개국 47개원 현황', meta: '재외교육기관', run: () => openPage('instOverlay') },
    { icon: 'fa-calculator', title: '해외체류기간 계산기로 학생 3/4 · 부모 2/3 확인하기', meta: '3년 특례', run: () => openPage('stayOverlay') }
  ]},
  { more: () => openPage('dataOverlay'), items: [
    { icon: 'fa-file-alt', title: '2027학년도 대학별 재외국민 모집요강 (공식 자료 링크)', meta: '자료실', run: () => openPage('dataOverlay') },
    { icon: 'fa-stamp', title: '해외 학교 서류 아포스티유·영사확인 안내', meta: '서류준비', run: () => openDocsGuide() },
    { icon: 'fa-plane-arrival', title: '귀국학생 초·중·고 편입학과 학력인정', meta: '귀국학생', run: () => openPage('returnOverlay') }
  ]},
  { more: () => openProgram(2), items: [
    { icon: 'fa-calendar-check', title: '2027학년도 원서접수 2026. 7. 6.~7. 10. (대교협 공통)', meta: '2027 일정', run: () => openProgram(2) },
    { icon: 'fa-user-tie', title: '면접·필답 8. 8.~8. 29. · 최초 합격 발표 9. 4.~9. 11.', meta: '2027 일정', run: () => openProgram(2) },
    { icon: 'fa-tasks', title: '나의 특례 준비 체크리스트 점검하기', meta: '체크리스트', run: () => openProgram(3) }
  ]}
];
let newsTab = 0;

export function newsMore() { NEWS_TABS[newsTab].more(); }

export function switchNewsTab(idx) {
  newsTab = idx;
  document.querySelectorAll('.news-tabs .news-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
  document.getElementById('newsList').innerHTML = NEWS_TABS[idx].items.map((it, i) => `
    <div class="news-item" data-i="${i}" role="button" tabindex="0">
      <div class="news-thumb"><i class="fas ${it.icon}"></i></div>
      <div class="news-text"><div class="title">${it.title}</div><div class="meta">${it.meta}</div></div>
    </div>`).join('');
}

document.getElementById('newsList').addEventListener('click', e => {
  const item = e.target.closest('.news-item');
  if (item) NEWS_TABS[newsTab].items[Number(item.dataset.i)].run();
});

switchNewsTab(0);
