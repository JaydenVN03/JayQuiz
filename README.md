Tài liệu chuẩn hóa nghiệp vụ (Business Requirements & Product Specification) cho ứng dụng trắc nghiệm JayQuiz xây dựng bằng Next.js.

## 1. Mục tiêu sản phẩm

JayQuiz là website trắc nghiệm phục vụ việc học và ôn tập. Người dùng không cần đăng nhập để làm bài. Tiến độ làm bài được lưu trên trình duyệt của họ. Chỉ Admin được phép tạo, sửa, xóa và xuất bản nội dung.

### 1.1. Mục tiêu MVP

- Hiển thị môn học, chương/chủ đề và bộ đề đã xuất bản.
- Cho phép người dùng làm bài trắc nghiệm không cần tài khoản.
- Tự động lưu tiến độ và khôi phục khi tải lại trang.
- Cho phép nộp bài, xem kết quả, xem đáp án/lời giải theo cấu hình của bộ đề.
- Cho phép làm lại hoặc reset tiến độ của từng bộ đề.
- Cung cấp khu vực Admin được bảo vệ để quản lý nội dung.
- Phân quyền tại server/database, không chỉ ẩn nút trên giao diện.

### 1.2. Ngoài phạm vi MVP

## 2. Vai trò và phân quyền

### 2.1. Người dùng công khai (Guest)

Không cần đăng nhập.

Được phép:
- Xem môn học, chương và bộ đề đã xuất bản.
- Xem nội dung câu hỏi được phép công khai.
- Làm bài, lưu tiến độ trên trình duyệt.
- Nộp bài và xem kết quả theo chính sách của bộ đề.
- Tiếp tục, làm lại hoặc reset tiến độ cục bộ.

Không được phép:
- Tạo, sửa, xóa hoặc xuất bản nội dung.
- Truy cập khu vực Admin.
- Gọi API quản trị hoặc ghi trực tiếp vào database.

### 2.2. Admin

Bắt buộc đăng nhập.

Được phép:
- Quản lý môn học, chương, bộ đề, câu hỏi và lựa chọn đáp án.
- Quản lý lời giải, thứ tự câu, trạng thái nháp/xuất bản.
- Xem trước nội dung trước khi xuất bản.
- Ẩn hoặc lưu trữ nội dung theo quy tắc hệ thống.

Nguyên tắc:
- Mọi thao tác quản trị phải được xác thực và kiểm tra quyền tại server/database.
- Không tin tưởng việc kiểm tra quyền chỉ ở giao diện.
- Không đưa service-role/secret key vào client bundle.
- Tài khoản Admin được cấp quyền theo cấu hình bảo mật, không cho người dùng tự đăng ký thành Admin.

---

## 3. Thuật ngữ

| Thuật ngữ | Định nghĩa |
|---|---|
| Môn học (`subject`) | Nhóm nội dung học tập cấp cao nhất |
| Chương (`chapter`) | Nhóm chủ đề thuộc một môn học |
| Bộ đề (`quiz`) | Tập hợp câu hỏi dùng cho một lượt làm bài |
| Câu hỏi (`question`) | Nội dung cần người học trả lời |
| Lựa chọn (`option`) | Một phương án trả lời của câu hỏi |
| Tiến độ (`progress`) | Trạng thái làm bài được lưu ở trình duyệt |
| Phiên làm bài (`attempt`) | Một lượt người dùng thực hiện bộ đề; ở MVP chỉ lưu cục bộ |
| Nháp (`draft`)(Khi bài làm chưa bấm xác thực, out ra vô lại hỏi làm tiếp hay làm lại,..) | Nội dung chưa công khai |
| Đã xuất bản (`published`) | Nội dung được phép hiển thị công khai |
| Reset | Xóa tiến độ cục bộ của một bộ đề |
| Làm lại | Bắt đầu lượt làm mới; có thể giữ kết quả cũ chỉ khi sau này có tính năng lịch sử |

---

## 4. Phạm vi chức năng

### 4.1. Khu vực công khai

