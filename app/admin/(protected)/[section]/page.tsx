import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminManager } from "@/components/admin-manager";
import { requireAdmin } from "@/lib/supabase/auth-server";

const sections = ["subjects", "chapters", "quizzes", "questions"] as const;
type PageProps = { params: Promise<{ section: string }> };

export default function AdminSectionPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="admin-loading">Đang tải nội dung...</div>}>
      <AdminSectionContent params={params} />
    </Suspense>
  );
}

async function AdminSectionContent({ params }: PageProps) {
  const { section } = await params;
  if (!sections.includes(section as (typeof sections)[number])) notFound();
  const { supabase } = await requireAdmin();
  const [
    { data: subjects, error: subjectsError },
    { data: chapters, error: chaptersError },
    { data: quizzes, error: quizzesError },
    { data: questions, error: questionsError },
    { data: options, error: optionsError },
    { data: quizQuestions, error: quizQuestionsError },
  ] = await Promise.all([
    supabase.from("subjects").select("*").order("sort_order").order("name"),
    supabase.from("chapters").select("*").order("sort_order").order("title"),
    supabase.from("quizzes").select("*").order("created_at", { ascending: false }),
    supabase.from("questions").select("*").order("created_at", { ascending: false }),
    supabase.from("options").select("*").order("sort_order"),
    supabase.from("quiz_questions").select("*").order("sort_order"),
  ]);

  const queryError = subjectsError ?? chaptersError ?? quizzesError ?? questionsError ?? optionsError ?? quizQuestionsError;
  if (queryError) {
    throw new Error("Không thể tải dữ liệu quản trị.", { cause: queryError });
  }
  if (!subjects || !chapters || !quizzes || !questions || !options || !quizQuestions) {
    throw new Error("Supabase không trả về đầy đủ dữ liệu quản trị.");
  }

  return (
    <AdminManager
      chapters={chapters}
      options={options}
      questions={questions}
      quizQuestions={quizQuestions}
      quizzes={quizzes}
      section={section as (typeof sections)[number]}
      subjects={subjects}
    />
  );
}
