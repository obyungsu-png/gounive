/* ===== 화면 주소 연결 (해시 라우팅) =====
   주소 형식: index.html#/경로/하위탭  예) #/prepare/schedule, #/admissions/12year
   - 새로고침·뒤로가기·링크 공유 시 같은 화면이 열림
   - 탭 전환은 기록을 남기지 않고 주소만 바꿈(replace) */
const BASE_TITLE = '재외국민 One Stop 서비스';
const ROUTES = [
  { path: 'eligibility',  page: 'systemOverlay',    title: '재외국민 제도안내' },
  { path: 'universities', page: 'univOverlay',      title: '대학정보', enter: () => filterUnivTable('') },
  { path: 'departments',  page: 'deptOverlay',      title: '학과정보', enter: () => renderDeptTable(1) },
  { path: 'admissions',   page: 'admOverlay',       title: '특례전형정보', subs: ['3year', '12year'], enter: i => setAdmType(i === 1 ? '12년' : '3년') },
  { path: 'results',      page: 'univGradeOverlay', title: '재외국민 대학별성적분석', subs: ['3year', '12year'], enter: i => switchUnivGradeTab(i) },
  { path: 'grades',       page: 'gradeOverlay',     title: '해외학교 성적 입력' },
  { path: 'prepare',      page: 'programOverlay',   title: '특례 입시 준비 가이드', subs: ['roadmap', 'factors', 'schedule', 'checklist', 'glossary'], enter: i => switchProgramTab(i) },
  { path: 'library',      page: 'dataOverlay',      title: '재외국민 대입정보자료실' },
  { path: 'consult',      page: 'consultOverlay',   title: '특례 입시상담' },
  { path: 'institutions', page: 'instOverlay',      title: '재외교육기관', subs: ['schools', 'centers'], enter: i => switchInstTab(i) },
  { path: 'return',       page: 'returnOverlay',    title: '귀국학생 편입학 안내' },
  { path: 'jobs',         page: 'jobOverlay',       title: '직업정보' },
  { path: 'comp-consult', page: 'compOverlay',      title: '학생부종합전형 상담' },
  { path: 'login',        page: 'loginOverlay',     title: '로그인' }
];

let renderedHash = null;

/* 페이지 id(+하위 탭 번호 또는 이름) → '#/경로/하위' */
function routePath(pageId, sub) {
  const route = ROUTES.find(r => r.page === pageId);
  if (!route) return '#/';
  if (route.subs && sub !== undefined) {
    const slug = typeof sub === 'number' ? route.subs[sub] : sub;
    if (slug) return `#/${route.path}/${slug}`;
  }
  return `#/${route.path}`;
}

/* 새 기록을 남기며 이동 (뒤로가기로 돌아올 수 있음) */
function navigate(hash) {
  if ((location.hash || '#/') !== hash) location.hash = hash;
  renderRoute();
}

/* 기록 없이 주소만 갱신 (탭 전환용). 해당 화면이 열려 있을 때만 반영 */
function syncRoute(pageId, sub) {
  if (!document.getElementById(pageId).classList.contains('open')) return;
  const hash = routePath(pageId, sub);
  renderedHash = hash;
  if (location.hash !== hash) location.replace(hash);
}

function renderRoute() {
  const hash = location.hash || '#/';
  renderedHash = hash;
  const [path, sub] = hash.replace(/^#\/?/, '').split('/');
  const route = ROUTES.find(r => r.path === path);
  if (!route) {
    displayHome();
    document.title = BASE_TITLE;
    return;
  }
  displayPage(route.page);
  if (route.enter) route.enter(route.subs ? Math.max(0, route.subs.indexOf(sub)) : undefined);
  document.title = `${route.title} | ${BASE_TITLE}`;
}

window.addEventListener('hashchange', () => {
  if ((location.hash || '#/') !== renderedHash) renderRoute();
});

/* 모든 스크립트가 로드된 뒤 현재 주소의 화면을 표시 */
document.addEventListener('DOMContentLoaded', renderRoute);