| ID | Chức năng | Mô tả | Ưu tiên |
|---|---|---|---|
| PUB-01 | Trang chủ | Hiển thị môn học/bộ đề nổi bật | P0 |
| PUB-02 | Danh sách môn học | Chỉ hiển thị môn học được xuất bản | P0 |
| PUB-03 | Danh sách chương | Hiển thị chương thuộc môn học | P0 |
| PUB-04 | Danh sách bộ đề | Hiển thị đề đã xuất bản, số câu và thời lượng nếu có | P0 |
| QUIZ-01 | Bắt đầu làm bài | Khởi tạo tiến độ cho bộ đề | P0 |
| QUIZ-02 | Chọn đáp án | Hỗ trợ loại câu hỏi theo cấu hình | P0 |
| QUIZ-03 | Điều hướng câu hỏi | Câu trước, câu sau, chọn số câu | P0 |
| QUIZ-04 | Đánh dấu câu | Đánh dấu câu cần xem lại | P0 |
| QUIZ-05 | Tự động lưu | Lưu tiến độ sau thao tác | P0 |
| QUIZ-06 | Khôi phục tiến độ | Khôi phục sau khi tải lại trang | P0 |
| QUIZ-07 | Nộp bài | Kết thúc lượt làm và tính kết quả | P0 |
| QUIZ-08 | Xem kết quả | Hiển thị đúng/sai/chưa trả lời và điểm | P0 |
| QUIZ-09 | Làm lại | Bắt đầu một lượt mới | P0 |
| QUIZ-10 | Reset tiến độ | Xóa tiến độ của bộ đề hiện tại sau xác nhận | P0 |
| QUIZ-11 | Xem lời giải | Hiển thị lời giải theo cấu hình bộ đề | P0/P1 |
| PUB-05 | Tìm kiếm/lọc | Lọc theo môn học, chương, độ khó | P1 |

### 4.2. Khu vực Admin

| ID | Chức năng | Mô tả | Ưu tiên |
|---|---|---|---|
| ADM-01 | Đăng nhập | Xác thực Admin | P0 |
| ADM-02 | Đăng xuất | Kết thúc phiên Admin | P0 |
| ADM-03 | Dashboard | Tổng quan số lượng nội dung | P1 |
| ADM-04 | CRUD môn học | Tạo, xem, sửa, xóa/lưu trữ | P0 |
| ADM-05 | CRUD chương | Tạo, xem, sửa, xóa/lưu trữ | P0 |
| ADM-06 | CRUD bộ đề | Tạo và cấu hình bộ đề | P0 |
| ADM-07 | CRUD câu hỏi | Quản lý nội dung câu hỏi | P0 |
| ADM-08 | Quản lý lựa chọn | Thêm/sửa/xóa đáp án và xác định đáp án đúng | P0 |
| ADM-09 | Quản lý thứ tự | Sắp xếp chương, bộ đề, câu hỏi, lựa chọn | P0 |
| ADM-10 | Nháp/xuất bản | Kiểm soát nội dung công khai | P0 |
| ADM-11 | Xem trước | Xem đề theo giao diện người dùng | P0 |
| ADM-12 | Import/export | Nhập/xuất dữ liệu hàng loạt | P1 |
| ADM-13 | Xóa hàng loạt | Chọn và xóa nhiều môn học, chương, bộ đề hoặc câu hỏi cùng lúc | P1 |

---

## 5. Quy tắc nghiệp vụ

### 5.1. Nội dung công khai

1. Chỉ nội dung ở trạng thái `published` mới được xuất hiện trong khu vực công khai.
2. Một bộ đề không được xuất bản nếu thiếu câu hỏi hợp lệ.
3. Với câu hỏi chọn một đáp án, phải có số lượng lựa chọn hợp lệ và đúng một đáp án đúng.
4. Với câu hỏi chọn nhiều đáp án, phải có ít nhất một đáp án đúng.
5. Thứ tự hiển thị phải được lưu rõ ràng qua trường `sort_order`.
6. Không xóa cứng nội dung đang được bộ đề đã xuất bản sử dụng nếu việc xóa làm hỏng dữ liệu tham chiếu. Ưu tiên kiểm tra quan hệ và/hoặc lưu trữ.
7. Khi Admin sửa nội dung đã xuất bản, hệ thống phải tăng phiên bản bộ đề hoặc có chiến lược phát hiện nội dung thay đổi.
8. Xóa hàng loạt phải được xác nhận; nếu có mục đang được nội dung khác sử dụng, từ chối toàn bộ thao tác thay vì xóa một phần.

