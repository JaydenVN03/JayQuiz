create or replace function public.admin_save_quiz(
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
  if p_questions is not null and jsonb_typeof(p_questions) is distinct from 'array' then
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

  if p_questions is not null then
    delete from public.quiz_questions where quiz_id = p_quiz_id;
    insert into public.quiz_questions (quiz_id, question_id, sort_order, points)
    select p_quiz_id,
           (item.value ->> 'question_id')::uuid,
           (item.value ->> 'sort_order')::integer,
           (item.value ->> 'points')::numeric
    from jsonb_array_elements(p_questions) as item(value);
  end if;

  update public.quizzes
  set status = p_status
  where id = p_quiz_id;
end;
$$;

notify pgrst, 'reload schema';
