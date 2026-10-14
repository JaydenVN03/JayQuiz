create function public.admin_import_quiz_questions(
  p_quiz_id uuid,
  p_questions jsonb
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  quiz_status public.content_status;
  question_data jsonb;
  option_data jsonb;
  imported_question_id uuid;
  imported_count integer := 0;
  next_sort_order integer;
  option_count integer;
  correct_count integer;
  question_type text;
  question_difficulty text;
  question_points numeric;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;
  if jsonb_typeof(p_questions) is distinct from 'array' then
    raise exception 'Question import must be a JSON array';
  end if;
  if jsonb_array_length(p_questions) < 1
    or jsonb_array_length(p_questions) > 500 then
    raise exception 'Question import must contain between 1 and 500 rows';
  end if;

  select quiz.status
  into quiz_status
  from public.quizzes quiz
  where quiz.id = p_quiz_id
  for update;

  if not found then
    raise exception 'Quiz not found';
  end if;

  select coalesce(max(relation.sort_order), 0)
  into next_sort_order
  from public.quiz_questions relation
  where relation.quiz_id = p_quiz_id;

  for question_data in
    select item.value from jsonb_array_elements(p_questions) as item(value)
  loop
    if jsonb_typeof(question_data) is distinct from 'object'
      or jsonb_typeof(question_data -> 'content') is distinct from 'string'
      or length(trim(question_data ->> 'content')) = 0
      or length(question_data ->> 'content') > 10000 then
      raise exception 'Question import contains invalid question content';
    end if;

    question_type := question_data ->> 'type';
    if question_type is null
      or question_type not in ('single_choice', 'multiple_choice', 'true_false') then
      raise exception 'Question import contains an invalid question type';
    end if;

    question_difficulty := nullif(question_data ->> 'difficulty', '');
    if question_difficulty is not null
      and question_difficulty not in ('easy', 'medium', 'hard') then
      raise exception 'Question import contains an invalid difficulty';
    end if;

    question_points := coalesce(nullif(question_data ->> 'points', '')::numeric, 1);
    if question_points <= 0 or question_points > 99999.99 then
      raise exception 'Question import contains an invalid points value';
    end if;

    if jsonb_typeof(question_data -> 'options') is distinct from 'array' then
      raise exception 'Question import contains an invalid answer list';
    end if;

    option_count := jsonb_array_length(question_data -> 'options');
    if option_count < 2 or option_count > 10 then
      raise exception 'Question import answer lists must contain between 2 and 10 answers';
    end if;

    correct_count := 0;
    for option_data in
      select item.value from jsonb_array_elements(question_data -> 'options') as item(value)
    loop
      if jsonb_typeof(option_data) is distinct from 'object'
        or jsonb_typeof(option_data -> 'content') is distinct from 'string'
        or length(trim(option_data ->> 'content')) = 0
        or length(option_data ->> 'content') > 1000
        or jsonb_typeof(option_data -> 'is_correct') is distinct from 'boolean' then
        raise exception 'Question import contains an invalid answer';
      end if;
      if (option_data ->> 'is_correct')::boolean then
        correct_count := correct_count + 1;
      end if;
    end loop;

    if correct_count < 1
      or (question_type in ('single_choice', 'true_false') and correct_count <> 1)
      or (question_type = 'true_false' and option_count <> 2) then
      raise exception 'Question import answers do not match the question type';
    end if;

    insert into public.questions (
      content, type, explanation, difficulty, status
    )
    values (
      question_data ->> 'content',
      question_type::public.question_type,
      nullif(question_data ->> 'explanation', ''),
      question_difficulty::public.question_difficulty,
      case when quiz_status = 'published'
        then 'published'::public.content_status
        else 'draft'::public.content_status
      end
    )
    returning id into imported_question_id;

    insert into public.options (question_id, content, is_correct, sort_order)
    select imported_question_id,
           answer.value ->> 'content',
           (answer.value ->> 'is_correct')::boolean,
           answer.ordinality::integer
    from jsonb_array_elements(question_data -> 'options')
      with ordinality as answer(value, ordinality);

    next_sort_order := next_sort_order + 1;
    insert into public.quiz_questions (quiz_id, question_id, sort_order, points)
    values (p_quiz_id, imported_question_id, next_sort_order, question_points);

    imported_count := imported_count + 1;
  end loop;

  if quiz_status = 'published' then
    update public.quizzes
    set version = version + 1
    where id = p_quiz_id;
  end if;

  return imported_count;
end;
$$;

revoke all on function public.admin_import_quiz_questions(uuid, jsonb) from public, anon;
grant execute on function public.admin_import_quiz_questions(uuid, jsonb) to authenticated;

notify pgrst, 'reload schema';