### 5.2. Làm bài

1. Người dùng không cần đăng nhập.
2. Mỗi bộ đề có một key lưu tiến độ riêng.
3. Mỗi lần chọn đáp án, ứng dụng cập nhật React state và lưu tiến độ cục bộ.
4. Câu chưa trả lời phải được phân biệt với câu đã trả lời.
5. Chọn một đáp án dùng một ID; chọn nhiều đáp án dùng danh sách ID.
6. Nút nộp bài nên yêu cầu xác nhận nếu còn câu chưa trả lời.
7. Sau khi nộp, trạng thái chuyển thành `submitted`; không tiếp tục thay đổi đáp án của lượt đó, trừ khi người dùng chọn làm lại.
8. Quy tắc tính điểm phải được thống nhất trước khi triển khai, gồm điểm từng câu, câu nhiều đáp án và làm tròn điểm.
9. Nếu đề có thời gian, phải xác định hành vi khi hết giờ và cách khôi phục thời gian sau khi tải lại trang.
10. Kết quả cục bộ có thể bị người dùng sửa; không dùng làm bằng chứng thi cử có tính bảo mật cao.
11. Khi ấn vào submitted thì những câu hỏi trả lời đúng hiện màu xanh, câu sai sẽ hiện màu đỏ kèm theo đáp án khoanh đúng
### 5.3. Tiến độ và reset

1. Tiến độ được lưu trong `localStorage` theo mặc định.
2. Dùng `sessionStorage` chỉ khi cần phiên tạm thời theo tab; không lưu cùng một dữ liệu ở cả hai nơi nếu không có lý do rõ ràng.
3. Key đề xuất: `jayquiz:progress:v1:<quizId>`.
4. Reset chỉ xóa tiến độ của bộ đề được chọn, không xóa các bộ đề khác.
5. Reset phải đồng thời cập nhật React state để giao diện không giữ đáp án cũ.
6. Trước khi reset, hiển thị hộp thoại xác nhận.
7. Nếu dữ liệu lưu bị lỗi hoặc không đúng schema, ứng dụng phải xử lý an toàn và cho phép bắt đầu lại.
8. Nếu phiên bản bộ đề thay đổi, thông báo cho người dùng và áp dụng chính sách tương thích đã định nghĩa.
9. Tiến độ cục bộ không đồng bộ giữa trình duyệt/thiết bị và có thể mất nếu người dùng xóa dữ liệu trình duyệt.

### 5.4. Chấm điểm và đáp án

1. Điểm phải được tính theo một hàm nghiệp vụ duy nhất, có thể kiểm thử.
2. Không lấy điểm do client tự gửi làm dữ liệu đáng tin cậy.
3. Nếu cần giữ kín đáp án trước khi nộp, API công khai không được trả về cờ `is_correct`.
4. Với MVP tự học, có thể hiển thị đáp án/lời giải sau khi nộp theo cấu hình của bộ đề.
5. Phải xác định rõ cách chấm câu nhiều đáp án: đúng hoàn toàn, có điểm từng phần hay không cho điểm nếu chọn thừa.
6. Endpoint chấm bài công khai phục vụ tự học, không phải cơ chế thi có đáp án bí mật; không dùng kết quả hoặc đáp án trả về làm bằng chứng đánh giá có tính bảo mật cao.

### 5.5. Quản trị

1. Admin phải đăng nhập trước khi truy cập trang quản trị.
2. Server/database phải xác thực quyền Admin cho mọi thao tác ghi.
3. Người dùng công khai chỉ được đọc nội dung đã xuất bản.
4. Dữ liệu đầu vào phải được validate ở server, không chỉ ở form.
5. Khi xóa dữ liệu, cần kiểm tra khóa ngoại và nội dung phụ thuộc.
6. Không đưa khóa bí mật vào biến môi trường `NEXT_PUBLIC_*`.
7. RLS phải được bật và kiểm thử cho các bảng được truy cập qua Supabase API.

---

## 6. Mô hình dữ liệu đề xuất

### 6.1. Các bảng cốt lõi

