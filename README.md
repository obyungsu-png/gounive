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
  auth.js               데모 로그인
  search.js             사이트 통합검색
  home.js               메인 주요자료 탭
  program.js            특례 준비 가이드 (탭 · 체크리스트)
  overseas-grade.js     해외학교 성적 평균 계산
  teukrye-adm.js        특례전형정보 탭 · 필터
  consult.js            특례 상담 신청
  ok-pages.js, univ-grade.js
assets/fontawesome/     Font Awesome Free 6.4.0 (로컬 호스팅, LICENSE 포함)
```

## 데모 기능 안내

서버가 없으므로 로그인, 상담 신청, 해외학교 성적, 체크리스트는 **브라우저 localStorage**에만 저장됩니다.
다른 기기나 브라우저와 공유되지 않으며, 실제 서비스 전에는 서버(회원 · 상담 DB) 연동이 필요합니다.

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
| `#/library` · `#/consult` · `#/login` | 자료실 · 상담 · 로그인 |
| `#/institutions/schools`, `#/institutions/centers` | 재외교육기관 |
| `#/return` | 귀국학생 편입학 |
| `#/universities` · `#/departments` | 대학정보 · 학과정보 |

## 새 페이지 추가 방법

1. `index.html`에 `<div class="info-overlay" id="xxxOverlay">…</div>` 추가
2. `js/app.js`의 `ALL_PAGES` 배열에 `'xxxOverlay'` 추가
3. `js/router.js`의 `ROUTES`에 `{ path: 'xxx', page: 'xxxOverlay', title: '화면 이름' }` 추가
4. 버튼이나 링크에서 `openPage('xxxOverlay')` 호출
5. 검색에 노출하려면 `js/search.js`의 `SEARCH_PAGES`에 항목 추가
