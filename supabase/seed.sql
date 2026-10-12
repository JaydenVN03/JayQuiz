insert into public.subjects (id, name, slug, description, status, sort_order)
values (
  '10000000-0000-4000-8000-000000000001',
  'Toán học',
  'toan-hoc',
  'Bộ dữ liệu mẫu để kiểm thử luồng xem môn học và làm bài.',
  'published',
  1
)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  status = excluded.status,
  sort_order = excluded.sort_order;

insert into public.chapters (id, subject_id, title, slug, description, status, sort_order)
values (
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'Số học cơ bản',
  'so-hoc-co-ban',
  'Các phép tính và tính chất cơ bản.',
  'published',
  1
)
on conflict (id) do update set
  subject_id = excluded.subject_id,
  title = excluded.title,
  slug = excluded.slug,
  description = excluded.description,
  status = excluded.status,
  sort_order = excluded.sort_order;

insert into public.questions (id, content, type, explanation, difficulty, status)
values
  (
    '30000000-0000-4000-8000-000000000001',
    'Kết quả của 7 × 8 là bao nhiêu?',
    'single_choice',
    '7 nhóm 8 đơn vị bằng 56.',
    'easy',
    'published'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    'Số nào là số nguyên tố?',
    'single_choice',
    'Số nguyên tố chỉ có hai ước dương là 1 và chính nó.',
    'easy',
    'published'
  )
on conflict (id) do update set
  content = excluded.content,
  type = excluded.type,
  explanation = excluded.explanation,
  difficulty = excluded.difficulty,
  status = excluded.status;

insert into public.options (id, question_id, content, is_correct, sort_order)
values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '54', false, 1),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', '56', true, 2),
  ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', '64', false, 3),
  ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000001', '48', false, 4),
  ('40000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000002', '21', false, 1),
  ('40000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000002', '29', true, 2),
  ('40000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000002', '35', false, 3),
  ('40000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000002', '39', false, 4)
on conflict (id) do update set
  question_id = excluded.question_id,
  content = excluded.content,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

insert into public.quizzes (
  id, subject_id, chapter_id, title, slug, description, status,
  time_limit_seconds, pass_score, version, published_at
)
values (
  '50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  'Phép tính cơ bản',
  'phep-tinh-co-ban',
  'Đề mẫu gồm hai câu hỏi trắc nghiệm.',
  'draft',
  300,
  1,
  1,
  null
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
  version = excluded.version,
  published_at = null;

insert into public.quiz_questions (quiz_id, question_id, sort_order, points)
values
  ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 1, 1),
  ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002', 2, 1)
on conflict (quiz_id, question_id) do update set
  sort_order = excluded.sort_order,
  points = excluded.points;

update public.quizzes
set status = 'published'
where id = '50000000-0000-4000-8000-000000000001';