#### `subjects`
- `id`: UUID, khóa chính.
- `name`: tên môn học.
- `slug`: slug duy nhất.
- `description`: mô tả, có thể rỗng.
- `status`: `draft | published | archived`.
- `sort_order`: thứ tự hiển thị.
- `created_at`, `updated_at`.

#### `chapters`
- `id`: UUID, khóa chính.
- `subject_id`: khóa ngoại tới `subjects.id`.
- `title`: tên chương.
- `slug`: slug trong phạm vi môn học hoặc slug toàn cục theo quyết định thiết kế.
- `description`: mô tả, có thể rỗng.
- `status`: `draft | published | archived`.
- `sort_order`.
- `created_at`, `updated_at`.

#### `quizzes`
- `id`: UUID, khóa chính.
- `subject_id`: khóa ngoại tới `subjects.id`.
- `chapter_id`: khóa ngoại tới `chapters.id`, có thể rỗng nếu đề thuộc trực tiếp môn học.
- `title`, `slug`, `description`.
- `status`: `draft | published | archived`.
- `time_limit_seconds`: số nguyên dương hoặc `NULL`.
- `pass_score`: điểm đạt hoặc `NULL`.
- `version`: số nguyên tăng khi nội dung ảnh hưởng tới lượt làm thay đổi.
- `created_at`, `updated_at`, `published_at`.

#### `questions`
- `id`: UUID, khóa chính.
- `content`: nội dung câu hỏi.
- `type`: `single_choice | multiple_choice | true_false`.
- `explanation`: lời giải, có thể rỗng.
- `difficulty`: `easy | medium | hard`, có thể rỗng.
- `status`: `draft | published | archived`.
- `created_at`, `updated_at`.

#### `options`
- `id`: UUID, khóa chính.
- `question_id`: khóa ngoại tới `questions.id`.
- `content`: nội dung lựa chọn.
- `is_correct`: boolean, chỉ sử dụng phía quản trị/chấm điểm.
- `sort_order`: thứ tự lựa chọn.
- `created_at`, `updated_at`.

#### `quiz_questions`
- `quiz_id`: khóa ngoại tới `quizzes.id`.
- `question_id`: khóa ngoại tới `questions.id`.
- `sort_order`: thứ tự câu trong bộ đề.
- `points`: điểm câu hỏi, mặc định theo quy tắc của hệ thống.
- Khóa chính đề xuất: (`quiz_id`, `question_id`).

#### `admin_profiles` (nếu dùng Supabase Auth)
- `user_id`: khóa ngoại tới `auth.users.id`.
- `role`: vai trò được cấp, ví dụ `admin`.
- `created_at`, `updated_at`.

> Không cần bảng `users`, `attempts` hoặc `user_answers` trong MVP nếu tiến độ và kết quả chỉ lưu cục bộ. Chỉ bổ sung khi cần lịch sử phía server hoặc đồng bộ nhiều thiết bị.

### 6.2. Quyết định cần chốt khi viết SQL

- Dùng UUID làm khóa chính.
- Quy định `ON DELETE` cho từng khóa ngoại; không để xóa một bản ghi làm hỏng bộ đề đã xuất bản.
- Tạo index cho khóa ngoại và các trường thường lọc như `status`, `slug`, `subject_id`, `chapter_id`.
- Thêm `UNIQUE` cho slug theo phạm vi đã chọn.
- Ràng buộc `time_limit_seconds > 0` nếu không `NULL`.
- Xác thực dữ liệu câu hỏi/đáp án trong transaction khi xuất bản.
- Quyết định cách quản lý lịch sử phiên bản nội dung: chỉ tăng `version` hay lưu snapshot bất biến của bộ đề.

---

## 7. Hợp đồng dữ liệu tiến độ cục bộ

### 7.1. TypeScript

```ts
export type QuizProgressStatus = "in_progress" | "submitted";

export type QuizAnswer = string | string[];

export interface QuizProgress {
  schemaVersion: 1;
  quizId: string;
  quizVersion: number;
  status: QuizProgressStatus;
  currentQuestionIndex: number;
  answers: Record<string, QuizAnswer>;
  flaggedQuestionIds: string[];
  startedAt: string;
  updatedAt: string;
  submittedAt?: string;
  score?: number;
}
```

### 7.2. Key lưu trữ

```text
jayquiz:progress:v1:<quizId>
jayquiz:settings:v1
```

