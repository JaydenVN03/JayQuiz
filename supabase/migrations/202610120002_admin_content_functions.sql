create function public.admin_save_quiz(
  p_quiz_id uuid,
  p_subject_id uuid,
  p_chapter_id uuid,
  p_title text,
  p_slug text,
  p_description text,
  p_status public.content_status,
  p_time_limit_seconds integer,
  p_pass_score numeric,
  p_version integer,
  p_questions jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;
  if jsonb_typeof(p_questions) <> 'array' then
    raise exception 'Quiz questions must be an array';
  end if;
  if length(trim(p_title)) = 0 or p_version < 1 then
    raise exception 'Quiz title and version are invalid';
  end if;

  insert into public.quizzes (
    id, subject_id, chapter_id, title, slug, description, status,
    time_limit_seconds, pass_score, version
  )
  values (
    p_quiz_id, p_subject_id, p_chapter_id, p_title, p_slug, p_description, 'draft',
    p_time_limit_seconds, p_pass_score, p_version
  )
  on conflict (id) do update set
    subject_id = excluded.subject_id,
    chapter_id = excluded.chapter_id,
    title = excluded.title,
    slug = excluded.slug,
    description = excluded.description,
    status = 'draft',
    time_limit_seconds = excluded.time_limit_seconds,
    pass_score = excluded.pass_score,
    version = excluded.version;

  delete from public.quiz_questions where quiz_id = p_quiz_id;
  insert into public.quiz_questions (quiz_id, question_id, sort_order, points)
  select p_quiz_id,
         (item.value ->> 'question_id')::uuid,
         (item.value ->> 'sort_order')::integer,
         (item.value ->> 'points')::numeric
  from jsonb_array_elements(p_questions) as item(value);

  update public.quizzes
  set status = p_status
  where id = p_quiz_id;
end;
$$;

create function public.admin_save_question(
  p_question_id uuid,
  p_content text,
  p_type public.question_type,
  p_explanation text,
  p_difficulty public.question_difficulty,
  p_status public.content_status,
  p_options jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  option_count integer;
  correct_count integer;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;
  if length(trim(p_content)) = 0 or jsonb_typeof(p_options) <> 'array' then
    raise exception 'Question content and options are required';
  end if;

  select count(*),
         count(*) filter (where coalesce((value ->> 'is_correct')::boolean, false))
  into option_count, correct_count
  from jsonb_array_elements(p_options);

  if option_count < 2
    or (p_type in ('single_choice', 'true_false') and correct_count <> 1)
    or (p_type = 'multiple_choice' and correct_count < 1)
    or (p_type = 'true_false' and option_count <> 2) then
    raise exception 'Question options do not match the selected question type';
  end if;

  if p_status <> 'published' and exists (
    select 1
    from public.quiz_questions quiz_question
    join public.quizzes quiz on quiz.id = quiz_question.quiz_id
    where quiz_question.question_id = p_question_id
      and quiz.status = 'published'
  ) then
    raise exception 'Unpublish linked quizzes before hiding this question';
  end if;

  insert into public.questions (id, content, type, explanation, difficulty, status)
  values (p_question_id, p_content, p_type, p_explanation, p_difficulty, p_status)
  on conflict (id) do update set
    content = excluded.content,
    type = excluded.type,
    explanation = excluded.explanation,
    difficulty = excluded.difficulty,
    status = excluded.status;

  delete from public.options where question_id = p_question_id;
  insert into public.options (question_id, content, is_correct, sort_order)
  select p_question_id,
         value ->> 'content',
         coalesce((value ->> 'is_correct')::boolean, false),
         (value ->> 'sort_order')::integer
  from jsonb_array_elements(p_options);

  update public.quizzes
  set status = status, version = version + 1
  where status = 'published'
    and id in (
      select quiz_id from public.quiz_questions where question_id = p_question_id
    );
end;
$$;

revoke all on function public.admin_save_quiz(
  uuid, uuid, uuid, text, text, text, public.content_status, integer, numeric, integer, jsonb
) from public, anon;
revoke all on function public.admin_save_question(
  uuid, text, public.question_type, text, public.question_difficulty, public.content_status, jsonb
) from public, anon;
grant execute on function public.admin_save_quiz(
  uuid, uuid, uuid, text, text, text, public.content_status, integer, numeric, integer, jsonb
) to authenticated;
grant execute on function public.admin_save_question(
  uuid, text, public.question_type, text, public.question_difficulty, public.content_status, jsonb
) to authenticated;

notify pgrst, 'reload schema';
