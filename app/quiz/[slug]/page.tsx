import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { QuizPlayer } from "@/components/quiz-player";
import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";
import { isSupabaseSchemaNotReady } from "@/lib/data/errors";
import { getPublishedQuizBySlug } from "@/lib/data/quizzes";

export const metadata: Metadata = {
  title: "Bộ đề",
  description: "Luyện tập trắc nghiệm và theo dõi tiến độ cùng JayQuiz.",
};

export default function QuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<QuizLoading />}>
      <QuizContent params={params} />
    </Suspense>
  );
}

async function QuizContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let quiz;
  try {
    quiz = await getPublishedQuizBySlug(slug);
  } catch (error) {
    if (!isSupabaseSchemaNotReady(error)) throw error;
    return (
      <main className="site-shell quiz-page">
        <SupabaseSetupNotice />
        <section className="page-intro">
          <Link className="back-link" href="/subjects">← Tất cả môn học</Link>
          <h1>Chưa tải được bộ đề</h1>
        </section>
      </main>
    );
  }
  if (!quiz) notFound();

  return (
    <main className="site-shell quiz-page">
      <section className="quiz-title-block">
        <nav className="breadcrumbs" aria-label="Đường dẫn">
          <Link href="/">Trang chủ</Link><span aria-hidden="true">/</span>
          <Link href={`/subjects/${quiz.subject_slug}`}>{quiz.subject_name}</Link>
          {quiz.chapter_slug && (
            <>
              <span aria-hidden="true">/</span>
              <span>{quiz.chapter_title}</span>
            </>
          )}
        </nav>
        <span className="eyebrow">GÓC LUYỆN TẬP</span>
        <h1>{quiz.title}</h1>
        <p className="quiz-subtitle">{quiz.description || "Làm bài theo nhịp của bạn. Tiến độ được lưu trên thiết bị."}</p>
        <div className="quiz-info-strip">
          <span><span aria-hidden="true">▤</span> {quiz.questions.length} câu hỏi</span>
          <span><span aria-hidden="true">◷</span> {quiz.time_limit_seconds ? `${Math.ceil(quiz.time_limit_seconds / 60)} phút` : "Không giới hạn thời gian"}</span>
          <span><span aria-hidden="true">⌂</span> Không cần đăng nhập</span>
        </div>
      </section>
      <QuizPlayer quiz={quiz} />
    </main>
  );
}

function QuizLoading() {
  return (
    <main className="site-shell quiz-page">
      <section className="page-intro">
        <span className="eyebrow">GÓC LUYỆN TẬP</span>
        <h1>Đang tải bộ đề...</h1>
      </section>
    </main>
  );
}
