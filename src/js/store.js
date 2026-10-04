/* ===== 데이터 저장소 =====
   APP_CONFIG에 Supabase 값이 있으면 서버에 저장하고, 없으면 데모 모드(localStorage)로 동작합니다.
   화면 코드는 항상 Store를 통해서만 회원·상담·성적·체크리스트에 접근합니다. */
import { APP_CONFIG } from './config.js';
import { showToast } from './ui.js';

export const Store = (() => {
  const cfg = APP_CONFIG;
  const isServer = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  let client = null;
  let initPromise = null;

  const KEYS = { user: 'teukrye-demo-user', consults: 'teukrye-consults', grades: 'teukrye-overseas-grades', checklist: 'teukrye-checklist', stay: 'teukrye-stay' };
  // 로그인 사용자별 1행으로 저장하는 데이터: kind → [테이블, JSON 칸]
  const TABLES = { grades: ['grade_records', 'data'], checklist: ['checklists', 'items'], stay: ['stay_records', 'data'] };
  const local = {
    get(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v === null ? fallback : v; } catch (e) { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} },
    remove(key) { try { localStorage.removeItem(key); } catch (e) {} }
  };

  let user = null;
  let ready = false;
  const listeners = [];
  const recoveryListeners = [];
  const timers = {};

  function emit() { listeners.forEach(fn => fn(user)); }
  function later(key, fn) { clearTimeout(timers[key]); timers[key] = setTimeout(fn, 600); }

  /* Supabase 오류 메시지 → 한국어 */
  function friendly(error) {
    const m = (error && error.message) || '';
    if (/Invalid login credentials/i.test(m)) return '이메일 또는 비밀번호가 올바르지 않습니다.';
    if (/Email not confirmed/i.test(m)) return '이메일 인증을 완료한 뒤 로그인해주세요.';
    if (/already registered|already been registered/i.test(m)) return '이미 가입된 이메일입니다.';
    if (/at least 6 characters|Password should be/i.test(m)) return '비밀번호는 6자 이상이어야 합니다.';
    if (/rate limit|too many/i.test(m)) return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
    if (/Failed to fetch|NetworkError/i.test(m)) return '서버에 연결하지 못했습니다. 인터넷 연결을 확인해주세요.';
    return '요청을 처리하지 못했습니다. ' + m;
  }
  function fail(error) { throw new Error(friendly(error)); }

  async function loadProfile(u) {
    if (!u) return null;
    const meta = u.user_metadata || {};
    const { data } = await client.from('profiles').select('name, role').eq('id', u.id).maybeSingle();
    return {
      id: u.id,
      email: u.email,
      name: (data && data.name) || meta.name || u.email.split('@')[0],
      role: (data && data.role) || meta.role || '학생'
    };
  }

  async function init() {
    if (!isServer) {
      const saved = local.get(KEYS.user, null);
      // 이전 데모 형식({id, role}) 호환
      user = saved ? { id: 'demo', email: saved.email || '', name: saved.name || saved.id, role: saved.role || '학생' } : null;
      ready = true;
      emit();
      return;
    }
    // supabase-js는 서버 모드에서만 불러옴 (데모 모드 용량 절약)
    const { createClient } = await import('@supabase/supabase-js');
    client = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
      auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true }
    });
    const { data } = await client.auth.getSession();
    user = await loadProfile(data.session && data.session.user);
    ready = true;
    emit();
    client.auth.onAuthStateChange((event, session) => {
      // 콜백 안에서 바로 다른 Supabase 호출을 하지 않도록 다음 틱으로 미룸
      setTimeout(async () => {
        if (event === 'PASSWORD_RECOVERY') recoveryListeners.forEach(fn => fn());
        // 같은 사용자의 세션 갱신(탭 복귀 등)은 무시
        if (event === 'SIGNED_IN' && user && session && session.user.id === user.id) return;
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          user = await loadProfile(session && session.user);
          emit();
        }
      }, 0);
    });
  }

  return {
    isServer,
    getUser: () => user,
    onChange(fn) { listeners.push(fn); if (ready) fn(user); },
    onRecovery(fn) { recoveryListeners.push(fn); },
    init() { initPromise = init(); return initPromise; },
    ready: () => initPromise,

    /* ----- 회원 ----- */
    async signIn(email, password) {
      if (isServer) await initPromise;
      if (!isServer) {
        user = { id: 'demo', email, name: email.split('@')[0], role: (local.get(KEYS.user, {}) || {}).role || '학생' };
        local.set(KEYS.user, user);
        emit();
        return user;
      }
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) fail(error);
      user = await loadProfile(data.user);
      emit();
      return user;
    },
    async signUp({ email, password, name, role }) {
      if (isServer) await initPromise;
      if (!isServer) {
        user = { id: 'demo', email, name, role };
        local.set(KEYS.user, user);
        emit();
        return { needsConfirm: false };
      }
      const { data, error } = await client.auth.signUp({
        email, password,
        options: { data: { name, role }, emailRedirectTo: location.origin + location.pathname }
      });
      if (error) fail(error);
      if (data.session) { user = await loadProfile(data.user); emit(); }
      return { needsConfirm: !data.session };
    },
    async signOut() {
      if (isServer) await initPromise;
      if (isServer) {
        await client.auth.signOut();
        // 공용 PC 대비: 서버 모드에서는 로그아웃 시 이 기기의 사본도 삭제
        Object.keys(TABLES).forEach(kind => local.remove(KEYS[kind]));
      }
      local.remove(KEYS.user);
      user = null;
      emit();
    },
    async resetPassword(email) {
      if (isServer) await initPromise;
      if (!isServer) throw new Error('데모 모드에서는 비밀번호 찾기를 사용할 수 없습니다.');
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname + '#/login/update' });
      if (error) fail(error);
    },
    async updatePassword(password) {
      if (isServer) await initPromise;
      if (!isServer) throw new Error('데모 모드에서는 비밀번호 변경을 사용할 수 없습니다.');
      const { error } = await client.auth.updateUser({ password });
      if (error) fail(error);
    },

    /* ----- 상담 ----- */
    async listConsults(scope) {
      if (isServer) await initPromise;
      if (!isServer) return local.get(KEYS.consults, []).map(c => Object.assign({ mine: true, status: '답변대기' }, c));
      let q = client.from('consults').select('id, user_id, field, teukrye_type, title, body, is_public, status, answer, created_at').order('created_at', { ascending: false }).limit(50);
      if (scope === 'mine') q = q.eq('user_id', user ? user.id : '00000000-0000-0000-0000-000000000000');
      const { data, error } = await q;
      if (error) fail(error);
      return data.map(r => ({
        field: r.field, type: r.teukrye_type, title: r.title, body: r.body, open: r.is_public,
        status: r.status, answer: r.answer, mine: !!user && r.user_id === user.id,
        date: new Date(r.created_at).toLocaleDateString('ko-KR')
      }));
    },
    async addConsult(c) {
      if (isServer) await initPromise;
      if (!isServer) {
        const list = local.get(KEYS.consults, []);
        list.unshift(Object.assign({ date: new Date().toLocaleDateString('ko-KR') }, c));
        local.set(KEYS.consults, list);
        return;
      }
      const { error } = await client.from('consults').insert({ field: c.field, teukrye_type: c.type, title: c.title, body: c.body, is_public: c.open });
      if (error) fail(error);
    },

    /* ----- 해외학교 성적 / 체크리스트 / 체류기록 (로컬 캐시 + 로그인 시 서버 동기화) ----- */
    loadLocal(kind, fallback) { return local.get(KEYS[kind], fallback); },
    async loadRemote(kind) {
      if (isServer) await initPromise;
      if (!isServer || !user) return null;
      const [table, col] = TABLES[kind];
      const { data, error } = await client.from(table).select(col).eq('user_id', user.id).maybeSingle();
      if (error) { console.warn(friendly(error)); return null; }
      return data ? data[col] : null;
    },
    save(kind, value) {
      local.set(KEYS[kind], value);
      if (!isServer || !user) return;
      const [table, col] = TABLES[kind];
      later(kind, async () => {
        await initPromise;
        if (!client) return;
        const { error } = await client.from(table).upsert({ user_id: user.id, [col]: value, updated_at: new Date().toISOString() });
        if (error) showToast(friendly(error));
      });
    }
  };
})();

Store.init().catch(e => console.warn('Store init failed', e));
