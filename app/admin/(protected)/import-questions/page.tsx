import { Suspense } from "react";
import { AdminQuizExcelImportPage } from "@/components/admin-quiz-excel-import-page";
import { requireAdmin } from "@/lib/supabase/auth-server";

export const metadata = { title: "Nhập câu hỏi từ Excel | Admin" };

export default function AdminImportQuestionsPage() {
  return (
    <Suspense fallback={<div className="admin-loading">Đang tải bộ đề...</div>}>
      <AdminImportQuestionsContent />
    </Suspense>
  );
}

async function AdminImportQuestionsContent() {
  const { supabase } = await requireAdmin();
  const { data: quizzes, error } = await supabase
    .from("quizzes")
    .select("id, title")
    .order("title");

  if (error) {
    throw new Error("Không thể tải danh sách bộ đề.", { cause: error });
  }
  if (!quizzes) {
    throw new Error("Supabase không trả về danh sách bộ đề.");
  }

  return <AdminQuizExcelImportPage quizzes={quizzes} />;
}
