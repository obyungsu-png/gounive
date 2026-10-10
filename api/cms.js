/* Vercel 서버 함수: POST /api/cms — 실제 처리는 server/cms.js */
import { handleCms } from '../server/cms.js';

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ ok: false, error: 'POST만 지원합니다.' })); return; }
  let body;
  try { body = await readJson(req); } catch (e) { res.statusCode = 400; res.end(JSON.stringify({ ok: false, error: '요청 형식이 올바르지 않습니다.' })); return; }
  const out = await handleCms(body, { env: process.env });
  res.statusCode = out.status;
  res.end(JSON.stringify(out.body));
}
