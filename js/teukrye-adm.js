/* ===== 특례전형정보 (유형 탭 · 필터) ===== */
let admType = '3년';

function setAdmType(type) {
  admType = type;
  document.querySelectorAll('#admTypeTabs .tab-btn').forEach(b => b.classList.toggle('active', b.textContent.startsWith(type)));
  document.getElementById('admBcCur').textContent = type + ' 특례';
  renderAdmTable();
  syncRoute('admOverlay', type === '12년' ? 1 : 0);
}

function renderAdmTable() {
  const kw = document.getElementById('admKeyword').value.trim();
  const method = document.getElementById('admMethod').value;
  const region = document.getElementById('admRegion').value;
  const rows = teukryeAdmData.filter(d =>
    d.type === admType &&
    (!kw || d.univ.includes(kw) || d.dept.includes(kw)) &&
    (!method || d.method.includes(method)) &&
    (!region || d.region === region));
  document.getElementById('admTotal').textContent = rows.length + '건';
  document.getElementById('admEmpty').style.display = rows.length ? 'none' : 'block';
  document.getElementById('admTableBody').innerHTML = rows.map(d => `
    <tr>
      <td><div class="univ-name-cell"><div class="univ-logo">${d.univ.charAt(0)}</div><span class="univ-name-text">${d.univ}</span></div></td>
      <td>${d.dept}</td>
      <td><div class="region-cell"><i class="fas fa-map-marker-alt"></i>${d.region}</div></td>
      <td><span class="adm-type-badge${d.type === '12년' ? ' blue' : ''}">${d.type} 특례</span></td>
      <td>${d.method.split('+').map(m => `<span class="adm-method">${m}</span>`).join('')}</td>
      <td><span class="comp-su">${d.comp}</span></td>
      <td><button class="adm-result-btn" onclick="openPage('univGradeOverlay')">결과 보기</button></td>
    </tr>`).join('');
}

function resetAdmFilters() {
  document.getElementById('admKeyword').value = '';
  document.getElementById('admMethod').value = '';
  document.getElementById('admRegion').value = '';
  renderAdmTable();
}

renderAdmTable();
