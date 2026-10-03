/* ===== 메인: 주요자료 탭 ===== */
const NEWS_TABS = [
  { more: () => openPage('systemOverlay'), items: [
    { icon: 'fa-balance-scale', title: '3년 특례 vs 12년 특례, 무엇이 다를까?', meta: '특례 공통', run: () => openPage('systemOverlay') },
    { icon: 'fa-school', title: '한국학교 16개국 34개교 · 한국교육원 22개국 47개원 현황', meta: '재외교육기관', run: () => openPage('instOverlay') },
    { icon: 'fa-question-circle', title: '해외체류기간 산정 기준, 꼭 알아야 할 핵심 포인트', meta: '3년 특례', run: () => openPage('systemOverlay') }
  ]},
  { more: () => openPage('dataOverlay'), items: [
    { icon: 'fa-file-alt', title: '대학별 재외국민 특별전형 모집요강 모음', meta: '자료실', run: () => openPage('dataOverlay') },
    { icon: 'fa-stamp', title: '해외 학교 서류 아포스티유·영사확인 안내', meta: '서류준비', run: () => openDocsGuide() },
    { icon: 'fa-plane-arrival', title: '귀국학생 초·중·고 편입학과 학력인정', meta: '귀국학생', run: () => openPage('returnOverlay') }
  ]},
  { more: () => openProgram(2), items: [
    { icon: 'fa-bullhorn', title: '5월 전후: 대학별 모집요강 발표, 자격 최종 점검', meta: '연간 일정', run: () => openProgram(2) },
    { icon: 'fa-calendar-check', title: '7월 ~ 9월: 대학별 원서접수 (모집요강 확인)', meta: '연간 일정', run: () => openProgram(2) },
    { icon: 'fa-tasks', title: '나의 특례 준비 체크리스트 점검하기', meta: '체크리스트', run: () => openProgram(3) }
  ]}
];
let newsTab = 0;

function switchNewsTab(idx) {
  newsTab = idx;
  document.querySelectorAll('.news-tabs .news-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
  document.getElementById('newsList').innerHTML = NEWS_TABS[idx].items.map((it, i) => `
    <div class="news-item" onclick="NEWS_TABS[${idx}].items[${i}].run()">
      <div class="news-thumb"><i class="fas ${it.icon}"></i></div>
      <div class="news-text"><div class="title">${it.title}</div><div class="meta">${it.meta}</div></div>
    </div>`).join('');
}

switchNewsTab(0);
