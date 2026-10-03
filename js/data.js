/* ====== 대학 데이터 ====== */
const univData = [
  { name:'가야대학교[본교]', region:'경남', su:'5.34', jeong:'3.56', capacity:405, dept:8, adm:18 },
  { name:'가천대학교[본교]', region:'경기', su:'29.85', jeong:'9.39', capacity:3938, dept:71, adm:31 },
  { name:'가톨릭관동대학교[본교]', region:'강원', su:'3.79', jeong:'3.59', capacity:1725, dept:36, adm:45 },
  { name:'가톨릭꽃동네대학교[본교]', region:'충북', su:'4.59', jeong:'2.79', capacity:108, dept:2, adm:19 },
  { name:'가톨릭대학교[본교]', region:'경기', su:'16.92', jeong:'5.73', capacity:1620, dept:49, adm:25 },
  { name:'가톨릭대학교[제2캠퍼스]', region:'서울', su:'35.01', jeong:'3.51', capacity:173, dept:2, adm:9 },
  { name:'가톨릭대학교[제3캠퍼스]', region:'서울', su:'1.3', jeong:'3.44', capacity:50, dept:1, adm:9 },
  { name:'감리교신학대학교[본교]', region:'서울', su:'1.46', jeong:'2.73', capacity:192, dept:1, adm:15 },
  { name:'강남대학교[본교]', region:'경기', su:'11.54', jeong:'6.72', capacity:1491, dept:27, adm:23 },
  { name:'강서대학교[본교]', region:'서울', su:'12.25', jeong:'9.07', capacity:277, dept:10, adm:17 },
  { name:'건국대학교[본교]', region:'서울', su:'22.14', jeong:'8.31', capacity:3201, dept:62, adm:38 },
  { name:'경희대학교[본교]', region:'서울', su:'31.50', jeong:'11.22', capacity:4102, dept:84, adm:52 },
  { name:'고려대학교[본교]', region:'서울', su:'41.20', jeong:'14.80', capacity:3580, dept:77, adm:46 },
  { name:'서울대학교[본교]', region:'서울', su:'38.60', jeong:'12.40', capacity:3200, dept:80, adm:55 },
  { name:'연세대학교[본교]', region:'서울', su:'36.90', jeong:'13.10', capacity:3400, dept:75, adm:48 },
];

/* ====== 학과 데이터 ====== */
const deptData = [
  { dept:'(국제)관광경영학과', univ:'서울신학대학교 [본교]', region:'경기', su:'0', jeong:'0', capacity:0 },
  { dept:'(국제)글로벌경영학과', univ:'서울신학대학교 [본교]', region:'경기', su:'0', jeong:'0', capacity:0 },
  { dept:'(국제)글로벌한국어학과', univ:'서울신학대학교 [본교]', region:'경기', su:'0', jeong:'0', capacity:0 },
  { dept:'(국제)컴퓨터공학과', univ:'서울신학대학교 [본교]', region:'경기', su:'0', jeong:'0', capacity:0 },
  { dept:'AI 모빌리티학과', univ:'남서울대학교 [본교]', region:'충남', su:'0', jeong:'0', capacity:30 },
  { dept:'AI 융합미디어학과', univ:'남서울대학교 [본교]', region:'충남', su:'4.51', jeong:'6.4', capacity:75 },
  { dept:'AI·SW계열', univ:'한신대학교 [본교]', region:'경기', su:'4.39', jeong:'6.54', capacity:215 },
  { dept:'AI·빅데이터학과', univ:'우송대학교 [본교]', region:'대전', su:'4.37', jeong:'0', capacity:16 },
  { dept:'국제학부', univ:'서울대학교 [본교]', region:'서울', su:'0', jeong:'3.5', capacity:36 },
  { dept:'글로벌인재학부', univ:'서울대학교 [본교]', region:'서울', su:'0', jeong:'0', capacity:0 },
  { dept:'재외국민특별전형학과', univ:'연세대학교 [본교]', region:'서울', su:'12.5', jeong:'8.3', capacity:45 },
  { dept:'국제통상학과', univ:'고려대학교 [본교]', region:'서울', su:'15.2', jeong:'9.1', capacity:60 },
  { dept:'글로벌비즈니스학과', univ:'성균관대학교 [본교]', region:'서울', su:'11.4', jeong:'7.6', capacity:40 },
  { dept:'한국어문학부', univ:'이화여자대학교 [본교]', region:'서울', su:'8.9', jeong:'5.2', capacity:55 },
  { dept:'경영학과', univ:'한양대학교 [본교]', region:'서울', su:'18.7', jeong:'10.3', capacity:120 },
];

/* ====== 특례전형 예시 데이터 (화면 구성용, 실제 모집요강 기준 아님) ====== */
const teukryeAdmData = [
  { univ:'연세대학교[본교]', dept:'경영학과', region:'서울', type:'3년', method:'서류+면접', comp:'8.4' },
  { univ:'연세대학교[본교]', dept:'경제학부', region:'서울', type:'12년', method:'서류', comp:'5.1' },
  { univ:'고려대학교[본교]', dept:'정치외교학과', region:'서울', type:'3년', method:'서류+면접', comp:'7.2' },
  { univ:'고려대학교[본교]', dept:'컴퓨터학과', region:'서울', type:'12년', method:'서류', comp:'4.6' },
  { univ:'서울대학교[본교]', dept:'경영대학', region:'서울', type:'12년', method:'서류', comp:'3.9' },
  { univ:'서울대학교[본교]', dept:'공과대학', region:'서울', type:'12년', method:'서류+면접', comp:'4.2' },
  { univ:'성균관대학교[본교]', dept:'글로벌경영학과', region:'서울', type:'3년', method:'필답+면접', comp:'9.8' },
  { univ:'성균관대학교[제2캠퍼스]', dept:'소프트웨어학과', region:'경기', type:'3년', method:'필답+면접', comp:'7.5' },
  { univ:'한양대학교[본교]', dept:'경영학부', region:'서울', type:'3년', method:'필답', comp:'11.3' },
  { univ:'한양대학교[본교]', dept:'기계공학부', region:'서울', type:'3년', method:'필답', comp:'6.7' },
  { univ:'서강대학교[본교]', dept:'경제학과', region:'서울', type:'3년', method:'서류+면접', comp:'6.1' },
  { univ:'중앙대학교[본교]', dept:'국제물류학과', region:'서울', type:'3년', method:'필답+면접', comp:'8.9' },
  { univ:'경희대학교[본교]', dept:'국제학과', region:'서울', type:'3년', method:'서류+면접', comp:'7.8' },
  { univ:'경희대학교[국제캠퍼스]', dept:'전자공학과', region:'경기', type:'12년', method:'서류', comp:'3.4' },
  { univ:'이화여자대학교[본교]', dept:'국제학부', region:'서울', type:'12년', method:'서류+면접', comp:'4.8' },
  { univ:'한국외국어대학교[본교]', dept:'영어통번역학부', region:'서울', type:'3년', method:'서류+면접', comp:'6.4' },
  { univ:'인하대학교[본교]', dept:'아태물류학부', region:'인천', type:'3년', method:'서류', comp:'5.2' },
  { univ:'건국대학교[본교]', dept:'경영학과', region:'서울', type:'3년', method:'서류', comp:'5.9' },
  { univ:'부산대학교[본교]', dept:'무역학부', region:'그 외 지역', type:'3년', method:'서류+면접', comp:'3.1' },
  { univ:'경북대학교[본교]', dept:'전자공학부', region:'그 외 지역', type:'12년', method:'서류', comp:'2.6' }
];
