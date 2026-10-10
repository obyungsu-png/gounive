/* ===== CMS 인증 =====
   - 비밀번호는 코드에 평문으로 두지 않고 scrypt 해시만 둔다 (저장소가 공개이므로).
   - Vercel 환경변수 CMS_PASSWORD가 있으면 그 값을 우선 사용 (비밀번호를 바꿀 때).
   - 로그인하면 HMAC 서명 토큰을 발급하고, 이후 요청은 토큰으로 확인한다. */
import { scryptSync, createHmac, createHash, timingSafeEqual } from 'node:crypto';

const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const DEFAULT_SALT = '2cf0ce8ecee858d28339b8309f0b68e3';
const DEFAULT_HASH = '070fe126ed71d7ba11a09a8728a5a28bd3e4e20b77748a3d102592acde50170a';
const TOKEN_HOURS = 8;

const sha256 = s => createHash('sha256').update(String(s)).digest();
const same = (a, b) => a.length === b.length && timingSafeEqual(a, b);

export function verifyPassword(password, env = {}) {
  if (typeof password !== 'string' || !password || password.length > 200) return false;
  if (env.CMS_PASSWORD) return same(sha256(password), sha256(env.CMS_PASSWORD));
  return same(scryptSync(password, DEFAULT_SALT, 32, SCRYPT), Buffer.from(DEFAULT_HASH, 'hex'));
}

/* 서명 키: CMS_SESSION_SECRET, 없으면 서버에만 있는 GitHub 토큰에서 파생 */
function secret(env) {
  const base = env.CMS_SESSION_SECRET || env.GITHUB_TOKEN;
  if (!base) throw new Error('서버 설정이 없습니다 (GITHUB_TOKEN).');
  return sha256('gounive-cms-session|' + base);
}

export function issueToken(env, now = Date.now()) {
  const exp = String(now + TOKEN_HOURS * 3600 * 1000);
  const sig = createHmac('sha256', secret(env)).update(exp).digest('base64url');
  return { token: `${exp}.${sig}`, expires: Number(exp) };
}

export function verifyToken(token, env, now = Date.now()) {
  if (typeof token !== 'string') return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < now) return false;
  const expect = createHmac('sha256', secret(env)).update(exp).digest('base64url');
  return same(Buffer.from(sig), Buffer.from(expect));
}
