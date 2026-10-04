# 재외국민 One Stop 서비스 (특례 입시 포털)

빌드 과정이 없는 정적 사이트입니다. `index.html`을 브라우저로 바로 열거나, 아무 정적 서버(GitHub Pages 등)에 올리면 됩니다.

## 폴더 구조

```
index.html              화면 마크업 (페이지는 info-overlay 단위로 구성)
css/
  base.css              공통 레이아웃 · 헤더 · 내비 · 메인 · 전체메뉴 · 푸터
  info-pages.css        내부 페이지 공통 (상단 경로, 필터, 표)
  admission-pages.css   특례전형정보 · 자료실 · 상담
  ok-pages.css          제도안내 · 재외교육기관 · 귀국학생 공통 컴포넌트
  program.css           특례 준비 가이드
  overseas-grade.css    해외학교 성적 입력
  univ-grade.css        대학별 성적분석
  job.css, login.css, guide-modal.css, novice-modal.css, docs-modal.css
  ui.css                검색 드롭다운 · 토스트 · 공통 모달
  responsive.css        반응형 (반드시 마지막에 로드)
js/
  data.js               예시 데이터 (대학 · 학과 · 특례전형)
  ui.js                 토스트, 미구현 요소 '준비 중' 안내
  router.js             화면 주소 연결 (#/경로/하위탭)
  app.js                페이지 전환, 대학/학과 목록, 배너 슬라이더
  menu.js               전체메뉴
  modals.js             자격요건 · 초보자 · 서류준비 가이드 모달
  config.js             Supabase 연결 값 (비어 있으면 데모 모드)
  store.js              데이터 저장소 (Supabase 또는 localStorage)
  auth.js               로그인 · 회원가입 · 비밀번호 찾기
  search.js             사이트 통합검색
  home.js               메인 주요자료 탭
  program.js            특례 준비 가이드 (탭 · 체크리스트)
  overseas-grade.js     해외학교 성적 평균 계산
  teukrye-adm.js        특례전형정보 탭 · 필터
  consult.js            특례 상담 신청
  ok-pages.js, univ-grade.js
assets/fontawesome/     Font Awesome Free 6.4.0 (로컬 호스팅, LICENSE 포함)
assets/vendor/          supabase-js 2.x UMD 빌드 (MIT)
supabase/schema.sql     DB 테이블 · 보안 정책 (SQL Editor에서 실행)
```

## 서버 연동 (Supabase)

회원·상담·해외학교 성적·체크리스트는 `js/store.js`가 저장합니다.
`js/config.js`에 Supabase 값이 **없으면 데모 모드**(이 브라우저에만 저장), **있으면 서버 모드**로 자동 전환됩니다.

### 설정 순서 (약 10분)

1. [supabase.com](https://supabase.com)에서 프로젝트 생성 (Region: Northeast Asia (Seoul) 권장)
2. 대시보드 **SQL Editor** → `supabase/schema.sql` 내용을 붙여넣고 **Run**
   - 테이블: `profiles`(회원), `consults`(상담), `grade_records`(성적), `checklists`(체크리스트)
   - 모든 테이블에 RLS가 켜져 있어 사용자는 자기 데이터만 읽고 쓸 수 있습니다
3. **Authentication → URL Configuration**
   - Site URL: 실제 배포 주소 (예: `https://아이디.github.io/gounive/`)
   - Redirect URLs: 같은 주소 (로컬 테스트 시 `http://localhost:5500/` 등도 추가)
4. **Authentication → Sign In / Providers → Email**: 가입 시 이메일 인증을 받을지 선택 (Confirm email)
5. **Project Settings → API**에서 `Project URL`과 `anon public` 키를 `js/config.js`에 입력
   - anon 키는 공개용이라 브라우저에 넣어도 됩니다. **service_role 키는 절대 넣지 마세요.**

### 상담 답변 달기

대시보드 **Table Editor → consults**에서 해당 행의 `answer`에 답변을 쓰고 `status`를 `답변완료`로 바꾸면,
사용자의 상담 화면에 바로 표시됩니다.

### 데모 모드에서 알아둘 점

- 데이터는 브라우저 localStorage에만 있어 다른 기기와 공유되지 않습니다.
- 비밀번호 찾기·변경은 서버 모드에서만 동작합니다.

`js/data.js`의 대학 · 특례전형 목록과 경쟁률은 **화면 구성용 예시 데이터**입니다.

## 화면 주소

각 화면은 고유 주소를 가져 새로고침·뒤로가기·링크 공유가 됩니다.

| 주소 | 화면 |
|---|---|
| `#/eligibility` | 재외국민 제도안내 |
| `#/admissions/3year`, `#/admissions/12year` | 특례전형정보 |
| `#/results/3year`, `#/results/12year` | 대학별 성적분석 |
| `#/prepare/roadmap` · `factors` · `schedule` · `checklist` · `glossary` | 특례 준비 가이드 |
| `#/grades` | 해외학교 성적 입력 |
| `#/library` · `#/consult` | 자료실 · 상담 |
| `#/login/signin` · `signup` · `reset` | 로그인 · 회원가입 · 비밀번호 찾기 |
| `#/institutions/schools`, `#/institutions/centers` | 재외교육기관 |
| `#/return` | 귀국학생 편입학 |
| `#/universities` · `#/departments` | 대학정보 · 학과정보 |

## 새 페이지 추가 방법

1. `index.html`에 `<div class="info-overlay" id="xxxOverlay">…</div>` 추가
2. `js/app.js`의 `ALL_PAGES` 배열에 `'xxxOverlay'` 추가
3. `js/router.js`의 `ROUTES`에 `{ path: 'xxx', page: 'xxxOverlay', title: '화면 이름' }` 추가
4. 버튼이나 링크에서 `openPage('xxxOverlay')` 호출
5. 검색에 노출하려면 `js/search.js`의 `SEARCH_PAGES`에 항목 추가
