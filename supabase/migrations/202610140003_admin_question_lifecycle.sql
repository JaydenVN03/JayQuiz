create function public.admin_add_quiz_question(
  p_quiz_id uuid,
  p_question_id uuid,
  p_content text,
  p_type public.question_type,
  p_explanation text,
  p_difficulty public.question_difficulty,
  p_status public.content_status,
  p_options jsonb
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  quiz_status public.content_status;
  next_sort_order integer;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select quiz.status
  into quiz_status
  from public.quizzes quiz
  where quiz.id = p_quiz_id
  for update;

  if not found then
    raise exception 'Quiz not found';
  end if;
  if quiz_status = 'published' and p_status <> 'published' then
    raise exception 'A published quiz requires published questions';
  end if;

  perform public.admin_save_question(
    p_question_id,
    p_content,
    p_type,
    p_explanation,
    p_difficulty,
    p_status,
    p_options
  );

  select coalesce(max(relation.sort_order), 0) + 1
  into next_sort_order
  from public.quiz_questions relation
  where relation.quiz_id = p_quiz_id;

  insert into public.quiz_questions (quiz_id, question_id, sort_order, points)
  values (p_quiz_id, p_question_id, next_sort_order, 1);

  if quiz_status = 'published' then
    update public.quizzes
    set version = version + 1
    where id = p_quiz_id;
  end if;

  return next_sort_order;
end;
$$;

create function public.admin_delete_questions(p_question_ids uuid[])
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  requested_count integer;
  found_count integer;
  affected_quiz_ids uuid[];
  affected_quiz_id uuid;
  sort_offset bigint;
  deleted_count integer;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;
  if p_question_ids is null then
    raise exception 'Question ids are required';
  end if;

  select count(*) into requested_count
  from (select distinct question_id from unnest(p_question_ids) as ids(question_id)) unique_ids;

  if requested_count = 0 then
    raise exception 'At least one question id is required';
  end if;

  select count(*) into found_count
  from public.questions question
  where question.id = any(p_question_ids);

  if found_count <> requested_count then
    raise exception 'One or more questions were not found';
  end if;

  select coalesce(array_agg(quiz_id order by quiz_id), array[]::uuid[])
  into affected_quiz_ids
  from (
    select distinct relation.quiz_id
    from public.quiz_questions relation
    where relation.question_id = any(p_question_ids)
  ) affected;

  perform 1
  from public.quizzes quiz
  where quiz.id = any(affected_quiz_ids)
  order by quiz.id
  for update;

  delete from public.quiz_questions relation
  where relation.question_id = any(p_question_ids);

  foreach affected_quiz_id in array affected_quiz_ids loop
    select coalesce(max(relation.sort_order), 0) + count(*) + 1
    into sort_offset
    from public.quiz_questions relation
    where relation.quiz_id = affected_quiz_id;

    update public.quiz_questions relation
    set sort_order = relation.sort_order + sort_offset
    where relation.quiz_id = affected_quiz_id;

    with ordered_questions as (
      select relation.question_id,
             row_number() over (order by relation.sort_order, relation.question_id)::integer as new_sort_order
      from public.quiz_questions relation
      where relation.quiz_id = affected_quiz_id
    )
    update public.quiz_questions relation
    set sort_order = ordered_questions.new_sort_order
    from ordered_questions
    where relation.quiz_id = affected_quiz_id
      and relation.question_id = ordered_questions.question_id;
  end loop;

  update public.quizzes quiz
  set version = version + 1
  where quiz.id = any(affected_quiz_ids)
    and quiz.status = 'published';

  delete from public.questions question
  where question.id = any(p_question_ids);
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.admin_add_quiz_question(
  uuid, uuid, text, public.question_type, text, public.question_difficulty,
  public.content_status, jsonb
) from public, anon;
revoke all on function public.admin_delete_questions(uuid[]) from public, anon;
grant execute on function public.admin_add_quiz_question(
  uuid, uuid, text, public.question_type, text, public.question_difficulty,
  public.content_status, jsonb
) to authenticated;
grant execute on function public.admin_delete_questions(uuid[]) to authenticated;

notify pgrst, 'reload schema';
