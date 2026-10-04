/* ===== 서버(Supabase) 연결 설정 =====
   Supabase 대시보드 → Project Settings → API 에서 값을 복사해 넣으세요.
   - SUPABASE_URL: Project URL (예: https://abcd1234.supabase.co)
   - SUPABASE_ANON_KEY: anon public 키 (공개용 키라 브라우저에 넣어도 됩니다. service_role 키는 절대 넣지 마세요)
   두 값이 비어 있으면 '데모 모드'로 동작하며, 데이터는 이 브라우저에만 저장됩니다. */
window.APP_CONFIG = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: ''
};
