/* ===== AI 요약·수정 제안 (선택 기능) =====
   Vercel 환경변수 ANTHROPIC_API_KEY가 있을 때만 동작.
   감지된 변경(새로 생긴 줄)과 사이트의 관련 데이터를 Claude에 보내
   한국어 요약 + 반영 여부 의견 + 항목별 수정 제안(JSON)을 받는다.
   제안은 화면에서 사람이 확인하고 '편집기에 넣기'를 눌러야만 쓰이며, 자동으로 저장되지 않는다. */

const MODEL = 'claude-opus-5-5';

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'importance', 'recommendation', 'reason', 'suggestions'],
  properties: {
    summary: { type: 'string', description: '무엇이 바뀌었는지 한국어 2~4문장' },
    importance: { type: 'string', enum: ['high', 'medium', 'low'] },
    recommendation: { type: 'string', enum: ['apply', 'reference', 'ignore'] },
    reason: { type: 'string', description: '추천 이유 한국어 1~2문장' },
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['file', 'match', 'field', 'current', 'proposed', 'why'],
        properties: {
          file: { type: 'string', enum: ['src/data/teukrye-admissions.json', 'src/data/library.json'] },
          match: { type: 'string', description: '대상 항목 식별값. 특례전형은 "대학명|3년" 또는 "대학명|12년", 자료실은 해당 항목 url' },
          field: { type: 'string', description: '바꿀 칸 이름 (예: quota, method, schedule, title, desc, year, url)' },
          current: { type: 'string' },
          proposed: { type: 'string' },
          why: { type: 'string' }
        }
      }
    }
  }
};

const SYSTEM = `당신은 재외국민 특별전형(3년·12년 특례) 정보 사이트의 편집 보조입니다.
참조 사이트에서 새로 생긴 텍스트 줄과, 사이트에 현재 저장된 관련 데이터를 받습니다.
1) 무엇이 바뀌었는지 한국어로 짧게 요약하고, 2) 사이트에 반영할지(apply), 참고만 할지(reference), 무시할지(ignore) 추천하고,
3) 반영이 필요하면 현재 데이터의 어느 칸을 어떤 값으로 바꾸면 되는지 제안하세요.
- 새로 생긴 줄에 근거가 있는 내용만 제안하고, 추측으로 숫자나 날짜를 만들지 마세요.
- 메뉴·배너·방문자 수처럼 입시 정보와 관계없는 변화는 ignore로 판단하세요.
- 제안 값은 현재 데이터의 표기 방식(예: "원서 7.6~7.8 · 발표 9.4")을 따르세요.
- 관련 데이터가 없거나 바꿀 칸이 없으면 suggestions는 빈 배열로 두세요.`;

/* 변경과 관련된 현재 데이터 찾기 (같은 주소 또는 제목에 대학명이 들어간 항목) */
async function relatedData(update, gh) {
  const read = async path => { const f = await gh.getFile(path); return f ? JSON.parse(f.content) : null; };
  const [adm, lib] = await Promise.all([read('src/data/teukrye-admissions.json'), read('src/data/library.json')]);
  const univName = u => u.replace(/\(.*\)/, '').replace(/대학교.*/, '');
  const rows = ((adm && adm.rows) || []).filter(r => r.url === update.url || (update.title || '').includes(univName(r.univ)));
  const items = (lib || []).filter(it => it.url === update.url);
  return { admissions: rows, library: items };
}

/* 클라이언트 만들기. ANTHROPIC_BASE_URL을 넣으면 그 주소(중계 서버 등)로 보냄.
   중계 서버는 인증 방식이 제각각이라 x-api-key와 Authorization: Bearer를 함께 보낸다. */
async function makeClient(env, fetchImpl) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const base = String(env.ANTHROPIC_BASE_URL || '').trim().replace(/\/+$/, '').replace(/\/v1$/, '');
  const relay = !!base && !/^https:\/\/api\.anthropic\.com$/i.test(base);
  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    ...(base ? { baseURL: base } : {}),
    ...(relay ? { authToken: env.ANTHROPIC_API_KEY } : {}),
    fetch: fetchImpl,
    maxRetries: 0,
    timeout: 50 * 1000            // Vercel 함수 제한(60초) 안에서 끝나도록
  });
  let via = 'api.anthropic.com';
  if (relay) { try { via = new URL(base).host; } catch (e) { via = base; } }
  return { Anthropic, client, relay, via };
}

