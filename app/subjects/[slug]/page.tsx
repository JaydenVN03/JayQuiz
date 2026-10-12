import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";
import { listPublishedChapters } from "@/lib/data/chapters";
import { isSupabaseSchemaNotReady } from "@/lib/data/errors";
import { listPublishedQuizzes } from "@/lib/data/quizzes";
import { getPublishedSubjectBySlug } from "@/lib/data/subjects";

export const metadata: Metadata = {
  title: "Môn học",
  description: "Khám phá môn học, chương và bộ đề đã xuất bản trên JayQuiz.",
};

export default function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<SubjectLoading />}>
      <SubjectContent params={params} />
    </Suspense>
  );
}

async function SubjectContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let subject;
  let chapters;
  let quizzes;
  try {
    [subject, chapters, quizzes] = await Promise.all([
      getPublishedSubjectBySlug(slug),
      listPublishedChapters(slug),
      listPublishedQuizzes({ subjectSlug: slug }),
    ]);
  } catch (error) {
    if (!isSupabaseSchemaNotReady(error)) throw error;
    return (
      <main className="site-shell">
        <SupabaseSetupNotice />
        <section className="page-intro">
          <Link className="back-link" href="/subjects">← Tất cả môn học</Link>
          <h1>Chưa tải được môn học</h1>
        </section>
      </main>
    );
  }

  if (!subject) notFound();

  const chapterIds = new Set(chapters.map((chapter) => chapter.id));
  const directQuizzes = quizzes.filter((quiz) => !quiz.chapter_id || !chapterIds.has(quiz.chapter_id));

  return (
    <main className="site-shell">
      <section className="page-intro">
        <nav className="breadcrumbs" aria-label="Đường dẫn">
          <Link href="/">Trang chủ</Link><span aria-hidden="true">/</span>
          <Link href="/subjects">Môn học</Link><span aria-hidden="true">/</span>
          <span>{subject.name}</span>
        </nav>
        <div className="subject-detail-head">
          <span className="subject-symbol" aria-hidden="true">∑</span>
          <div>
            <span className="eyebrow">MÔN HỌC</span>
            <h1>{subject.name}</h1>
          </div>
        </div>
        <p>{subject.description || "Chọn một chương hoặc bộ đề để bắt đầu ôn tập."}</p>
        <div className="content-count">{chapters.length} chương · {quizzes.length} bộ đề</div>
      </section>

      {chapters.length === 0 && directQuizzes.length === 0 ? (
        <div className="empty-card">
          <span className="empty-icon">✳</span>
          <h2>Nội dung đang được chuẩn bị</h2>
          <p>Các chương và bộ đề của môn học này sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <>
          {chapters.map((chapter) => {
            const chapterQuizzes = quizzes.filter((quiz) => quiz.chapter_id === chapter.id);
            return (
              <section className="chapter-section" key={chapter.id}>
                <div className="chapter-title-row">
                  <h2>{chapter.title}</h2>
                  <span>{chapterQuizzes.length} bộ đề</span>
                </div>
                {chapter.description && <p className="chapter-desc">{chapter.description}</p>}
                {chapterQuizzes.length === 0 ? (
                  <p className="chapter-desc">Chưa có bộ đề cho chương này.</p>
                ) : (
                  <QuizCards quizzes={chapterQuizzes} />
                )}
              </section>
            );
          })}
          {directQuizzes.length > 0 && (
            <section className="chapter-section direct-quizzes">
              <div className="chapter-title-row">
                <h2>Bộ đề tổng hợp</h2><span>{directQuizzes.length} bộ đề</span>
              </div>
              <QuizCards quizzes={directQuizzes} />
            </section>
          )}
        </>
      )}
    </main>
  );
}

function SubjectLoading() {
  return (
    <main className="site-shell">
      <section className="page-intro">
        <span className="eyebrow">GÓC HỌC TẬP</span>
        <h1>Đang tải môn học...</h1>
      </section>
    </main>
  );
}

function QuizCards({
  quizzes,
}: {
  quizzes: Awaited<ReturnType<typeof listPublishedQuizzes>>;
}) {
  return (
    <div className="quiz-cards">
      {quizzes.map((quiz, index) => (
        <Link className="quiz-card" href={`/quiz/${quiz.slug}`} key={quiz.id}>
          <span className={`quiz-row-icon quiz-icon-${index % 3}`} aria-hidden="true">{["✳", "◉", "⌁"][index % 3]}</span>
          <span className="quiz-card-copy">
            <strong>{quiz.title}</strong>
            <small>{quiz.time_limit_seconds ? `${Math.ceil(quiz.time_limit_seconds / 60)} phút` : "Không giới hạn thời gian"} · Phiên bản {quiz.version}</small>
          </span>
          <span className="quiz-card-arrow" aria-hidden="true">↗</span>
        </Link>
      ))}
    </div>
  );
}
