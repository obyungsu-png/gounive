-- =====================================================================
-- 재외국민 One Stop 서비스 · Supabase 스키마
-- Supabase 대시보드 → SQL Editor 에 전체를 붙여넣고 Run 하세요. (여러 번 실행해도 안전)
-- 모든 테이블에 RLS(행 수준 보안)를 켜서, 사용자는 자기 데이터만 읽고 쓸 수 있습니다.
-- =====================================================================

-- 1) 회원 프로필 (가입 시 이름·구분을 자동 저장)
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null default '',
  role       text not null default '학생' check (role in ('학생', '학부모')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "본인 프로필 조회" on public.profiles;
create policy "본인 프로필 조회" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "본인 프로필 수정" on public.profiles;
create policy "본인 프로필 수정" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- 가입하면 auth.users 의 메타데이터(name, role)로 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    case when new.raw_user_meta_data ->> 'role' = '학부모' then '학부모' else '학생' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) 특례 상담
create table if not exists public.consults (
  id            bigint generated always as identity primary key,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  field         text not null,
  teukrye_type  text not null,
  title         text not null check (char_length(title) between 1 and 80),
  body          text not null check (char_length(body) between 10 and 4000),
  is_public     boolean not null default false,
  status        text not null default '답변대기' check (status in ('답변대기', '답변완료')),
  answer        text,
  created_at    timestamptz not null default now()
);

create index if not exists consults_user_id_idx on public.consults (user_id, created_at desc);

alter table public.consults enable row level security;

-- 본인 글 + 공개된 글 조회
drop policy if exists "상담 조회" on public.consults;
create policy "상담 조회" on public.consults
  for select using (auth.uid() = user_id or is_public);

-- 본인 명의로만 등록, 답변 관련 칸은 사용자가 채울 수 없음
drop policy if exists "상담 등록" on public.consults;
create policy "상담 등록" on public.consults
  for insert with check (auth.uid() = user_id and status = '답변대기' and answer is null);

drop policy if exists "본인 상담 삭제" on public.consults;
create policy "본인 상담 삭제" on public.consults
  for delete using (auth.uid() = user_id);

-- 답변(answer, status)은 대시보드 Table Editor(관리자 권한)에서 입력합니다.

-- 3) 해외학교 성적 (사용자당 1행, JSON 통째로 저장)
create table if not exists public.grade_records (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.grade_records enable row level security;

drop policy if exists "본인 성적" on public.grade_records;
create policy "본인 성적" on public.grade_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4) 특례 준비 체크리스트 (사용자당 1행)
create table if not exists public.checklists (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  items      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.checklists enable row level security;

drop policy if exists "본인 체크리스트" on public.checklists;
create policy "본인 체크리스트" on public.checklists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5) 해외체류기간 계산기 입력값 (사용자당 1행)
create table if not exists public.stay_records (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.stay_records enable row level security;

drop policy if exists "본인 체류기록" on public.stay_records;
create policy "본인 체류기록" on public.stay_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 6) 회원 탈퇴: 로그인한 본인 계정을 삭제 (위 테이블은 on delete cascade로 함께 삭제됨)
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
