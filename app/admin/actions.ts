"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as XLSX from "xlsx";
import { requireAdmin, createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { QUIZ_EXCEL_HEADERS, QUIZ_EXCEL_OPTION_COUNT } from "@/lib/data/quiz-excel";
import type { Database } from "@/lib/supabase/database.types";

export type AdminFormState = {
  success: boolean;
  message: string;
};

const failure = (message: string): AdminFormState => ({ success: false, message });
const success = (message: string): AdminFormState => ({ success: true, message });
const validId = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const statuses = ["draft", "published", "archived"] as const;
type ContentStatus = Database["public"]["Enums"]["content_status"];
type QuestionType = Database["public"]["Enums"]["question_type"];
type QuestionDifficulty = Database["public"]["Enums"]["question_difficulty"];
type ImportedQuizQuestion = {
  content: string;
  type: QuestionType;
  difficulty: QuestionDifficulty | null;
  explanation: string | null;
  options: { content: string; is_correct: boolean }[];
  points: number;
};

const MAX_QUIZ_IMPORT_FILE_SIZE = 5 * 1024 * 1024;
const MAX_QUIZ_IMPORT_QUESTIONS = 500;

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function positiveInteger(value: string, label: string): number {
  if (!/^\d+$/.test(value)) throw new Error(`${label} phải là số nguyên không âm.`);
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new Error(`${label} không hợp lệ.`);
  return number;
}

function optionalPositiveInteger(value: string, label: string): number | null {
  if (!value) return null;
  const number = positiveInteger(value, label);
  if (number === 0) throw new Error(`${label} phải lớn hơn 0.`);
  return number;
}

function parseStatus(value: string): ContentStatus {
  if (!statuses.includes(value as ContentStatus)) {
    throw new Error("Trạng thái nội dung không hợp lệ.");
  }
  return value as ContentStatus;
}

function validSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function readExcelCell(value: unknown): string {
  return String(value ?? "").trim();
}

async function parseQuizExcel(file: File): Promise<ImportedQuizQuestion[]> {
  if (file.size === 0) throw new Error("File Excel đang trống.");
  if (file.size > MAX_QUIZ_IMPORT_FILE_SIZE) throw new Error("File Excel không được lớn hơn 5 MB.");
  if (!file.name.toLocaleLowerCase("en").endsWith(".xlsx")) {
    throw new Error("Chỉ hỗ trợ file Excel định dạng .xlsx.");
  }

  let workbook: XLSX.WorkBook;
  let fileBytes: Uint8Array;
  try {
    fileBytes = new Uint8Array(await file.arrayBuffer());
    if (fileBytes[0] !== 0x50 || fileBytes[1] !== 0x4b) {
      throw new Error("invalid Excel file signature");
    }
    workbook = XLSX.read(fileBytes, { type: "array" });
  } catch {
    throw new Error("Không thể đọc file Excel. Hãy tải file mẫu và lưu lại dưới định dạng .xlsx.");
  }
  const worksheet = workbook.Sheets["Cau hoi"];
  if (!worksheet) throw new Error('Không tìm thấy sheet "Cau hoi" trong file Excel.');
  if (!worksheet["!ref"]) throw new Error("Sheet câu hỏi đang trống.");

  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  if (range.s.r !== 0 || range.s.c !== 0) {
    throw new Error("Các tiêu đề cột phải bắt đầu từ ô A1.");
  }
  if (range.e.r > MAX_QUIZ_IMPORT_QUESTIONS) {
    throw new Error(`Mỗi file chỉ được nhập tối đa ${MAX_QUIZ_IMPORT_QUESTIONS} câu hỏi.`);
  }
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: column })];
      if (cell?.f || cell?.t === "e") {
        throw new Error("Không hỗ trợ ô chứa công thức hoặc lỗi Excel; hãy nhập giá trị trực tiếp.");
      }
    }
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: true,
  });
  const headers = rows[0]?.slice(0, QUIZ_EXCEL_HEADERS.length).map(readExcelCell) ?? [];
  if (QUIZ_EXCEL_HEADERS.some((header, index) => headers[index] !== header)) {
    throw new Error("Tên hoặc thứ tự cột không đúng mẫu. Hãy tải lại file mẫu Excel.");
  }

  const questions: ImportedQuizQuestion[] = [];
  for (const [index, row] of rows.slice(1).entries()) {
    const rowNumber = index + 2;
    const cells = Array.from({ length: QUIZ_EXCEL_HEADERS.length }, (_, cellIndex) =>
      readExcelCell(row[cellIndex]),
    );
    if (cells.every((cell) => !cell)) continue;

    const [content, rawType, rawDifficulty, explanation] = cells;
    if (!content) throw new Error(`Dòng ${rowNumber}: nội dung câu hỏi là bắt buộc.`);
    if (content.length > 10000) throw new Error(`Dòng ${rowNumber}: nội dung câu hỏi tối đa 10.000 ký tự.`);
    if (rawType !== "single_choice" && rawType !== "multiple_choice" && rawType !== "true_false") {
      throw new Error(`Dòng ${rowNumber}: loại câu hỏi phải là single_choice, multiple_choice hoặc true_false.`);
    }
    if (rawDifficulty && rawDifficulty !== "easy" && rawDifficulty !== "medium" && rawDifficulty !== "hard") {
      throw new Error(`Dòng ${rowNumber}: độ khó phải là easy, medium, hard hoặc để trống.`);
    }

    const optionCells = cells.slice(4, 4 + QUIZ_EXCEL_OPTION_COUNT);
    const options = optionCells.flatMap((optionContent, optionIndex) =>
      optionContent ? [{ content: optionContent, index: optionIndex + 1 }] : [],
    );
    if (options.length < 2) throw new Error(`Dòng ${rowNumber}: cần ít nhất 2 đáp án.`);
    const invalidOption = options.find((option) => option.content.length > 1000);
    if (invalidOption) throw new Error(`Dòng ${rowNumber}: mỗi đáp án tối đa 1.000 ký tự.`);

    const rawCorrectAnswers = cells[4 + QUIZ_EXCEL_OPTION_COUNT];
    const correctAnswers = rawCorrectAnswers.split(",").map((answer) => answer.trim());
    if (!rawCorrectAnswers || correctAnswers.some((answer) => !/^[1-9]\d*$/.test(answer))) {
      throw new Error(`Dòng ${rowNumber}: nhập số thứ tự đáp án đúng, ví dụ 2 hoặc 1,3.`);
    }
    const correctIndices = correctAnswers.map(Number);
    if (new Set(correctIndices).size !== correctIndices.length
      || correctIndices.some((answer) => !options.some((option) => option.index === answer))) {
      throw new Error(`Dòng ${rowNumber}: đáp án đúng phải trỏ đến các cột đáp án đã điền và không được trùng.`);
    }
    if ((rawType === "single_choice" || rawType === "true_false") && correctIndices.length !== 1) {
      throw new Error(`Dòng ${rowNumber}: loại câu hỏi này phải có chính xác một đáp án đúng.`);
    }
    if (rawType === "multiple_choice" && correctIndices.length < 1) {
      throw new Error(`Dòng ${rowNumber}: câu hỏi nhiều đáp án phải có ít nhất một đáp án đúng.`);
    }
    if (rawType === "true_false" && options.length !== 2) {
      throw new Error(`Dòng ${rowNumber}: câu hỏi đúng/sai phải có chính xác hai đáp án.`);
    }

    const rawPoints = cells[5 + QUIZ_EXCEL_OPTION_COUNT];
    const points = rawPoints ? Number(rawPoints) : 1;
    if (!Number.isFinite(points) || points <= 0 || points > 99999.99) {
      throw new Error(`Dòng ${rowNumber}: điểm phải lớn hơn 0 và không vượt quá 99.999,99.`);
    }

    questions.push({
      content,
      type: rawType,
      difficulty: rawDifficulty ? rawDifficulty as QuestionDifficulty : null,
      explanation: explanation || null,
      options: options.map((option) => ({
        content: option.content,
        is_correct: correctIndices.includes(option.index),
      })),
      points,
    });
    if (questions.length > MAX_QUIZ_IMPORT_QUESTIONS) {
      throw new Error(`Mỗi file chỉ được nhập tối đa ${MAX_QUIZ_IMPORT_QUESTIONS} câu hỏi.`);
    }
  }
  if (questions.length === 0) throw new Error("File Excel chưa có câu hỏi để nhập.");
  return questions;
}