### 7.3. Yêu cầu triển khai

- Chỉ truy cập Web Storage trong Client Component hoặc hook chạy phía client.
- Không đọc `localStorage` trong quá trình render server.
- Có trạng thái `hydrated` để tránh ghi giá trị mặc định đè dữ liệu đã lưu.
- Validate dữ liệu sau `JSON.parse`; không mặc định tin dữ liệu storage.
- Bắt lỗi khi parse/ghi dữ liệu.
- Không lưu nguyên văn toàn bộ bộ đề nếu chỉ cần lưu ID đáp án.
- Khi reset, xóa key tương ứng và đưa React state về trạng thái ban đầu.
- Nếu cần kết quả có tính tin cậy cao, tính điểm ở server và không xem dữ liệu local là nguồn đáng tin.

---

## 8. Kiến trúc kỹ thuật

### 8.1. Stack đề xuất

| Lớp | Công nghệ |
|---|---|
| Framework | Next.js App Router |
| Ngôn ngữ | TypeScript |
| UI | Tailwind CSS |
| Database | Supabase PostgreSQL |
| Xác thực Admin | Supabase Auth |
| Phân quyền | RLS + kiểm tra quyền ở server |
| Validate dữ liệu | Zod hoặc giải pháp schema tương đương |
| Lưu tiến độ | `localStorage` |
| Triển khai | Vercel hoặc nền tảng tương thích Next.js |

ORM như Prisma/Drizzle là tùy chọn, không bắt buộc nếu sử dụng Supabase client và SQL migrations.

### 8.2. Nguyên tắc kiến trúc

- Tách UI, nghiệp vụ và truy cập dữ liệu.
- Tách truy vấn công khai khỏi thao tác quản trị.
- Server Component được ưu tiên cho trang chỉ đọc dữ liệu khi phù hợp.
- Client Component dùng cho tương tác làm bài và Web Storage.
- Dùng Server Actions hoặc Route Handlers cho thao tác ghi; kiểm tra xác thực và quyền trong từng đường đi.
- Không coi middleware là lớp bảo vệ duy nhất.
- Không đưa secret/service-role key xuống client.
- Xử lý loading, empty state, error state và trạng thái dữ liệu không hợp lệ.

### 8.3. Cấu trúc thư mục tham khảo

```text
app/
├── admin/
│   ├── (protected)/
│   │   ├── [section]/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── login/page.tsx
│   └── actions.ts
├── api/quizzes/[slug]/grade/route.ts
├── quiz/[slug]/page.tsx
├── subjects/
│   ├── [slug]/page.tsx
│   └── page.tsx
├── layout.tsx
├── page.tsx
└── globals.css
components/
├── admin-manager.tsx
├── quiz-player.tsx
├── site-header.tsx
├── site-footer.tsx
└── supabase-setup-notice.tsx
lib/
├── data/
│   ├── chapters.ts
│   ├── errors.ts
│   ├── grading.ts
│   ├── subjects.ts
│   └── quizzes.ts
└── supabase/
    ├── auth-server.ts
    ├── database.types.ts
    └── server.ts
proxy.ts
supabase/
├── config.toml
├── migrations/
│   └── 202610120001_initial_schema.sql
└── seed.sql
```

Cấu trúc đang dùng giữ `app/` ở thư mục gốc như dự án hiện tại. Các repositories trong `lib/data/` chỉ đọc views công khai; lớp chấm bài chỉ lấy đáp án/lời giải ở server sau khi người dùng nộp bài. Khu vực Admin dùng Supabase Auth cookie SSR, xác minh user và `admin_profiles` ở server cho từng trang/thao tác, đồng thời giữ RLS làm lớp bảo vệ database.

### Sử dụng khu vực Admin

