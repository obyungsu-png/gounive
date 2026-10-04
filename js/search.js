/* ===== 사이트 통합검색 (페이지 · 대학 · 특례전형 · 용어) ===== */
const SEARCH_PAGES = [
  { title: '재외국민 제도안내', desc: '3년·12년 특례 지원자격 비교', keys: '특례 자격 3년 12년 3특 12특 체류 부모 정원외 제도 지원자격 FAQ', run: () => openPage('systemOverlay') },
  { title: '특례전형정보', desc: '대학별 특례 전형방법 비교', keys: '전형 전형정보 필답 면접 서류 경쟁률 모집단위', run: () => openPage('admOverlay') },
  { title: '특례 준비 로드맵', desc: '학년별 준비 단계', keys: '준비 로드맵 학년 G9 G10 G11 G12 귀국 전략 프로그램', run: () => openProgram(0) },
  { title: '전형요소별 준비', desc: '필답고사·면접·서류', keys: '필답고사 필답 면접 서류 자기소개서 SAT IB AP TOPIK 한국어', run: () => openProgram(1) },
  { title: '특례 일정', desc: '모집요강·원서접수 흐름', keys: '일정 원서접수 모집요강 발표 합격 등록 전형일정', run: () => openProgram(2) },
  { title: '준비 체크리스트', desc: '10개 항목 점검', keys: '체크리스트 점검 준비물', run: () => openProgram(3) },
  { title: '특례 용어사전', desc: '아포스티유·영사확인 등', keys: '용어 용어사전 아포스티유 영사확인 번역공증 정원외 자격심사 외국인전형', run: () => openProgram(4) },
  { title: '해외학교 성적 입력', desc: 'GPA·IB·백분율 평균 계산', keys: '성적 GPA 학점 IB 백분율 계산 환산 해외성적 SAT TOEFL', run: () => openPage('gradeOverlay') },
  { title: '재외국민 대학별성적분석', desc: '전년도 입시결과', keys: '성적분석 입시결과 cut 환산점수 대학별', run: () => openPage('univGradeOverlay') },
  { title: '재외국민 대입정보자료실', desc: '모집요강·자료집', keys: '자료실 자료 모집요강 시행계획 설명회 다운로드', run: () => openPage('dataOverlay') },
  { title: '특례 입시상담', desc: '온라인 상담 신청', keys: '상담 질문 문의 1600-1615 전화', run: () => openPage('consultOverlay') },
  { title: '재외교육기관', desc: '한국학교·한국교육원', keys: '한국학교 한국교육원 재외교육기관 OKEP 교육원 국가', run: () => openPage('instOverlay') },
  { title: '귀국학생 편입학', desc: '학력인정·편입학 절차', keys: '귀국 편입 편입학 학력인정 학년 결정 재취학', run: () => openPage('returnOverlay') },
  { title: '서류준비 가이드', desc: '필수서류·인증·번역', keys: '서류 아포스티유 번역 출입국 재직증명 가족관계', run: () => openDocsGuide() },
  { title: '자격요건 입력 가이드', desc: '해외체류기간 입력 방법', keys: '자격요건 입력 체류기간 가이드', run: () => openGuideModal() },
  { title: '대학정보', desc: '전국 대학 목록', keys: '대학 대학정보 대학교', run: () => openPage('univOverlay') },
  { title: '학과정보', desc: '학과별 정보', keys: '학과 학과정보 전공', run: () => openPage('deptOverlay') }
];

function buildSearchResults(q) {
  const results = [];
  SEARCH_PAGES.forEach(p => {
    if (p.title.includes(q) || p.keys.toLowerCase().includes(q.toLowerCase())) results.push({ type: '메뉴', title: p.title, desc: p.desc, run: p.run });
  });
  const seen = new Set();
  teukryeAdmData.forEach(d => {
    if ((d.univ.includes(q) || d.dept.includes(q)) && !seen.has(d.univ + d.type)) {
      seen.add(d.univ + d.type);
      results.push({ type: '특례전형', title: d.univ, desc: `${d.type} 특례 · ${d.dept}`, run: () => { openPage('admOverlay', d.type === '12년' ? 1 : 0); document.getElementById('admKeyword').value = q; renderAdmTable(); } });
    }
  });
  univData.filter(u => u.name.includes(q)).slice(0, 5).forEach(u => {
    results.push({ type: '대학', title: u.name, desc: u.region, run: () => { openPage('univOverlay'); filterUnivTable(q); } });
  });
  return results.slice(0, 10);
}

let searchResults = [];
let searchActive = -1;

function renderSearchDropdown() {
  const box = document.getElementById('searchDropdown');
  const q = document.getElementById('siteSearch').value.trim();
  if (!q) { box.classList.remove('open'); return; }
  searchResults = buildSearchResults(q);
  searchActive = searchResults.length ? 0 : -1;
  box.innerHTML = searchResults.length
    ? searchResults.map((r, i) => `<button type="button" class="search-result${i === searchActive ? ' active' : ''}" data-js data-i="${i}"><span class="search-type">${r.type}</span><b>${r.title}</b><small>${r.desc}</small></button>`).join('')
    : `<div class="search-empty">'${q.replace(/[<>&"]/g, '')}'에 대한 검색 결과가 없어요.</div>`;
  box.classList.add('open');
}

function runSearchResult(i) {
  const r = searchResults[i];
  if (!r) return;
  document.getElementById('searchDropdown').classList.remove('open');
  document.getElementById('siteSearch').blur();
  r.run();
}

(function initSearch() {
  const input = document.getElementById('siteSearch');
  const box = document.getElementById('searchDropdown');
  input.addEventListener('input', renderSearchDropdown);
  input.addEventListener('focus', renderSearchDropdown);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); runSearchResult(Math.max(searchActive, 0)); }
    else if (e.key === 'Escape') { box.classList.remove('open'); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!searchResults.length) return;
      searchActive = (searchActive + (e.key === 'ArrowDown' ? 1 : -1) + searchResults.length) % searchResults.length;
      box.querySelectorAll('.search-result').forEach((b, i) => b.classList.toggle('active', i === searchActive));
    }
  });
  document.getElementById('searchBtn').addEventListener('click', () => { renderSearchDropdown(); runSearchResult(Math.max(searchActive, 0)); });
  box.addEventListener('mousedown', e => {
    const btn = e.target.closest('.search-result');
    if (btn) { e.preventDefault(); runSearchResult(Number(btn.dataset.i)); }
  });
  document.addEventListener('click', e => { if (!e.target.closest('.search-box')) box.classList.remove('open'); });
})();
