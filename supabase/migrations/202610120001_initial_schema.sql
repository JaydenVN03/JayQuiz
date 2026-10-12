create type public.content_status as enum ('draft', 'published', 'archived');
create type public.question_type as enum ('single_choice', 'multiple_choice', 'true_false');
create type public.question_difficulty as enum ('easy', 'medium', 'hard');

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  status public.content_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete restrict,
  title text not null check (length(trim(title)) > 0),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  status public.content_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chapters_subject_slug_unique unique (subject_id, slug),
  constraint chapters_id_subject_unique unique (id, subject_id)
);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete restrict,
  chapter_id uuid,
  title text not null check (length(trim(title)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  status public.content_status not null default 'draft',
  time_limit_seconds integer check (time_limit_seconds is null or time_limit_seconds > 0),
  pass_score numeric(7, 2) check (pass_score is null or pass_score >= 0),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint quizzes_chapter_subject_fk
    foreign key (chapter_id, subject_id)
    references public.chapters(id, subject_id)
    on delete restrict
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  content text not null check (length(trim(content)) > 0),
  type public.question_type not null,
  explanation text,
  difficulty public.question_difficulty,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  content text not null check (length(trim(content)) > 0),
  is_correct boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint options_question_sort_order_unique unique (question_id, sort_order)
);

create table public.quiz_questions (
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  sort_order integer not null default 0,
  points numeric(7, 2) not null default 1 check (points > 0),
  primary key (quiz_id, question_id),
  constraint quiz_questions_sort_order_unique unique (quiz_id, sort_order)
);

create table public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role = 'admin'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index chapters_subject_status_order_idx
  on public.chapters (subject_id, status, sort_order);
create index quizzes_subject_status_idx
  on public.quizzes (subject_id, status);
create index quizzes_chapter_status_idx
  on public.quizzes (chapter_id, status);
create index questions_status_idx on public.questions (status);
create index quiz_questions_question_id_idx on public.quiz_questions (question_id);
create index options_question_id_idx on public.options (question_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subjects_set_updated_at
  before update on public.subjects
  for each row execute function public.set_updated_at();
create trigger chapters_set_updated_at
  before update on public.chapters
  for each row execute function public.set_updated_at();
create trigger quizzes_set_updated_at
  before update on public.quizzes
  for each row execute function public.set_updated_at();
create trigger questions_set_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();
create trigger options_set_updated_at
  before update on public.options
  for each row execute function public.set_updated_at();
create trigger admin_profiles_set_updated_at
  before update on public.admin_profiles
  for each row execute function public.set_updated_at();

create function public.validate_quiz_publication()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  question_count integer;
  invalid_question_count integer;
begin
  if new.status <> 'published' then
    return new;
  end if;

  if not exists (
    select 1
    from public.subjects subject
    where subject.id = new.subject_id
      and subject.status = 'published'
  ) then
    raise exception 'A quiz can only be published under a published subject';
  end if;

  if new.chapter_id is not null and not exists (
    select 1
    from public.chapters chapter
    where chapter.id = new.chapter_id
      and chapter.subject_id = new.subject_id
      and chapter.status = 'published'
  ) then
    raise exception 'A quiz can only be published under a published chapter';
  end if;

  select count(*)
  into question_count
  from public.quiz_questions
  where quiz_id = new.id;

  if question_count = 0 then
    raise exception 'A quiz must contain at least one question before publication';
  end if;

  select count(*)
  into invalid_question_count
  from public.quiz_questions quiz_question
  join public.questions question on question.id = quiz_question.question_id
  where quiz_question.quiz_id = new.id
    and (
      question.status <> 'published'
      or (select count(*) from public.options option where option.question_id = question.id) < 2
      or (select count(*) from public.options option
          where option.question_id = question.id and option.is_correct) = 0
      or (
        question.type in ('single_choice', 'true_false')
        and (select count(*) from public.options option
             where option.question_id = question.id and option.is_correct) <> 1
      )
      or (
        question.type = 'true_false'
        and (select count(*) from public.options option where option.question_id = question.id) <> 2
      )
    );

  if invalid_question_count > 0 then
    raise exception 'Every published quiz question needs valid published options and exactly one correct option for single-choice or true/false';
  end if;

  if tg_op = 'INSERT' then
    new.published_at = now();
  elsif old.status is distinct from new.status then
    new.published_at = now();
  end if;

  return new;
end;
$$;

create trigger quizzes_validate_publication
  before insert or update of status on public.quizzes
  for each row execute function public.validate_quiz_publication();

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select exists (
    select 1
    from public.admin_profiles profile
    where profile.user_id = (select auth.uid())
      and profile.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

alter table public.subjects enable row level security;
alter table public.chapters enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.options enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.admin_profiles enable row level security;

create policy "Admins manage subjects" on public.subjects
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins manage chapters" on public.chapters
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins manage quizzes" on public.quizzes
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins manage questions" on public.questions
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins manage options" on public.options
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins manage quiz questions" on public.quiz_questions
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Users read own admin profile" on public.admin_profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on table
  public.subjects,
  public.chapters,
  public.quizzes,
  public.questions,
  public.options,
  public.quiz_questions,
  public.admin_profiles
from public, anon, authenticated;

grant select, insert, update, delete on table
  public.subjects,
  public.chapters,
  public.quizzes,
  public.questions,
  public.options,
  public.quiz_questions
to authenticated;
grant select on table public.admin_profiles to authenticated;
grant usage on schema public to anon, authenticated;

-- These owner-executed views expose only published content and omit answer keys.
create view public.public_subjects
with (security_barrier = true)
as
select id, name, slug, description, sort_order
from public.subjects
where status = 'published';

create view public.public_chapters
with (security_barrier = true)
as
select chapter.id, chapter.subject_id, subject.slug as subject_slug,
       chapter.title, chapter.slug,
       chapter.description, chapter.sort_order
from public.chapters chapter
join public.subjects subject on subject.id = chapter.subject_id
where chapter.status = 'published'
  and subject.status = 'published';

create view public.public_quizzes
with (security_barrier = true)
as
select quiz.id, quiz.subject_id, subject.slug as subject_slug,
       subject.name as subject_name, quiz.chapter_id,
       chapter.slug as chapter_slug, chapter.title as chapter_title,
       quiz.title, quiz.slug, quiz.description, quiz.time_limit_seconds,
       quiz.pass_score, quiz.version, quiz.published_at
from public.quizzes quiz
join public.subjects subject on subject.id = quiz.subject_id
left join public.chapters chapter on chapter.id = quiz.chapter_id
where quiz.status = 'published'
  and subject.status = 'published'
  and (quiz.chapter_id is null or chapter.status = 'published');

create view public.public_quiz_content
with (security_barrier = true)
as
select quiz.id as quiz_id, quiz.slug as quiz_slug,
       quiz_question.question_id, question.content as question_content,
       question.type as question_type, question.difficulty,
       quiz_question.sort_order as question_sort_order,
       quiz_question.points, answer_option.id as option_id,
       answer_option.content as option_content,
       answer_option.sort_order as option_sort_order
from public.quizzes quiz
join public.subjects subject on subject.id = quiz.subject_id
join public.quiz_questions quiz_question on quiz_question.quiz_id = quiz.id
join public.questions question on question.id = quiz_question.question_id
join public.options answer_option
  on answer_option.question_id = question.id
left join public.chapters chapter on chapter.id = quiz.chapter_id
where quiz.status = 'published'
  and subject.status = 'published'
  and (quiz.chapter_id is null or chapter.status = 'published')
  and question.status = 'published';

revoke all on public.public_subjects, public.public_chapters,
  public.public_quizzes, public.public_quiz_content from public;
grant select on public.public_subjects, public.public_chapters,
  public.public_quizzes, public.public_quiz_content to anon, authenticated;

notify pgrst, 'reload schema';
