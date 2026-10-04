/* ===== 화면 주소 연결 (해시 라우팅) =====
   주소 형식: index.html#/경로/하위탭  예) #/prepare/schedule, #/admissions/12year
   - 새로고침·뒤로가기·링크 공유 시 같은 화면이 열림
   - 탭 전환은 기록을 남기지 않고 주소만 바꿈(replace)
   - 각 화면 모듈은 onRouteEnter(페이지id, fn)로 '화면에 들어올 때' 동작을 등록 */
import { displayPage, displayHome } from './pages.js';

const BASE_TITLE = '재외국민 One Stop 서비스';
const ROUTES = [
  { path: 'eligibility',  page: 'systemOverlay',    title: '재외국민 제도안내' },
  { path: 'universities', page: 'univOverlay',      title: '대학정보' },
  { path: 'departments',  page: 'deptOverlay',      title: '학과정보' },
  { path: 'admissions',   page: 'admOverlay',       title: '특례전형정보', subs: ['3year', '12year'] },
  { path: 'results',      page: 'univGradeOverlay', title: '재외국민 대학별성적분석', subs: ['3year', '12year'] },
  { path: 'grades',       page: 'gradeOverlay',     title: '해외학교 성적 입력' },
  { path: 'prepare',      page: 'programOverlay',   title: '특례 입시 준비 가이드', subs: ['roadmap', 'factors', 'schedule', 'checklist', 'glossary'] },
  { path: 'library',      page: 'dataOverlay',      title: '재외국민 대입정보자료실' },
  { path: 'consult',      page: 'consultOverlay',   title: '특례 입시상담' },
  { path: 'institutions', page: 'instOverlay',      title: '재외교육기관', subs: ['schools', 'centers'] },
  { path: 'return',       page: 'returnOverlay',    title: '귀국학생 편입학 안내' },
  { path: 'jobs',         page: 'jobOverlay',       title: '직업정보' },
  { path: 'comp-consult', page: 'compOverlay',      title: '학생부종합전형 상담' },
  { path: 'login',        page: 'loginOverlay',     title: '로그인 · 회원가입', subs: ['signin', 'signup', 'reset', 'update'] }
];

const enterHandlers = {};
let renderedHash = null;

/* 화면에 들어올 때 실행할 동작 등록 (하위 탭이 있으면 탭 번호를 받음) */
export function onRouteEnter(pageId, fn) { enterHandlers[pageId] = fn; }

/* 페이지 id(+하위 탭 번호 또는 이름) → '#/경로/하위' */
export function routePath(pageId, sub) {
  const route = ROUTES.find(r => r.page === pageId);
  if (!route) return '#/';
  if (route.subs && sub !== undefined) {
    const slug = typeof sub === 'number' ? route.subs[sub] : sub;
    if (slug) return `#/${route.path}/${slug}`;
  }
  return `#/${route.path}`;
}

/* 새 기록을 남기며 이동 (뒤로가기로 돌아올 수 있음) */
export function navigate(hash) {
  if ((location.hash || '#/') !== hash) location.hash = hash;
  renderRoute();
}

export function openPage(id, sub) { navigate(routePath(id, sub)); }
export function showHome() { navigate('#/'); }

/* 기록 없이 주소만 갱신 (탭 전환용). 해당 화면이 열려 있을 때만 반영 */
export function syncRoute(pageId, sub) {
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
  const enter = enterHandlers[route.page];
  if (enter) enter(route.subs ? Math.max(0, route.subs.indexOf(sub)) : undefined);
  document.title = `${route.title} | ${BASE_TITLE}`;
}

/* 모든 모듈이 등록을 마친 뒤 main.js에서 호출 */
export function startRouter() {
  window.addEventListener('hashchange', () => {
    if ((location.hash || '#/') !== renderedHash) renderRoute();
  });
  renderRoute();
}