function supabaseErrorMessage(message: string) {
  if (message.includes("duplicate key")) return "Slug hoặc thứ tự này đã được sử dụng.";
  if (message.includes("foreign key")) return "Không thể xóa nội dung đang được nội dung khác sử dụng.";
  if (message.includes("PGRST202") || message.includes("Could not find the function")) {
    return "Cơ sở dữ liệu chưa nhận được migration quản lý câu hỏi. Hãy áp dụng migration mới nhất rồi tải lại trang.";
  }
  if (message.includes("One or more questions were not found")) {
    return "Một hoặc nhiều câu hỏi không còn tồn tại. Hãy tải lại danh sách rồi thử lại.";
  }
  if (message.includes("A published quiz requires published questions")) {
    return "Bộ đề đã xuất bản chỉ nhận câu hỏi cũng ở trạng thái đã xuất bản.";
  }
  if (message.includes("A quiz can only") || message.includes("A quiz must") || message.includes("Every published")) {
    return "Chưa thể xuất bản: hãy kiểm tra môn/chương đã xuất bản và câu hỏi cùng đáp án hợp lệ.";
  }
  if (message.includes("Unpublish linked quizzes")) {
    return "Hãy chuyển các bộ đề đang xuất bản có dùng câu hỏi này về bản nháp trước khi ẩn câu hỏi.";
  }
  return `Không thể lưu dữ liệu: ${message}`;
}

