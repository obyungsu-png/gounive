/* ===== 서버(Supabase) 연결 설정 =====
   방법 1) 프로젝트 루트의 .env 파일에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 입력 (.env.example 참고)
   방법 2) 아래 '' 안에 직접 입력
   - SUPABASE_URL: Supabase 대시보드 → Project Settings → API → Project URL
   - SUPABASE_ANON_KEY: 같은 화면의 anon public 키 (공개용이라 브라우저에 넣어도 됨. service_role 키는 절대 금지)
   두 값이 비어 있으면 '데모 모드'로 동작하며, 데이터는 이 브라우저에만 저장됩니다. */
export const APP_CONFIG = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
};
