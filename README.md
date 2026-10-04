# 재외국민 One Stop 서비스 (특례 입시 포털)

Vite로 빌드하는 정적 사이트입니다. 서버(Supabase)를 연결하지 않으면 데모 모드로 동작합니다.

## 실행 방법

```bash
npm install        # 처음 한 번
npm run dev        # 개발 서버 (http://localhost:5173) - 저장하면 자동 새로고침
npm run build      # 배포용 빌드 → dist/
npm run preview    # 빌드 결과 미리보기
```

`main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 자동으로 빌드해 GitHub Pages에 배포합니다.
(최초 1회: 저장소 **Settings → Pages → Source**를 **GitHub Actions**로 선택)

> 빌드 도구를 쓰므로 `index.html`을 더블클릭해서 열면 화면이 나오지 않습니다. `npm run dev` 또는 배포 주소로 확인하세요.

## 폴더 구조

```
index.html                  뼈대. <!-- @include … --> 위치에 아래 partials가 빌드 때 합쳐짐
vite.config.js              Vite 설정 + @include 처리 플러그인
src/
  main.js                   진입점: CSS·모듈 로드, onclick용 함수 노출, 라우터 시작
  partials/
    layout/                 header(상단·내비) · footer · menu(전체메뉴) · floating · scroll-top
    home.html               메인 화면
    pages/                  화면별 HTML (주소 #/경로 와 1:1)
      eligibility · admissions · results · grades · prepare · library · consult
      institutions · return · universities · departments · login · jobs · comp-consult
    modals/                 자격요건 · 초보자 · 서류준비 가이드, 상담 신청 폼
  data/                     JSON 데이터 (universities · departments · teukrye-admissions · univ-grade-tabs)
  css/                      화면별 스타일 + utilities.css(공통 유틸) + responsive.css(마지막에 로드)
  js/
    router.js               화면 주소 연결 (#/경로/하위탭), onRouteEnter 등록
    pages.js                화면 표시/숨김
    store.js · config.js    데이터 저장소 (Supabase 또는 localStorage), 연결 설정
    auth.js                 로그인 · 회원가입 · 비밀번호 찾기
    consult.js              특례 상담
    program.js              특례 준비 가이드 (탭 · 체크리스트)
    overseas-grade.js       해외학교 성적 계산
    teukrye-adm.js          특례전형정보
    univ-grade.js           대학별 성적분석
    tables.js               대학·학과 목록
    search.js · home.js · menu.js · modals.js · banner.js · jobs.js · ok-pages.js · ui.js
supabase/schema.sql         DB 테이블 · 보안 정책 (Supabase SQL Editor에서 실행)
.github/workflows/deploy.yml  GitHub Pages 자동 배포
```

아이콘(Font Awesome)과 supabase-js는 npm 패키지로 설치되어 빌드 결과에 포함됩니다.
supabase-js는 서버 모드일 때만 따로 불러오므로 데모 모드의 첫 화면 용량에는 포함되지 않습니다.

## 서버 연동 (Supabase)

회원·상담·해외학교 성적·체크리스트는 `src/js/store.js`가 저장합니다.
Supabase 값이 **없으면 데모 모드**(이 브라우저에만 저장), **있으면 서버 모드**로 자동 전환됩니다.

### 설정 순서 (약 10분)

1. [supabase.com](https://supabase.com)에서 프로젝트 생성 (Region: Northeast Asia (Seoul) 권장)
2. 대시보드 **SQL Editor** → `supabase/schema.sql` 내용을 붙여넣고 **Run**
   - 테이블: `profiles`(회원), `consults`(상담), `grade_records`(성적), `checklists`(체크리스트)
   - 모든 테이블에 RLS가 켜져 있어 사용자는 자기 데이터만 읽고 쓸 수 있습니다
3. **Authentication → URL Configuration**
   - Site URL: 실제 배포 주소 (예: `https://아이디.github.io/gounive/`)
   - Redirect URLs: 같은 주소와 `http://localhost:5173/`
4. **Authentication → Sign In / Providers → Email**: 가입 시 이메일 인증을 받을지 선택 (Confirm email)
5. **Project Settings → API**의 `Project URL`과 `anon public` 키를 입력
   - 로컬: `.env.example`을 `.env`로 복사해 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 입력
   - 배포: 저장소 **Settings → Secrets and variables → Actions → Variables**에 같은 이름으로 등록
   - anon 키는 공개용이라 브라우저에 들어가도 됩니다. **service_role 키는 절대 넣지 마세요.**

### 상담 답변 달기

대시보드 **Table Editor → consults**에서 해당 행의 `answer`에 답변을 쓰고 `status`를 `답변완료`로 바꾸면,
사용자의 상담 화면에 바로 표시됩니다.

### 데모 모드에서 알아둘 점

- 데이터는 브라우저 localStorage에만 있어 다른 기기와 공유되지 않습니다.
- 비밀번호 찾기·변경은 서버 모드에서만 동작합니다.

`src/data/`의 대학 · 특례전형 목록과 경쟁률은 **화면 구성용 예시 데이터**입니다.

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

## 새 화면 추가 방법

1. `src/partials/pages/xxx.html`에 `<div class="info-overlay" id="xxxOverlay">…</div>` 작성
2. `index.html`에 `<!-- @include src/partials/pages/xxx.html -->` 추가
3. `src/js/pages.js`의 `ALL_PAGES`에 `'xxxOverlay'` 추가
4. `src/js/router.js`의 `ROUTES`에 `{ path: 'xxx', page: 'xxxOverlay', title: '화면 이름' }` 추가
5. 화면에 들어올 때 할 일이 있으면 해당 모듈에서 `onRouteEnter('xxxOverlay', () => …)` 등록
6. HTML의 `onclick`에서 부를 함수는 `src/main.js`의 `Object.assign(window, …)`에 추가
7. 검색에 노출하려면 `src/js/search.js`의 `SEARCH_PAGES`에 항목 추가
