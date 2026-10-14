"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
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

function supabaseErrorMessage(message: string) {
  if (message.includes("duplicate key")) return "Slug hoặc thứ tự này đã được sử dụng.";
  if (message.includes("foreign key")) return "Không thể xóa nội dung đang được nội dung khác sử dụng.";
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
      const questionIds = Array.from(new Set(formData.getAll("question_ids").map(String)));
      if (!validId(subjectId) || (chapterId && !validId(chapterId)) || !title || title.length > 160 || !validSlug(slug)) {
        return failure("Môn học, tên bộ đề và slug hợp lệ là bắt buộc.");
      }
      if (passScore !== null && (!Number.isFinite(passScore) || passScore < 0)) {
        return failure("Điểm đạt phải là số không âm.");
      }
      if (questionIds.some((questionId) => !validId(questionId))) {
        return failure("Danh sách câu hỏi không hợp lệ.");
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
      const sortedQuestions = questionIds.map((questionId) => ({
        question_id: questionId,
        sort_order: positiveInteger(field(formData, `order_${questionId}`) || String(questionIds.indexOf(questionId) + 1), "Thứ tự câu hỏi"),
        points: Number(field(formData, `points_${questionId}`) || "1"),
      }));
      if (sortedQuestions.some((question) => question.sort_order === 0)) {
        return failure("Thứ tự câu hỏi phải bắt đầu từ 1.");
      }
      if (sortedQuestions.some((question) => !Number.isFinite(question.points) || question.points <= 0)) {
        return failure("Điểm mỗi câu phải là số lớn hơn 0.");
      }
      if (new Set(sortedQuestions.map((question) => question.sort_order)).size !== sortedQuestions.length) {
        return failure("Thứ tự câu hỏi trong bộ đề không được trùng nhau.");
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
        p_questions: sortedQuestions,
      });
      if (error) return failure(supabaseErrorMessage(error.message));
    } else if (entity === "questions") {
      const content = field(formData, "content");
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
      const { error } = await supabase.rpc("admin_save_question", {
        p_question_id: contentId,
        p_content: content,
        p_type: questionType as Database["public"]["Enums"]["question_type"],
        p_explanation: field(formData, "explanation") || null,
        p_difficulty: difficulty as Database["public"]["Enums"]["question_difficulty"] | null,
        p_status: status,
        p_options: options,
      });
      if (error) return failure(supabaseErrorMessage(error.message));
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
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return failure(supabaseErrorMessage(error.message));

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
  const { error } = await supabase.from(table).delete().in("id", ids);
  if (error) return failure(supabaseErrorMessage(error.message));

  revalidatePath("/admin", "layout");
  revalidatePath("/", "page");
  revalidatePath("/subjects", "page");
  return success(`Đã xóa ${ids.length} mục.`);
}
