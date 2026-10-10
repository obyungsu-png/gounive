# 재외국민 One Stop 서비스 (특례 입시 포털)

Vite로 빌드하는 정적 사이트입니다. 서버(Supabase)를 연결하지 않으면 데모 모드로 동작합니다.

## 실행 방법

```bash
npm install        # 처음 한 번
npm run dev        # 개발 서버 (http://localhost:5173) - 저장하면 자동 새로고침
npm run build      # 배포용 빌드 → dist/
npm run preview    # 빌드 결과 미리보기
npm test           # 체류기간 계산 규칙 + CMS 서버 테스트
```

배포는 **Vercel**(https://gounive.vercel.app)이 담당합니다. `main`에 push하면 Vercel이 `vercel.json` 설정대로
`npm run build` 후 `dist/`를 배포합니다. GitHub Actions(`.github/workflows/ci.yml`)는 push·PR마다 테스트와 빌드만 확인합니다.

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
      institutions · return · universities · login · stay · en · policy
    modals/                 자격요건 · 초보자 · 서류준비 가이드, 상담 신청 폼
  data/                     JSON 데이터 (teukrye-admissions · library · institutions · site)
  css/                      화면별 스타일 + utilities.css(공통 유틸) + responsive.css(마지막에 로드)
  js/
    router.js               화면 주소 연결 (#/경로/하위탭), onRouteEnter 등록
    pages.js                화면 표시/숨김
    store.js · config.js    데이터 저장소 (Supabase 또는 localStorage), 연결 설정
    auth.js                 로그인 · 회원가입 · 비밀번호 찾기
    consult.js              특례 상담
    program.js              특례 준비 가이드 (탭 · 체크리스트)
    overseas-grade.js       해외학교 성적 계산
    stay-rules.js           3년 특례 체류 요건 계산 규칙 (출·입국일 산정 방식 4가지 포함, 순수 함수, tests/에서 검증)
    stay-calc.js            해외체류기간 계산기 화면
    teukrye-adm.js          특례전형정보
    univ-grade.js           대학별 성적분석
    univ-info.js            대학별 특례 정보 (대학마다 3년·12년 카드)
    policy.js               운영 정책 화면 + 푸터 운영자 정보 (src/data/site.json)
    search.js · home.js · menu.js · modals.js · banner.js · ok-pages.js · ui.js
public/                     favicon · 공유 미리보기 이미지(og-image.png) · robots.txt (빌드 시 그대로 복사)
supabase/schema.sql         DB 테이블 · 보안 정책 (Supabase SQL Editor에서 실행)
api/cms.js                  Vercel 서버 함수: CMS 요청 입구 (POST /api/cms)
server/                     CMS 서버 코드: 인증(auth) · GitHub 저장(github) · 허용 파일(files) · 참조 사이트 확인(sources·text) · AI 제안(ai)
cms/sources.json            참조 사이트 목록 (업데이트 확인 대상, CMS에서 편집)
tests/                      node:test 단위 테스트 (tests/helpers: 가짜 GitHub·외부 사이트)
.github/workflows/ci.yml    push·PR마다 테스트 + 빌드 확인
vercel.json                 Vercel 빌드 설정 (Vite, 출력 폴더 dist)
```

아이콘(Font Awesome), 한글 폰트(Noto Sans KR, @fontsource), supabase-js는 npm 패키지로 설치되어 빌드 결과에 포함됩니다.
외부 CDN을 쓰지 않으며, 폰트는 woff2만 포함하고 글자 범위별로 나뉘어 있어 화면에 필요한 조각만 내려받습니다.
supabase-js는 서버 모드일 때만 따로 불러오므로 데모 모드의 첫 화면 용량에는 포함되지 않습니다.

## 서버 연동 (Supabase)

회원·상담·해외학교 성적·체크리스트·체류 계산 입력값은 `src/js/store.js`가 저장합니다.
Supabase 값이 **없으면 데모 모드**(이 브라우저에만 저장), **있으면 서버 모드**로 자동 전환됩니다.

### 설정 순서 (약 10분)

1. [supabase.com](https://supabase.com)에서 프로젝트 생성 (Region: **Northeast Asia (Seoul)** — 개인정보처리방침에 저장 위치를 서울로 적어 두었으므로 다른 지역을 고르면 `src/data/site.json`의 `dataRegion`도 바꿔야 함)
2. 대시보드 **SQL Editor** → `supabase/schema.sql` 내용을 붙여넣고 **Run**
   - 테이블: `profiles`(회원), `consults`(상담), `grade_records`(성적), `checklists`(체크리스트), `stay_records`(체류 계산 입력값)
   - 모든 테이블에 RLS가 켜져 있어 사용자는 자기 데이터만 읽고 쓸 수 있습니다
   - 회원 탈퇴용 함수 `delete_my_account()`도 함께 만들어집니다 (탈퇴 시 위 테이블의 본인 행까지 모두 삭제)
3. **Authentication → URL Configuration**
   - Site URL: 실제 배포 주소 `https://gounive.vercel.app/`
   - Redirect URLs: 같은 주소와 `http://localhost:5173/`
4. **Authentication → Sign In / Providers → Email**: 가입 시 이메일 인증을 받을지 선택 (Confirm email)
5. **Project Settings → API**의 `Project URL`과 `anon public` 키를 입력
   - 로컬: `.env.example`을 `.env`로 복사해 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 입력
   - 배포: **Vercel → 프로젝트 → Settings → Environment Variables**에 같은 이름으로 등록한 뒤 Redeploy
   - anon 키는 공개용이라 브라우저에 들어가도 됩니다. **service_role 키는 절대 넣지 마세요.**

### 상담 답변 달기

대시보드 **Table Editor → consults**에서 해당 행의 `answer`에 답변을 쓰고 `status`를 `답변완료`로 바꾸면,
사용자의 상담 화면에 바로 표시됩니다.

### 데모 모드에서 알아둘 점

- 데이터는 브라우저 localStorage에만 있어 다른 기기와 공유되지 않습니다.
- 비밀번호 찾기·변경은 서버 모드에서만 동작합니다.

## 운영자 정보 (src/data/site.json)

푸터와 개인정보처리방침의 운영자 이름(`operator`)과 연락 이메일(`contactEmail`)은 이 파일에서 바꿉니다.
비어 있으면 '입시상담 게시판(비공개 글)'로 문의를 받도록 표시됩니다.

## CMS 관리 (고객센터 › CMS 관리, `#/cms`)

운영자가 사이트 내용을 직접 고치는 화면입니다. 비밀번호는 서버에서만 확인하며 코드에는 해시만 들어 있습니다(저장소가 공개이므로 비밀번호 자체는 README·코드에 적지 않음).

| 탭 | 할 수 있는 일 |
|---|---|
| 콘텐츠 편집 | 메인 배너(미리보기)·공지·주요자료 탭, 특례전형 표·대학 목록, 자료실, 한국학교·교육원, 사이트·운영자 정보, 참조 사이트 목록을 항목 단위로 추가·수정·삭제·순서 변경 |
| 화면(HTML) 편집 | 제도안내·준비 가이드·정책·메뉴·푸터 등 화면 파일을 직접 수정 |
| 참조 사이트 업데이트 | 버튼을 누르면 OKEP·대교협·nikangs·대학 모집요강 등을 확인 → 바뀐 곳을 검토 대기에 표시 → 운영자가 **반영함 / 참고만 / 무시** 결정(메모 가능). 자동 반영 없음 |

- **게시**하면 해당 JSON/HTML 파일이 GitHub에 커밋되고 Vercel이 약 1분 뒤 사이트에 반영합니다. 같은 파일을 다른 곳에서 먼저 고쳤으면 덮어쓰지 않고 알려 줍니다.
- 각 파일의 **변경 이력**에서 이전 버전 내용을 보고 그 버전으로 되돌릴 수 있습니다.
- CMS는 `src/data/*.json`, `src/partials/**.html`, `cms/sources.json`만 고칠 수 있습니다(코드·설정 파일은 불가).
- 참조 사이트 확인 상태는 `cms-state` 브랜치에 저장되며, 이 브랜치는 배포하지 않습니다(`vercel.json`). 처음 확인할 때는 기준만 저장하고 그다음부터 바뀐 점을 알려 줍니다.
- 확인 대상은 `cms/sources.json` + 특례전형 표의 모집요강 링크 + 자료실 링크입니다(중복 제외). 보안 인증서가 잘못된 사이트(예: 서강대)는 '접속 실패'로 표시합니다.

### 설정 (Vercel → 프로젝트 → Settings → Environment Variables, 저장 후 Redeploy)

| 이름 | 필수 | 값 |
|---|---|---|
| `GITHUB_TOKEN` | 필수 | GitHub 세분화 토큰(Fine-grained). Repository access: 이 저장소만, Permissions → Contents: **Read and write** |
| `CMS_PASSWORD` | 선택 | 비밀번호를 바꿀 때만. 넣으면 기본 비밀번호 대신 이 값을 씀 |
| `ANTHROPIC_API_KEY` | 선택 | 넣으면 업데이트마다 **AI 요약·제안** 버튼이 생김(한국어 요약, 반영 여부 의견, 항목별 수정 제안). 제안은 '편집기에 넣기'를 눌러야 편집 내용에 들어가고, 게시는 직접 함 |
| `ANTHROPIC_MODEL` | 선택 | AI 모델 변경 시 (기본 `claude-opus-5-5`) |
| `GITHUB_REPO`, `GITHUB_BRANCH` | 선택 | 기본 `obyungsu-png/gounive`, `main` |

서버 함수는 서울 리전(`icn1`)에서 실행되며 한 번에 최대 60초입니다. 참조 사이트 확인은 화면에서 6곳씩 나눠 요청합니다.

## 데이터 (src/data)

| 파일 | 내용 | 출처 |
|---|---|---|
| `teukrye-admissions.json` | 2027학년도 대학별 3년·12년 특례 전형방법·모집인원·일정 | 대학별 2027 모집요강 원문 PDF 요약 (행마다 출처 링크) |
| `library.json` | 자료실 (공식 문서·페이지 링크) | 대교협, 교육부 OKEP, 각 대학 입학처 |
| `institutions.json` | 한국학교 34개교 · 한국교육원 47개원 (나라·홈페이지) | 재외교육기관포털(OKEP) 현황, 2026. 4. 기준 |
| `home.json` | 메인 배너 · 공지사항 · 특례 주요자료 탭 | CMS에서 편집 |
| `site.json` | 사이트 이름 · 운영자 · 연락 이메일 · 정책 시행일 · 데이터 저장 지역 | 운영자가 직접 입력 (비어 있으면 입시상담 게시판으로 안내) |

확인되지 않은 칸은 비워 두고 화면에 "모집요강 확인"으로 표시합니다. 새 학년도 자료가 나오면 JSON만 고치면 됩니다.

## 화면 주소

각 화면은 고유 주소를 가져 새로고침·뒤로가기·링크 공유가 됩니다.

| 주소 | 화면 |
|---|---|
| `#/eligibility` | 재외국민 제도안내 |
| `#/stay` | 해외체류기간 계산기 |
| `#/admissions/3year`, `#/admissions/12year` | 특례전형정보 |
| `#/results/3year`, `#/results/12year` | 대학별 성적분석 |
| `#/prepare/roadmap` · `factors` · `schedule` · `checklist` · `glossary` | 특례 준비 가이드 |
| `#/grades` | 해외학교 성적 입력 |
| `#/library` · `#/consult` | 자료실 · 상담 |
| `#/login/signin` · `signup` · `reset` | 로그인 · 회원가입 · 비밀번호 찾기 |
| `#/institutions/schools`, `#/institutions/centers` | 재외교육기관 |
| `#/return` | 귀국학생 편입학 |
| `#/universities` | 대학별 특례 정보 |
| `#/policy/privacy` · `terms` · `email` | 개인정보처리방침 · 이용약관 · 이메일무단수집거부 |
| `#/login/withdraw` | 회원 탈퇴 |
| `#/cms/content` · `pages` · `updates` | CMS 관리 (운영자, 고객센터 메뉴) |
| `#/en` | English Guide (영어 안내) |

## 새 화면 추가 방법

1. `src/partials/pages/xxx.html`에 `<div class="info-overlay" id="xxxOverlay">…</div>` 작성
2. `index.html`에 `<!-- @include src/partials/pages/xxx.html -->` 추가
3. `src/js/pages.js`의 `ALL_PAGES`에 `'xxxOverlay'` 추가
4. `src/js/router.js`의 `ROUTES`에 `{ path: 'xxx', page: 'xxxOverlay', title: '화면 이름' }` 추가
5. 화면에 들어올 때 할 일이 있으면 해당 모듈에서 `onRouteEnter('xxxOverlay', () => …)` 등록
6. HTML의 `onclick`에서 부를 함수는 `src/main.js`의 `Object.assign(window, …)`에 추가
7. 검색에 노출하려면 `src/js/search.js`의 `SEARCH_PAGES`에 항목 추가

## 공유 미리보기 · 검색 노출

`index.html`의 `<head>`에 설명(description)과 Open Graph·트위터 카드 태그가 있습니다.
기본 주소는 `https://gounive.vercel.app/`로 적혀 있으니, 도메인을 바꾸면 `canonical`, `og:url`, `og:image` 세 곳을 함께 바꾸세요.

## 접근성

- 상단 메뉴·전체메뉴 버튼·알림/마이 아이콘은 실제 `<button>`이라 Tab·Enter로 사용할 수 있습니다.
- 그 밖에 클릭으로 동작하는 카드(`onclick`이 달린 div 등)는 `ui.js`가 자동으로 포커스 가능하게 만들고 Enter/Space로 실행되게 합니다.
- 아이콘만 있는 버튼에는 `aria-label`을 붙였습니다. 새 버튼을 만들 때도 글자나 `aria-label`을 꼭 넣어 주세요.
