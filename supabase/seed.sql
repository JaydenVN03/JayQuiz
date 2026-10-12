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

insert into public.chapters (id, subject_id, title, slug, description, status, sort_order)
values
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'Phân số và số thập phân',
    'phan-so-va-so-thap-phan',
    'Luyện tập phép tính với phân số và số thập phân.',
    'published',
    2
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'Hình học cơ bản',
    'hinh-hoc-co-ban',
    'Ôn tập chu vi, diện tích và các tính chất hình học.',
    'published',
    3
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
    '30000000-0000-4000-8000-000000000003',
    'Tổng của 3/4 và 1/8 bằng bao nhiêu?',
    'single_choice',
    'Quy đồng 3/4 thành 6/8, rồi cộng 6/8 + 1/8 = 7/8.',
    'easy',
    'published'
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '2/5 của 30 bằng bao nhiêu?',
    'single_choice',
    'Ta tính 30 × 2/5 = 12.',
    'easy',
    'published'
  ),
  (
    '30000000-0000-4000-8000-000000000005',
    'Kết quả của 0,6 × 0,5 là bao nhiêu?',
    'single_choice',
    '6 phần mười nhân 5 phần mười bằng 30 phần một trăm, tức 0,3.',
    'easy',
    'published'
  ),
  (
    '30000000-0000-4000-8000-000000000006',
    'Tổng của 2,75 và 1,2 bằng bao nhiêu?',
    'single_choice',
    'Viết 1,2 thành 1,20 rồi cộng được 3,95.',
    'medium',
    'published'
  ),
  (
    '30000000-0000-4000-8000-000000000007',
    'Hình chữ nhật có chiều dài 8 cm và chiều rộng 5 cm. Chu vi là bao nhiêu?',
    'single_choice',
    'Chu vi hình chữ nhật là 2 × (8 + 5) = 26 cm.',
    'easy',
    'published'
  ),
  (
    '30000000-0000-4000-8000-000000000008',
    'Hình vuông có cạnh dài 6 cm. Diện tích là bao nhiêu?',
    'single_choice',
    'Diện tích hình vuông là 6 × 6 = 36 cm².',
    'easy',
    'published'
  ),
  (
    '30000000-0000-4000-8000-000000000009',
    'Một tam giác có hai góc lần lượt là 50° và 60°. Góc còn lại bằng bao nhiêu?',
    'single_choice',
    'Tổng ba góc trong tam giác bằng 180°, nên góc còn lại là 180° - 50° - 60° = 70°.',
    'medium',
    'published'
  ),
  (
    '30000000-0000-4000-8000-000000000010',
    'Hình hộp chữ nhật có bao nhiêu mặt?',
    'single_choice',
    'Hình hộp chữ nhật có 6 mặt.',
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
  ('40000000-0000-4000-8000-000000000009', '30000000-0000-4000-8000-000000000003', '5/8', false, 1),
  ('40000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000003', '7/8', true, 2),
  ('40000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000003', '1', false, 3),
  ('40000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000003', '4/8', false, 4),
  ('40000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000004', '10', false, 1),
  ('40000000-0000-4000-8000-000000000014', '30000000-0000-4000-8000-000000000004', '12', true, 2),
  ('40000000-0000-4000-8000-000000000015', '30000000-0000-4000-8000-000000000004', '15', false, 3),
  ('40000000-0000-4000-8000-000000000016', '30000000-0000-4000-8000-000000000004', '20', false, 4),
  ('40000000-0000-4000-8000-000000000017', '30000000-0000-4000-8000-000000000005', '0,03', false, 1),
  ('40000000-0000-4000-8000-000000000018', '30000000-0000-4000-8000-000000000005', '0,3', true, 2),
  ('40000000-0000-4000-8000-000000000019', '30000000-0000-4000-8000-000000000005', '3', false, 3),
  ('40000000-0000-4000-8000-000000000020', '30000000-0000-4000-8000-000000000005', '1,1', false, 4),
  ('40000000-0000-4000-8000-000000000021', '30000000-0000-4000-8000-000000000006', '3,85', false, 1),
  ('40000000-0000-4000-8000-000000000022', '30000000-0000-4000-8000-000000000006', '3,95', true, 2),
  ('40000000-0000-4000-8000-000000000023', '30000000-0000-4000-8000-000000000006', '4,07', false, 3),
  ('40000000-0000-4000-8000-000000000024', '30000000-0000-4000-8000-000000000006', '3,15', false, 4),
  ('40000000-0000-4000-8000-000000000025', '30000000-0000-4000-8000-000000000007', '13 cm', false, 1),
  ('40000000-0000-4000-8000-000000000026', '30000000-0000-4000-8000-000000000007', '26 cm', true, 2),
  ('40000000-0000-4000-8000-000000000027', '30000000-0000-4000-8000-000000000007', '40 cm', false, 3),
  ('40000000-0000-4000-8000-000000000028', '30000000-0000-4000-8000-000000000007', '80 cm', false, 4),
  ('40000000-0000-4000-8000-000000000029', '30000000-0000-4000-8000-000000000008', '12 cm²', false, 1),
  ('40000000-0000-4000-8000-000000000030', '30000000-0000-4000-8000-000000000008', '24 cm²', false, 2),
  ('40000000-0000-4000-8000-000000000031', '30000000-0000-4000-8000-000000000008', '36 cm²', true, 3),
  ('40000000-0000-4000-8000-000000000032', '30000000-0000-4000-8000-000000000008', '18 cm²', false, 4),
  ('40000000-0000-4000-8000-000000000033', '30000000-0000-4000-8000-000000000009', '60°', false, 1),
  ('40000000-0000-4000-8000-000000000034', '30000000-0000-4000-8000-000000000009', '70°', true, 2),
  ('40000000-0000-4000-8000-000000000035', '30000000-0000-4000-8000-000000000009', '80°', false, 3),
  ('40000000-0000-4000-8000-000000000036', '30000000-0000-4000-8000-000000000009', '90°', false, 4),
  ('40000000-0000-4000-8000-000000000037', '30000000-0000-4000-8000-000000000010', '4 mặt', false, 1),
  ('40000000-0000-4000-8000-000000000038', '30000000-0000-4000-8000-000000000010', '5 mặt', false, 2),
  ('40000000-0000-4000-8000-000000000039', '30000000-0000-4000-8000-000000000010', '6 mặt', true, 3),
  ('40000000-0000-4000-8000-000000000040', '30000000-0000-4000-8000-000000000010', '8 mặt', false, 4)
on conflict (id) do update set
  question_id = excluded.question_id,
  content = excluded.content,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

insert into public.quizzes (
  id, subject_id, chapter_id, title, slug, description, status,
  time_limit_seconds, pass_score, version, published_at
)
values
  (
    '50000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    'Luyện tập phân số',
    'luyen-tap-phan-so',
    'Củng cố phép cộng phân số và tìm phân số của một số.',
    'draft',
    300,
    1,
    1,
    null
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    'Thử thách số thập phân',
    'thu-thach-so-thap-phan',
    'Luyện nhân và cộng các số thập phân.',
    'draft',
    300,
    1,
    1,
    null
  ),
  (
    '50000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000003',
    'Chu vi và diện tích',
    'chu-vi-va-dien-tich',
    'Ôn công thức chu vi hình chữ nhật và diện tích hình vuông.',
    'draft',
    300,
    1,
    1,
    null
  ),
  (
    '50000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000003',
    'Góc và hình khối',
    'goc-va-hinh-khoi',
    'Kiểm tra kiến thức về tổng góc tam giác và hình hộp chữ nhật.',
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
  ('50000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003', 1, 1),
  ('50000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000004', 2, 1),
  ('50000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000005', 1, 1),
  ('50000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000006', 2, 1),
  ('50000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000007', 1, 1),
  ('50000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000008', 2, 1),
  ('50000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000009', 1, 1),
  ('50000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000010', 2, 1)
on conflict (quiz_id, question_id) do update set
  sort_order = excluded.sort_order,
  points = excluded.points;

update public.quizzes
set status = 'published'
where id in (
  '50000000-0000-4000-8000-000000000002',
  '50000000-0000-4000-8000-000000000003',
  '50000000-0000-4000-8000-000000000004',
  '50000000-0000-4000-8000-000000000005'
);