/* SDK 오류 → 운영자가 할 일을 알려 주는 한국어 메시지 */
function friendly(Anthropic, e, via) {
  if (e instanceof Anthropic.AuthenticationError) return Object.assign(new Error(`AI 키가 거부되었습니다 (${via}). Vercel의 ANTHROPIC_API_KEY를 확인해 주세요.`), { status: 502 });
  if (e instanceof Anthropic.PermissionDeniedError) return Object.assign(new Error(`AI 키에 이 기능을 쓸 권한이 없습니다 (${via}).`), { status: 502 });
  if (e instanceof Anthropic.NotFoundError) return Object.assign(new Error(`AI 모델이나 주소를 찾을 수 없습니다 (${via}). ANTHROPIC_MODEL·ANTHROPIC_BASE_URL을 확인해 주세요.`), { status: 502 });
  if (e instanceof Anthropic.RateLimitError) return Object.assign(new Error('AI 사용량 한도에 걸렸습니다. 잠시 뒤 다시 시도해 주세요.'), { status: 429 });
  if (e instanceof Anthropic.APIConnectionTimeoutError) return Object.assign(new Error(`AI 응답 시간이 초과되었습니다 (${via}). 다시 시도해 주세요.`), { status: 504 });
  if (e instanceof Anthropic.APIConnectionError) return Object.assign(new Error(`AI 서버(${via})에 연결하지 못했습니다. ANTHROPIC_BASE_URL을 확인해 주세요.`), { status: 502 });
  if (e instanceof Anthropic.APIError) return Object.assign(new Error(`AI 서버 오류 (${via}, ${e.status || '-'}): ${String(e.message || '').slice(0, 200)}`), { status: 502 });
  return e;
}

/* 응답 글에서 JSON만 꺼내기 (호환 모드는 ```json … ``` 으로 감싸 오기도 함) */
function parseJsonText(text) {
  const t = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  return JSON.parse(a >= 0 && b > a ? t.slice(a, b + 1) : t);
}

function checkStop(response) {
  if (response.stop_reason === 'refusal') throw Object.assign(new Error('AI가 이 내용의 분석을 거절했습니다. 원문을 직접 확인해 주세요.'), { status: 422 });
  if (response.stop_reason === 'max_tokens') throw new Error('AI 응답이 너무 길어 중간에 끊겼습니다. 다시 시도해 주세요.');
}
const textOf = response => response.content.filter(b => b.type === 'text').map(b => b.text).join('');

export async function aiSuggest(update, { gh, env, fetchImpl = fetch }) {
  const { Anthropic, client, via } = await makeClient(env, fetchImpl);
  const model = env.ANTHROPIC_MODEL || MODEL;
  const related = await relatedData(update, gh);
  const changeText = update.kind === 'html'
    ? `새로 생긴 줄 ${update.addedCount}개 (최대 60개 표시), 없어진 줄 ${update.removedCount}개:\n${(update.added || []).map(l => '+ ' + l).join('\n')}`
    : `HTML이 아닌 파일(PDF 등)이 바뀌었습니다. 크기 ${update.sizeFrom} → ${update.sizeTo} 바이트. 본문은 확인하지 못했습니다.`;
  const messages = [{
    role: 'user',
    content: `참조 사이트: ${update.title}\n주소: ${update.url}\n감지 시각: ${update.detectedAt}\n\n${changeText}\n\n사이트의 현재 관련 데이터(JSON):\n${JSON.stringify(related, null, 1)}`
  }];

  let response, mode = 'full';
  try {
    response = await client.beta.messages.create({
      model, max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',                       // 안전 분류기가 거절하면 서버가 다른 모델로 다시 시도
      system: SYSTEM,
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
      messages
    });
  } catch (e) {
    // 중계 서버 등이 최신 옵션(fallbacks·구조화 출력)을 모르면 400 → 기본 요청으로 한 번 더
    if (!(e instanceof Anthropic.BadRequestError)) throw friendly(Anthropic, e, via);
    mode = 'compat';
    try {
      response = await client.messages.create({
        model, max_tokens: 16000,
        system: `${SYSTEM}\n\n반드시 아래 JSON 스키마에 맞는 JSON 객체 하나만 출력하고, 다른 설명은 쓰지 마세요.\n${JSON.stringify(SCHEMA)}`,
        messages
      });
    } catch (e2) { throw friendly(Anthropic, e2, via); }
  }
  checkStop(response);
  let result;
  try { result = mode === 'full' ? JSON.parse(textOf(response)) : parseJsonText(textOf(response)); }
  catch (e) { throw new Error('AI 응답을 해석하지 못했습니다. 다시 시도해 주세요.'); }
  if (!result || typeof result.summary !== 'string') throw new Error('AI 응답 형식이 예상과 다릅니다. 다시 시도해 주세요.');
  result.suggestions = Array.isArray(result.suggestions) ? result.suggestions : [];
  return { suggestion: result, model: response.model, mode, via };
}

/* CMS의 'AI 연결 확인' 버튼: 아주 짧은 요청으로 키·주소·모델이 맞는지 확인 */
export async function aiTest({ env, fetchImpl = fetch }) {
  const { Anthropic, client, via } = await makeClient(env, fetchImpl);
  const model = env.ANTHROPIC_MODEL || MODEL;
  try {
    const response = await client.messages.create({
      model, max_tokens: 1024,
      messages: [{ role: 'user', content: '연결 확인입니다. "연결됨" 한 단어로만 답하세요.' }]
    });
    return { via, model: response.model || model, reply: textOf(response).trim().slice(0, 100), stop: response.stop_reason };
  } catch (e) { throw friendly(Anthropic, e, via); }
}