- Mở `/admin/login`, đăng nhập bằng tài khoản Supabase Auth đã được cấp role `admin`.
- Dashboard hiển thị số môn, chương, bộ đề, câu hỏi và bộ đề nháp.
- Các mục Môn học/Chương/Bộ đề/Câu hỏi hỗ trợ tạo, sửa, lưu trữ/xuất bản và xóa khi không bị ràng buộc dữ liệu. Thứ tự chương/môn và thứ tự/điểm từng câu trong đề có thể chỉnh sửa.
- Với câu hỏi, nhập mỗi lựa chọn trên một dòng; thêm `*` đầu dòng để đánh dấu đáp án đúng. Server kiểm tra số lựa chọn và đáp án đúng theo loại câu hỏi.
- Với bộ đề, chọn môn, chương, thời lượng, điểm đạt, câu hỏi, thứ tự và điểm câu hỏi. Database từ chối xuất bản nếu nội dung liên quan chưa hợp lệ.
- Mở “Xem trước nội dung đề” để kiểm tra câu hỏi, đáp án và lời giải; bộ đề đã xuất bản có liên kết mở trang công khai.
- Thay đổi bộ đề sẽ tăng `version` để tiến độ localStorage của phiên bản cũ không được tiếp tục như thể đề chưa đổi.
- Không có đăng ký Admin công khai. Import/export hàng loạt là hạng mục P1 tùy nhu cầu, chưa thuộc giao diện CRUD hiện tại.

---

## 9. Quy ước giao diện và trải nghiệm

- Giao diện responsive, ưu tiên trải nghiệm trên điện thoại và máy tính.
- Nêu rõ trạng thái lưu: “Đã lưu”, “Đang lưu” hoặc “Không thể lưu”.
- Có loading state khi tải đề và empty state khi chưa có nội dung.
- Câu đã trả lời, câu chưa trả lời và câu được đánh dấu cần có trạng thái phân biệt.
- Xác nhận trước các thao tác mất dữ liệu như reset hoặc xóa nội dung.
- Không tự động reset khi người dùng tải lại trang.
- Khi tiến độ của phiên bản đề cũ không tương thích, thông báo rõ trước khi xóa hoặc chuyển đổi.
- Hỗ trợ điều hướng bằng bàn phím và nhãn phù hợp cho thành phần tương tác.
- Không phụ thuộc hoàn toàn vào màu sắc để truyền đạt trạng thái.

---

## 10. Tiêu chí nghiệm thu MVP

### Người dùng

- [ ] Có thể xem môn học/chương/bộ đề đã xuất bản mà không đăng nhập.
- [ ] Không xem được bộ đề nháp qua giao diện hoặc endpoint công khai.
- [ ] Có thể chọn đáp án và chuyển câu.
- [ ] Tải lại trang không làm mất tiến độ đã lưu hợp lệ.
- [ ] Có thể đóng và mở lại trình duyệt để tiếp tục nếu dùng `localStorage` và dữ liệu chưa bị xóa.
- [ ] Có thể nộp bài và nhận kết quả đúng theo quy tắc tính điểm.
- [ ] Câu chưa trả lời được thống kê chính xác.
- [ ] Reset một bộ đề không ảnh hưởng bộ đề khác.
- [ ] Dữ liệu storage lỗi không làm ứng dụng sập.
- [ ] Không có lỗi hydration do đọc Web Storage trong render server.

### Admin

- [x] Admin đăng nhập và đăng xuất được.
- [x] Guest không thể truy cập chức năng quản trị.
- [x] Guest không thể ghi dữ liệu qua API hoặc Supabase client.
- [x] Admin có thể CRUD môn học, chương, bộ đề, câu hỏi và lựa chọn.
- [x] Không xuất bản bộ đề thiếu dữ liệu hợp lệ.
- [x] Nội dung nháp không xuất hiện công khai.
- [x] Validate được thực hiện ở server.
- [x] Không lộ secret/service-role key ở client.

### Chất lượng

- [ ] Có migration hoặc tài liệu SQL tái tạo được database.
- [ ] Có dữ liệu mẫu để kiểm thử.
- [ ] Có hướng dẫn thiết lập biến môi trường.
- [ ] Có xử lý lỗi truy vấn và lỗi lưu tiến độ.
- [ ] Các quy tắc tính điểm và reset có kiểm thử.

---

## 11. Lộ trình phát triển

### Phase 1 — Nền tảng
- Khởi tạo Next.js + TypeScript.
- Thiết lập Supabase và biến môi trường.
- Tạo schema, migration, RLS và dữ liệu mẫu.
- Tạo lớp truy cập dữ liệu.

### Phase 2 — Luồng người dùng
- Trang chủ, môn học, chương và danh sách đề.
- Trang làm bài.
- Chọn đáp án, điều hướng và đánh dấu câu.
- Lưu/khôi phục tiến độ bằng `localStorage`.

