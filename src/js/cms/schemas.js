/* ===== CMS 콘텐츠 편집기의 항목 정의 =====
   file: 저장소의 JSON 파일, key: 파일 안의 위치('' = 파일 전체), kind: list(목록) | object(한 장짜리 설정)
   필드 type: text · textarea · number · url · link(사이트 화면/외부 주소) · icon · select · tags(복수 선택) · list(하위 목록) */
import { ENDPOINT_RULES } from '../stay-rules.js';

export const LINK_CHOICES = [
  ['#/', '홈'], ['#/eligibility', '재외국민 제도안내'], ['#/stay', '해외체류기간 계산기'], ['#/universities', '대학별 특례 정보'],
  ['#/admissions/3year', '특례전형정보 (3년)'], ['#/admissions/12year', '특례전형정보 (12년)'], ['#/results/3year', '대학별 성적분석'],
  ['#/grades', '해외학교 성적 입력'], ['#/prepare/roadmap', '준비 로드맵'], ['#/prepare/factors', '전형요소별 준비'],
  ['#/prepare/schedule', '특례 일정'], ['#/prepare/checklist', '체크리스트'], ['#/prepare/glossary', '용어사전'],
  ['#/library', '자료실'], ['#/consult', '입시상담'], ['#/institutions/schools', '한국학교'], ['#/institutions/centers', '한국교육원'],
  ['#/return', '귀국학생 편입학'], ['#/en', 'English Guide'], ['#/policy/privacy', '개인정보처리방침'],
  ['action:docs', '서류준비 가이드 (안내창)'], ['action:guide', '자격요건 입력 가이드 (안내창)'], ['action:novice', '초보자 가이드 (안내창)'], ['action:consult', '상담 신청 (안내창)']
];

const BANNER_THEMES = [['1', '1 파랑'], ['2', '2 하늘'], ['3', '3 노랑'], ['4', '4 연노랑'], ['5', '5 남색(어두움)'], ['6', '6 흰색'], ['7', '7 연보라']];
const BUTTON_STYLES = [['btn-fill-brand', '청록 채움'], ['btn-line-brand', '청록 테두리'], ['btn-fill-blue', '파랑'], ['btn-fill-orange', '주황'], ['btn-fill-purple', '보라'], ['btn-fill-red', '빨강']];

