/* ===== 앱 진입점 =====
   1) 스타일 로드 (순서 중요: responsive.css는 항상 마지막)
   2) 화면 모듈 로드 (각 모듈이 스스로 초기화하고 라우트를 등록)
   3) HTML의 onclick="…"에서 부르는 함수만 window에 노출
   4) 현재 주소의 화면 표시 */
import '@fortawesome/fontawesome-free/css/all.min.css';
import './css/base.css';
import './css/job.css';
import './css/info-pages.css';
import './css/admission-pages.css';
import './css/univ-grade.css';
import './css/ok-pages.css';
import './css/program.css';
import './css/overseas-grade.css';
import './css/login.css';
import './css/guide-modal.css';
import './css/novice-modal.css';
import './css/docs-modal.css';
import './css/ui.css';
import './css/stay-calc.css';
import './css/utilities.css';
import './css/responsive.css';

import { openPage, showHome, startRouter } from './js/router.js';
import { toggleMenu, closeMenu, menuGo, openNotices, openMyArea } from './js/menu.js';
import { bannerGo, bannerNext, bannerPrev } from './js/banner.js';
import { filterUnivTable } from './js/tables.js';
import { toggleAccordion, searchJobs } from './js/jobs.js';
import { openGuideModal, closeGuideModal, switchGuideTab, openNoviceGuide, closeNoviceGuide, openDocsGuide, closeDocsGuide } from './js/modals.js';
import { toggleOkFaq, switchInstTab } from './js/ok-pages.js';
import { switchUnivGradeTab } from './js/univ-grade.js';
import { openProgram, switchProgramTab, resetChecklist } from './js/program.js';
import { resetOverseasGrades } from './js/overseas-grade.js';
import { setAdmType, renderAdmTable, resetAdmFilters } from './js/teukrye-adm.js';
import { loginUser, signupUser, requestPasswordReset, saveNewPassword, logoutUser } from './js/auth.js';
import { setConsultScope, openConsultForm, closeConsultForm, submitConsult } from './js/consult.js';
import './js/stay-calc.js';
import './js/library.js';
import './js/search.js';
import { switchNewsTab, newsMore } from './js/home.js';

Object.assign(window, {
  openPage, showHome,
  toggleMenu, closeMenu, menuGo, openNotices, openMyArea,
  bannerGo, bannerNext, bannerPrev,
  filterUnivTable, toggleAccordion, searchJobs,
  openGuideModal, closeGuideModal, switchGuideTab, openNoviceGuide, closeNoviceGuide, openDocsGuide, closeDocsGuide,
  toggleOkFaq, switchInstTab, switchUnivGradeTab,
  openProgram, switchProgramTab, resetChecklist, resetOverseasGrades,
  setAdmType, renderAdmTable, resetAdmFilters,
  loginUser, signupUser, requestPasswordReset, saveNewPassword, logoutUser,
  setConsultScope, openConsultForm, closeConsultForm, submitConsult,
  switchNewsTab, newsMore
});

startRouter();