export async function loginAdmin(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
    return failure("Vui lòng nhập email và mật khẩu hợp lệ.");
  }

  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return failure("Email hoặc mật khẩu không chính xác.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (profileError) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      throw new Error("Không thể kết thúc phiên sau khi xác minh quyền quản trị thất bại.", {
        cause: signOutError,
      });
    }
    return failure("Không thể xác minh quyền quản trị. Vui lòng thử lại.");
  }
  if (!profile) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      throw new Error("Không thể kết thúc phiên của tài khoản chưa được cấp quyền Admin.", {
        cause: signOutError,
      });
    }
    return failure("Tài khoản này chưa được cấp quyền Admin.");
  }

  redirect("/admin");
}

export async function logoutAdmin() {
  const supabase = await createSupabaseAuthServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Không thể đăng xuất khỏi Supabase.", { cause: error });
  redirect("/admin/login");
}

export async function saveAdminContent(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const { supabase } = await requireAdmin();
  const entity = field(formData, "entity");
  const id = field(formData, "id");
  if (id && !validId(id)) return failure("Mã nội dung không hợp lệ.");

  try {
    const status = parseStatus(field(formData, "status"));
    let contentId = id;

    if (entity === "subjects") {
      const sortOrder = positiveInteger(field(formData, "sort_order"), "Thứ tự");
      const name = field(formData, "name");
      const slug = field(formData, "slug");
      if (!name || name.length > 120 || !validSlug(slug)) {
        return failure("Tên môn học và slug hợp lệ là bắt buộc (slug dùng chữ thường, số và dấu gạch ngang).");
      }
      const values = {
        name,
        slug,
        description: field(formData, "description") || null,
        status,
        sort_order: sortOrder,
      };
      const result = id
        ? await supabase.from("subjects").update(values).eq("id", id)
        : await supabase.from("subjects").insert(values);
      if (result.error) return failure(supabaseErrorMessage(result.error.message));
    } else if (entity === "chapters") {
      const sortOrder = positiveInteger(field(formData, "sort_order"), "Thứ tự");
      const subjectId = field(formData, "subject_id");
      const title = field(formData, "title");
      const slug = field(formData, "slug");
      if (!validId(subjectId) || !title || title.length > 120 || !validSlug(slug)) {
        return failure("Môn học, tên chương và slug hợp lệ là bắt buộc.");
      }
      const values = {
        subject_id: subjectId,
        title,
        slug,
        description: field(formData, "description") || null,
        status,
        sort_order: sortOrder,
      };
      const result = id
        ? await supabase.from("chapters").update(values).eq("id", id)
        : await supabase.from("chapters").insert(values);
      if (result.error) return failure(supabaseErrorMessage(result.error.message));
    } else if (entity === "quizzes") {
      const subjectId = field(formData, "subject_id");
      const chapterId = field(formData, "chapter_id") || null;
      const title = field(formData, "title");
      const slug = field(formData, "slug");
      const timeLimit = optionalPositiveInteger(field(formData, "time_limit_seconds"), "Thời lượng");
      const passScoreRaw = field(formData, "pass_score");
      const passScore = passScoreRaw ? Number(passScoreRaw) : null;
      if (!validId(subjectId) || (chapterId && !validId(chapterId)) || !title || title.length > 160 || !validSlug(slug)) {
        return failure("Môn học, tên bộ đề và slug hợp lệ là bắt buộc.");
      }
      if (passScore !== null && (!Number.isFinite(passScore) || passScore < 0)) {
        return failure("Điểm đạt phải là số không âm.");
      }
      if (status === "published") {
        if (!id) {
          return failure("Hãy lưu bộ đề ở trạng thái nháp, nhập câu hỏi từ file Excel rồi xuất bản bộ đề.");
        }
        const { count, error: relationsError } = await supabase
          .from("quiz_questions")
          .select("question_id", { count: "exact", head: true })
          .eq("quiz_id", id);
        if (relationsError) return failure(supabaseErrorMessage(relationsError.message));
        if (!count) {
          return failure("Hãy nhập câu hỏi từ file Excel trước khi xuất bản bộ đề.");
        }
      }

      let version = 1;
      if (id) {
        const { data: existing, error: existingError } = await supabase
          .from("quizzes")
          .select("version")
          .eq("id", id)
          .single();
        if (existingError) return failure(supabaseErrorMessage(existingError.message));
        version = existing.version + 1;
      }
      contentId = id || crypto.randomUUID();
      const { error } = await supabase.rpc("admin_save_quiz", {
        p_quiz_id: contentId,
        p_subject_id: subjectId,
        p_chapter_id: chapterId,
        p_title: title,
        p_slug: slug,
        p_description: field(formData, "description") || null,
        p_status: status,
        p_time_limit_seconds: timeLimit,
        p_pass_score: passScore,
        p_version: version,
        p_questions: null,
      });
      if (error) return failure(supabaseErrorMessage(error.message));
    } else if (entity === "questions") {
      const content = field(formData, "content");
      const quizId = field(formData, "quiz_id");
      const questionType = field(formData, "type");
      const difficulty = field(formData, "difficulty") || null;
      const validTypes = ["single_choice", "multiple_choice", "true_false"];
      const validDifficulties = ["easy", "medium", "hard"];
      if (!content || content.length > 10000 || !validTypes.includes(questionType)) {
        return failure("Nội dung câu hỏi và loại câu hỏi hợp lệ là bắt buộc.");
      }
      if (difficulty && !validDifficulties.includes(difficulty)) {
        return failure("Độ khó không hợp lệ.");
      }
      const options = field(formData, "options")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => ({
          content: line.replace(/^\*\s*/, "").trim(),
          is_correct: /^\*\s*/.test(line),
          sort_order: index + 1,
        }));
      const correctCount = options.filter((option) => option.is_correct).length;
      if (options.length < 2 || options.some((option) => !option.content || option.content.length > 1000)) {
        return failure("Câu hỏi cần ít nhất hai lựa chọn; mỗi lựa chọn tối đa 1.000 ký tự.");
      }
      if ((questionType === "single_choice" || questionType === "true_false") && correctCount !== 1) {
        return failure("Câu hỏi một đáp án hoặc đúng/sai phải có chính xác một đáp án đúng (đánh dấu bằng *).");
      }
      if (questionType === "multiple_choice" && correctCount < 1) {
        return failure("Câu hỏi nhiều đáp án cần ít nhất một đáp án đúng (đánh dấu bằng *).");
      }
      if (questionType === "true_false" && options.length !== 2) {
        return failure("Câu hỏi đúng/sai phải có chính xác hai lựa chọn.");
      }
      contentId = id || crypto.randomUUID();
      const questionValues = {
        p_question_id: contentId,
        p_content: content,
        p_type: questionType as Database["public"]["Enums"]["question_type"],
        p_explanation: field(formData, "explanation") || null,
        p_difficulty: difficulty as Database["public"]["Enums"]["question_difficulty"] | null,
        p_status: status,
        p_options: options,
      };
      if (!id) {
        if (!validId(quizId)) return failure("Vui lòng chọn bộ đề cần thêm câu hỏi.");
        const { error } = await supabase.rpc("admin_add_quiz_question", {
          ...questionValues,
          p_quiz_id: quizId,
        });
        if (error) return failure(supabaseErrorMessage(error.message));
      } else {
        const { error } = await supabase.rpc("admin_save_question", questionValues);
        if (error) return failure(supabaseErrorMessage(error.message));
      }
    } else {
      return failure("Loại nội dung không hợp lệ.");
    }

    revalidatePath("/admin", "layout");
    revalidatePath("/", "page");
    revalidatePath("/subjects", "page");
    return success("Đã lưu nội dung.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Dữ liệu nhập không hợp lệ.");
  }
}