### Phase 3 — Kết quả
- Nghiệp vụ nộp bài.
- Hàm chấm điểm có kiểm thử.
- Trang kết quả và xem lời giải.
- Làm lại và reset.

### Phase 4 — Admin
- Đăng nhập Admin.
- CRUD nội dung.
- Validate dữ liệu.
- Nháp, xem trước và xuất bản.
- Kiểm thử phân quyền/RLS.

### Phase 5 — Hoàn thiện
- Responsive và accessibility.
- Import/export nếu cần.
- Kiểm thử hồi quy.
- Deploy, cấu hình môi trường và sao lưu.

---

## 12. Quyết định sản phẩm còn cần chốt

Các mục sau chưa nên tự suy đoán khi triển khai:

1. **Loại câu hỏi MVP:** chỉ chọn một đáp án hay có cả chọn nhiều đáp án/đúng-sai?
2. **Cách tính điểm:** mỗi câu bằng điểm nhau hay có trọng số?
3. **Hiển thị đáp án:** sau từng câu, sau khi nộp, hay chỉ theo cấu hình đề?
4. **Thời gian:** có giới hạn thời gian không? Tải lại trang có tiếp tục đếm giờ không?
5. **Làm lại:** kết quả cũ có cần giữ không? (MVP hiện không có lịch sử server.)
6. **Cập nhật bộ đề:** khi Admin sửa đề, phiên làm bài cũ sẽ bị reset, được tiếp tục hay dùng snapshot?
7. **Quan hệ nội dung:** một câu hỏi có được tái sử dụng trong nhiều bộ đề không? (Thiết kế hiện tại: có.)
8. **Xóa nội dung:** xóa cứng hay lưu trữ?
9. **Ảnh/công thức:** câu hỏi có cần hình ảnh, LaTeX hoặc nội dung rich text không?
10. **Quy mô Admin:** một Admin hay nhiều Admin với vai trò khác nhau?

Nếu chưa có yêu cầu khác, hãy dùng các mặc định: câu hỏi chọn một đáp án cho MVP; điểm các câu bằng nhau; hiện lời giải sau khi nộp; không có lịch sử server; hỗ trợ tái sử dụng câu hỏi; lưu trữ nội dung thay vì xóa cứng khi có liên kết.

---

## 13. Hướng dẫn cho AI coding assistant

Khi yêu cầu AI hỗ trợ code trong dự án này:

1. Đọc tài liệu `README.md` trước khi đề xuất hoặc chỉnh sửa kiến trúc.
2. Không tự ý thay đổi stack, quy tắc nghiệp vụ, schema hoặc cơ chế lưu tiến độ mà không nêu rõ lý do.
3. Trước thay đổi lớn, trình bày file sẽ tạo/sửa và tác động tới nghiệp vụ.
4. Ưu tiên triển khai theo từng chức năng nhỏ, có thể chạy và kiểm thử.
5. Không tạo chức năng ngoài phạm vi MVP nếu chưa được yêu cầu.
6. Không để secret trong mã nguồn hoặc biến `NEXT_PUBLIC_*`.
7. Không giả định `localStorage` tồn tại trên server.
8. Kiểm tra quyền Admin ở server/database, không chỉ ở giao diện.
9. Cập nhật README khi thay đổi nghiệp vụ, schema, biến môi trường hoặc quy trình chạy.
10. Khi hoàn thành một nhiệm vụ, báo rõ file đã thay đổi, cách kiểm thử và việc còn tồn đọng.

---

## 14. Lệnh phát triển thường dùng

Các lệnh có thể khác tùy package manager và script trong `package.json`.

```bash
npm install
npm run dev
npm run lint
npm run build
```

Mở ứng dụng phát triển tại `http://localhost:3000`.

### Biến môi trường mẫu

Tạo `.env` hoặc `.env.local` ở máy phát triển và không commit file chứa secret:

```env
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_JWKS_URL=
```

Sao chép `.env.example` thành `.env.local` rồi điền giá trị từ Supabase API Keys settings. Các truy vấn hiện tại chỉ cần `SUPABASE_URL` và `SUPABASE_PUBLISHABLE_KEY`. `SUPABASE_SECRET_KEY` chỉ dành cho thao tác backend cần quyền cao; không dùng cho truy vấn công khai hoặc đưa xuống client. `SUPABASE_JWKS_URL` dùng khi backend xác minh JWT.

