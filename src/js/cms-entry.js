/* ===== CMS 진입점: 화면에 들어올 때만 CMS 코드를 불러옴 (일반 방문자 용량 영향 없음) ===== */
import { onRouteEnter } from './router.js';

onRouteEnter('cmsOverlay', tab => {
  import('./cms/app.js').then(m => m.enterCms(tab));
});