export async function deleteAdminContent(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const { supabase } = await requireAdmin();
  const entity = field(formData, "entity");
  const id = field(formData, "id");
  if (!validId(id)) return failure("Mã nội dung không hợp lệ.");

  const tables = {
    subjects: "subjects",
    chapters: "chapters",
    quizzes: "quizzes",
    questions: "questions",
  } as const;
  if (!(entity in tables)) return failure("Loại nội dung không hợp lệ.");
  const table = tables[entity as keyof typeof tables];
  if (entity === "questions") {
    const { error } = await supabase.rpc("admin_delete_questions", { p_question_ids: [id] });
    if (error) return failure(supabaseErrorMessage(error.message));
  } else {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return failure(supabaseErrorMessage(error.message));
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/", "page");
  revalidatePath("/subjects", "page");
  return success("Đã xóa nội dung.");
}

export async function bulkDeleteAdminContent(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const { supabase } = await requireAdmin();
  const entity = field(formData, "entity");
  const ids = Array.from(new Set(formData.getAll("id").map((value) => String(value).trim())));
  if (ids.length === 0) return failure("Vui lòng chọn ít nhất một mục cần xóa.");
  if (ids.some((id) => !validId(id))) return failure("Danh sách mã nội dung không hợp lệ.");

  const tables = {
    subjects: "subjects",
    chapters: "chapters",
    quizzes: "quizzes",
    questions: "questions",
  } as const;
  if (!Object.hasOwn(tables, entity)) return failure("Loại nội dung không hợp lệ.");
  const table = tables[entity as keyof typeof tables];
  if (entity === "questions") {
    const { data, error } = await supabase.rpc("admin_delete_questions", { p_question_ids: ids });
    if (error) return failure(supabaseErrorMessage(error.message));
    if (data !== ids.length) return failure("Số câu hỏi được xóa không khớp. Hãy tải lại danh sách rồi thử lại.");
  } else {
    const { error } = await supabase.from(table).delete().in("id", ids);
    if (error) return failure(supabaseErrorMessage(error.message));
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/", "page");
  revalidatePath("/subjects", "page");
  return success(`Đã xóa ${ids.length} mục.`);
}

export async function bulkPublishAdminContent(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const { supabase } = await requireAdmin();
  const entity = field(formData, "entity");
  const ids = Array.from(new Set(formData.getAll("id").map((value) => String(value).trim())));
  if (ids.length === 0) return failure("Vui lòng chọn ít nhất một mục cần xuất bản.");
  if (ids.some((id) => !validId(id))) return failure("Danh sách mã nội dung không hợp lệ.");

  const tables = {
    subjects: "subjects",
    chapters: "chapters",
    quizzes: "quizzes",
    questions: "questions",
  } as const;
  if (!Object.hasOwn(tables, entity)) return failure("Loại nội dung không hợp lệ.");
  const table = tables[entity as keyof typeof tables];
  const { data, error } = await supabase
    .from(table)
    .update({ status: "published" })
    .in("id", ids)
    .select("id");
  if (error) return failure(supabaseErrorMessage(error.message));
  if (data.length !== ids.length) {
    return failure("Một hoặc nhiều mục đã chọn không còn tồn tại. Hãy tải lại danh sách rồi thử lại.");
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/", "page");
  revalidatePath("/subjects", "page");
  return success(`Đã xuất bản ${data.length} mục.`);
}

export async function importQuizQuestionsFromExcel(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const { supabase } = await requireAdmin();
  const quizId = field(formData, "quiz_id");
  const file = formData.get("excel_file");
  if (!validId(quizId)) return failure("Mã bộ đề không hợp lệ.");
  if (!(file instanceof File)) return failure("Vui lòng chọn file Excel .xlsx.");

  let questions: ImportedQuizQuestion[];
  try {
    questions = await parseQuizExcel(file);
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Không thể đọc file Excel.");
  }

  const { data, error } = await supabase.rpc("admin_import_quiz_questions", {
    p_quiz_id: quizId,
    p_questions: questions,
  });
  if (error) {
    if (error.code === "PGRST202" || error.message.includes("Could not find the function")) {
      return failure("Cơ sở dữ liệu chưa nhận được migration nhập Excel. Hãy áp dụng migration 202610140001_admin_import_quiz_questions.sql rồi tải lại trang.");
    }
    if (error.message.includes("Quiz not found")) return failure("Không tìm thấy bộ đề cần nhập câu hỏi.");
    if (error.message.startsWith("Question import")) {
      return failure("Dữ liệu câu hỏi không hợp lệ; hãy kiểm tra loại câu hỏi, đáp án và điểm trong file Excel.");
    }
    return failure(`Không thể nhập câu hỏi: ${error.message}`);
  }
  if (data !== questions.length) {
    return failure("Cơ sở dữ liệu không xác nhận đủ số câu hỏi đã nhập.");
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/", "page");
  revalidatePath("/subjects", "page");
  return success(`Đã thêm ${data} câu hỏi vào bộ đề.`);
}