`@supabase/ssr` được dùng cho phiên cookie trong trình duyệt và server; `proxy.ts` đồng bộ cookie phiên trước khi trang Admin chạy. Mỗi Server Action vẫn xác minh Supabase user và bản ghi `admin_profiles`; RLS tiếp tục giới hạn thao tác database. `SUPABASE_SECRET_KEY` không được dùng cho các thao tác Admin và không đưa xuống client.

### Thiết lập database Supabase

Cài Supabase CLI, sau đó chạy tại thư mục dự án:

```bash
supabase start
supabase db reset
```

`db reset` áp dụng migration trong `supabase/migrations/` và nạp `supabase/seed.sql`; lệnh có thể chạy lại để tái tạo database local. `seed.sql` tạo môn Toán, ba chương và năm bộ đề đã xuất bản, mỗi bộ đề gồm hai câu hỏi. Bốn bộ đề bổ sung được chia đều vào chương Phân số và số thập phân và Hình học cơ bản. Có thể chạy nội dung seed trong SQL Editor của Supabase để thêm/cập nhật dữ liệu mẫu trên project đã có schema; không cần chạy `db reset` trên database production. Các truy vấn ứng dụng dùng `public_subjects`, `public_chapters`, `public_quizzes` và `public_quiz_content`; không cấp quyền đọc trực tiếp các bảng chứa đáp án cho anon. Tài khoản Admin phải được cấp trong `admin_profiles` qua SQL/dashboard đáng tin cậy, không cho phép tự đăng ký quyền Admin.

Để cấp quyền Admin đầu tiên trên project:

1. Tạo/xác minh người dùng trong Supabase Dashboard → Authentication → Users. Không bật đăng ký công khai để cấp role.
2. Chạy câu lệnh dưới trong SQL Editor, thay email bằng email người dùng đã tạo:

```sql
insert into public.admin_profiles (user_id, role)
select id, 'admin'
from auth.users
where email = 'admin@example.com'
on conflict (user_id) do update set role = 'admin';
```

3. Mở `http://localhost:3000/admin/login` và đăng nhập. Nếu lệnh SQL không thêm hàng, kiểm tra email đã tồn tại trong Authentication → Users.

Để áp dụng migration không cần đăng nhập Supabase CLI, mở SQL Editor của project rồi lần lượt chạy toàn bộ nội dung `supabase/migrations/202610120001_initial_schema.sql` và `supabase/seed.sql`:

```text
https://supabase.com/dashboard/project/altlbaskbyesrjhynujd/sql/new
```

Hoặc, nếu Supabase CLI đã được xác thực trên máy, có thể push migration bằng:

```bash
npx supabase db push --project-ref altlbaskbyesrjhynujd
```

Migration gửi `NOTIFY pgrst, 'reload schema'` sau khi tạo các view để yêu cầu PostgREST nạp lại schema cache. Có thể xác minh trong SQL Editor bằng `select * from public.public_subjects;` rồi tải lại ứng dụng.

Sau khi thay đổi migration, cập nhật lại kiểu Supabase:

```bash
supabase gen types typescript --local > lib/supabase/database.types.ts
```

---

## 15. Nguyên tắc thay đổi tài liệu

- Thay đổi quy tắc nghiệp vụ phải cập nhật mục tương ứng trong README.
- Thay đổi schema phải kèm migration.
- Thay đổi định dạng tiến độ phải tăng `schemaVersion` và có chiến lược tương thích.
- Thay đổi API phải cập nhật kiểu dữ liệu và tiêu chí nghiệm thu.
- Không đánh dấu tính năng hoàn thành nếu chưa kiểm thử theo tiêu chí nghiệm thu.

**Tài liệu này là nguồn tham chiếu nghiệp vụ ban đầu của JayQuiz.** Khi có quyết định mới, cập nhật tài liệu trước hoặc cùng lúc với code để tránh sai lệch giữa đặc tả và triển khai.
"""

path = Path("/mnt/data/README.md")
path.write_text(content, encoding="utf-8")
print(f"Created: {path}")