export const COLLECTIONS = [
  /* ---------- 홈 화면 ---------- */
  { id: 'banners', group: '홈 화면', label: '메인 배너', file: 'src/data/home.json', key: 'banners', kind: 'list', preview: 'banner',
    title: b => [b.title, b.em].filter(Boolean).join(' ').replace(/\n/g, ' '), sub: b => `테마 ${b.theme} · 버튼 ${(b.buttons || []).length}개`,
    blank: () => ({ theme: 1, kicker: '', title: '새 배너 제목', em: '', desc: '', icon: 'fa-star', buttons: [{ label: '바로가기 ›', style: 'btn-fill-brand', link: '#/' }] }),
    fields: [
      { key: 'theme', label: '색 테마', type: 'select', options: BANNER_THEMES, number: true },
      { key: 'kicker', label: '윗줄 작은 글씨 (선택)', type: 'text' },
      { key: 'title', label: '제목 (줄바꿈 가능)', type: 'textarea', rows: 2 },
      { key: 'em', label: '강조 문구 (선택)', type: 'text' },
      { key: 'desc', label: '설명 (줄바꿈 가능)', type: 'textarea', rows: 3 },
      { key: 'icon', label: '오른쪽 아이콘', type: 'icon', hint: 'Font Awesome 이름 (예: fa-passport, fa-calculator)' },
      { key: 'buttons', label: '버튼', type: 'list', fields: [
        { key: 'label', label: '글자', type: 'text' },
        { key: 'style', label: '모양', type: 'select', options: BUTTON_STYLES },
        { key: 'link', label: '이동할 곳', type: 'link' }
      ], blank: () => ({ label: '바로가기 ›', style: 'btn-fill-brand', link: '#/' }) }
    ] },
  { id: 'notices', group: '홈 화면', label: '공지사항', file: 'src/data/home.json', key: 'notices', kind: 'list',
    title: n => n.text, sub: n => n.badge,
    blank: () => ({ badge: '안내', style: 'general', text: '새 공지', link: '#/' }),
    fields: [
      { key: 'badge', label: '말머리', type: 'text', hint: '예: 신규, 안내, 입시, 자료' },
      { key: 'style', label: '말머리 색', type: 'select', options: [['new', '주황 (신규)'], ['general', '초록 (일반)']] },
      { key: 'text', label: '내용', type: 'text' },
      { key: 'link', label: '누르면 이동할 곳', type: 'link' }
    ] },
  { id: 'newsTabs', group: '홈 화면', label: '특례 주요자료 탭', file: 'src/data/home.json', key: 'newsTabs', kind: 'list',
    title: t => t.label, sub: t => `항목 ${(t.items || []).length}개`,
    blank: () => ({ label: '새 탭', more: '#/', items: [] }),
    fields: [
      { key: 'label', label: '탭 이름', type: 'text' },
      { key: 'more', label: "'더보기' 이동할 곳", type: 'link' },
      { key: 'items', label: '항목', type: 'list', fields: [
        { key: 'icon', label: '아이콘', type: 'icon' },
        { key: 'title', label: '제목', type: 'text' },
        { key: 'meta', label: '분류', type: 'text' },
        { key: 'link', label: '이동할 곳', type: 'link' }
      ], blank: () => ({ icon: 'fa-file-alt', title: '', meta: '', link: '#/' }) }
    ] },

  /* ---------- 특례전형 ---------- */
  { id: 'admRows', group: '특례전형', label: '대학별 전형 (표)', file: 'src/data/teukrye-admissions.json', key: 'rows', kind: 'list',
    title: r => `${r.univ} · ${r.type} 특례`, sub: r => [r.quota, r.schedule].filter(Boolean).join(' · '),
    blank: () => ({ univ: '', type: '3년', name: '', quota: '', method: '', tags: ['서류'], schedule: '', url: '', source: '' }),
    fields: [
      { key: 'univ', label: '대학 (대학 목록의 이름과 같게)', type: 'text', datalist: 'univs' },
      { key: 'type', label: '특례 유형', type: 'select', options: [['3년', '3년 특례'], ['12년', '12년 특례']] },
      { key: 'name', label: '전형명', type: 'text' },
      { key: 'quota', label: '모집인원', type: 'text', hint: '비우면 화면에 "모집요강 확인"으로 표시' },
      { key: 'method', label: '전형방법', type: 'textarea', rows: 2 },
      { key: 'tags', label: '전형요소', type: 'tags', options: ['서류', '면접', '필답'] },
      { key: 'schedule', label: '주요 일정', type: 'text', hint: '예: 원서 7.6~7.8 · 면접 8.29 · 발표 9.7' },
      { key: 'url', label: '모집요강 주소', type: 'url' },
      { key: 'source', label: '출처 설명', type: 'text' }
    ] },
  { id: 'admUnivs', group: '특례전형', label: '대학 목록 (대학별 특례 화면)', file: 'src/data/teukrye-admissions.json', key: 'univs', kind: 'list',
    title: u => u.univ, sub: u => u.home,
    blank: () => ({ univ: '', home: '' }),
    fields: [
      { key: 'univ', label: '대학 이름', type: 'text' },
      { key: 'home', label: '입학처 주소', type: 'url' },
      { key: 'dayRule', label: '출·입국일 산정 방식 (모집요강에 있을 때만)', type: 'select', options: [['', '표시 안 함'], ...ENDPOINT_RULES.map(r => [r.key, r.label])] },
      { key: 'note', label: '안내 문구 (특례 하나만 운영할 때 등)', type: 'text' }
    ] },
  { id: 'admMeta', group: '특례전형', label: '학년도 · 공통 안내', file: 'src/data/teukrye-admissions.json', key: '', kind: 'object',
    fields: [
      { key: 'year', label: '학년도', type: 'number' },
      { key: 'updated', label: '자료 기준일', type: 'text', hint: 'YYYY-MM-DD' },
      { key: 'note', label: '표 위 안내 문구', type: 'textarea', rows: 2 },
      { key: 'common.apply', label: '공통 원서접수 기간', type: 'text' },
      { key: 'common.applySource', label: '원서접수 기간 출처', type: 'text' }
    ] },

  /* ---------- 자료실 · 재외교육기관 ---------- */
  { id: 'library', group: '자료실 · 기관', label: '자료실', file: 'src/data/library.json', key: '', kind: 'list',
    title: it => it.title, sub: it => `${it.cat} · ${it.year} · ${it.org}`,
    blank: () => ({ cat: '모집요강', year: '2027', title: '', desc: '', org: '', url: '', kind: 'web' }),
    fields: [
      { key: 'cat', label: '분류', type: 'select', options: ['모집요강', '기본사항·시행계획', '자격·서류', '귀국학생'] },
      { key: 'year', label: '학년도', type: 'text', hint: '예: 2027, 2028, 공통' },
      { key: 'title', label: '제목', type: 'text' },
      { key: 'desc', label: '설명', type: 'text' },
      { key: 'org', label: '기관', type: 'text' },
      { key: 'url', label: '주소', type: 'url' },
      { key: 'kind', label: '형식', type: 'select', options: [['pdf', 'PDF 파일'], ['web', '웹 페이지']] }
    ] },
  { id: 'schools', group: '자료실 · 기관', label: '한국학교', file: 'src/data/institutions.json', key: 'schools', kind: 'list',
    title: s => s.name, sub: s => s.country,
    blank: () => ({ country: '', name: '', url: '' }),
    fields: [
      { key: 'country', label: '나라', type: 'text' }, { key: 'name', label: '학교 이름', type: 'text' }, { key: 'url', label: '홈페이지', type: 'url' },
      { key: 'type', label: '유형', type: 'select', options: [['', '국내 연계교육 중심형 (기본)'], ['모국이해', '모국이해교육 중심형']] }
    ] },
  { id: 'centers', group: '자료실 · 기관', label: '한국교육원', file: 'src/data/institutions.json', key: 'centers', kind: 'list',
    title: s => s.name, sub: s => s.country,
    blank: () => ({ country: '', name: '', url: '' }),
    fields: [{ key: 'country', label: '나라', type: 'text' }, { key: 'name', label: '교육원 이름', type: 'text' }, { key: 'url', label: '홈페이지', type: 'url' }] },
  { id: 'instMeta', group: '자료실 · 기관', label: '기관 현황 기준', file: 'src/data/institutions.json', key: '', kind: 'object',
    fields: [{ key: 'asOf', label: '기준 시점', type: 'text' }, { key: 'source', label: '출처', type: 'text' }] },

  /* ---------- 사이트 · 참조 사이트 ---------- */
  { id: 'site', group: '사이트 설정', label: '사이트 · 운영자 정보', file: 'src/data/site.json', key: '', kind: 'object',
    fields: [
      { key: 'name', label: '사이트 이름', type: 'text' },
      { key: 'operator', label: '운영자 이름 (푸터·개인정보처리방침)', type: 'text' },
      { key: 'contactEmail', label: '문의 이메일 (비우면 입시상담 게시판으로 안내)', type: 'text' },
      { key: 'policyDate', label: '정책 시행일', type: 'text' },
      { key: 'dataRegion', label: '회원 데이터 저장 위치 (Supabase 지역)', type: 'text' }
    ] },
  { id: 'sources', group: '사이트 설정', label: '참조 사이트 목록 (업데이트 확인 대상)', file: 'cms/sources.json', key: '', kind: 'list',
    title: s => s.title, sub: s => `${s.group} · ${s.url}`,
    blank: () => ({ group: '참조 사이트', title: '', url: '' }),
    fields: [{ key: 'group', label: '묶음', type: 'text' }, { key: 'title', label: '이름', type: 'text' }, { key: 'url', label: '주소', type: 'url' }] }
];

