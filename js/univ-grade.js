const UNIV_GRADE_TABS = [
  { label:'3년 특례', univs:[
    ['연세대학교[본교]',58], ['고려대학교[본교]',52], ['성균관대학교[본교]',41], ['한양대학교[본교]',38], ['서강대학교[본교]',24],
    ['중앙대학교[본교]',33], ['경희대학교[본교]',45], ['이화여자대학교[본교]',36], ['한국외국어대학교[본교]',29], ['건국대학교[본교]',27]
  ]},
  { label:'12년 특례', univs:[
    ['서울대학교[본교]',72], ['연세대학교[본교]',64], ['고려대학교[본교]',60], ['성균관대학교[본교]',47],
    ['한양대학교[본교]',44], ['서강대학교[본교]',28], ['경희대학교[본교]',51], ['이화여자대학교[본교]',40]
  ]}
];

function switchUnivGradeTab(idx) {
  const tab = UNIV_GRADE_TABS[idx];
  document.querySelectorAll('#univGradeOverlay .grade-tab-univ').forEach((t,i) => t.classList.toggle('active', i === idx));
  document.getElementById('ugBcCur').textContent = tab.label;
  document.getElementById('ugTotal').textContent = tab.univs.reduce((sum,u) => sum + u[1], 0) + '건';
  document.getElementById('ugTags').innerHTML = tab.univs.map(u => `<span class="univ-grade-tag">${u[0]} <strong>${u[1]}건</strong></span>`).join('');
  syncRoute('univGradeOverlay', idx);
}
switchUnivGradeTab(0);
