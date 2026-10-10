/* ===== 데이터(JSON)에 적힌 링크 실행 =====
   '#/경로'      → 사이트 화면 이동         예) #/stay, #/prepare/schedule
   'https://…'   → 새 창으로 열기
   'action:이름' → 안내창 열기 (docs: 서류준비 가이드, guide: 자격요건 가이드, novice: 초보자 가이드, consult: 상담 신청) */
import { navigate } from './router.js';
import { openDocsGuide, openGuideModal, openNoviceGuide } from './modals.js';
import { openConsultForm } from './consult.js';

const ACTIONS = { docs: openDocsGuide, guide: openGuideModal, novice: openNoviceGuide, consult: openConsultForm };
export const LINK_ACTIONS = { docs: '서류준비 가이드', guide: '자격요건 입력 가이드', novice: '초보자 가이드', consult: '상담 신청' };

export function runLink(link) {
  if (!link) return;
  if (link.startsWith('#')) navigate(link);
  else if (link.startsWith('action:')) (ACTIONS[link.slice(7)] || (() => {}))();
  else if (/^https?:\/\//.test(link)) window.open(link, '_blank', 'noopener');
}