/* 화면(HTML) 편집 대상 */
export const PAGE_FILES = [
  ['src/partials/home.html', '홈 화면 (배너·공지 외 나머지)'],
  ['src/partials/pages/eligibility.html', '재외국민 제도안내'], ['src/partials/pages/stay.html', '해외체류기간 계산기 (안내 문구)'],
  ['src/partials/pages/prepare.html', '특례 준비 가이드 (로드맵·일정·용어)'], ['src/partials/pages/return.html', '귀국학생 편입학'],
  ['src/partials/pages/institutions.html', '재외교육기관 (안내 문구)'], ['src/partials/pages/library.html', '자료실 (틀)'],
  ['src/partials/pages/admissions.html', '특례전형정보 (틀)'], ['src/partials/pages/universities.html', '대학별 특례 정보 (틀)'],
  ['src/partials/pages/results.html', '대학별 성적분석'], ['src/partials/pages/grades.html', '해외학교 성적 입력'],
  ['src/partials/pages/consult.html', '입시상담'], ['src/partials/pages/en.html', 'English Guide'],
  ['src/partials/pages/policy.html', '개인정보처리방침·이용약관'], ['src/partials/pages/login.html', '로그인·회원가입'],
  ['src/partials/layout/header.html', '상단 메뉴'], ['src/partials/layout/menu.html', '전체메뉴'], ['src/partials/layout/footer.html', '하단(푸터)'],
  ['src/partials/modals/qualification-guide.html', '자격요건 입력 가이드 (안내창)'], ['src/partials/modals/novice-guide.html', '초보자 가이드 (안내창)'],
  ['src/partials/modals/docs-guide.html', '서류준비 가이드 (안내창)'], ['src/partials/modals/consult-form.html', '상담 신청 (안내창)']
];
