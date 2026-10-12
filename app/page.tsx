import { Suspense } from "react";
import Link from "next/link";
import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";
import type { PublicQuiz, PublicSubject } from "@/lib/supabase/database.types";
import { isSupabaseSchemaNotReady } from "@/lib/data/errors";
import { listPublishedQuizzes } from "@/lib/data/quizzes";
import { listPublishedSubjects } from "@/lib/data/subjects";

function formatDuration(seconds: number | null) {
  if (!seconds) return "Không giới hạn thời gian";
  const minutes = Math.round(seconds / 60);
  return `${minutes} phút`;
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  let subjects: PublicSubject[] = [];
  let quizzes: PublicQuiz[] = [];
  let schemaNotReady = false;
  try {
    [subjects, quizzes] = await Promise.all([
      listPublishedSubjects(),
      listPublishedQuizzes(),
    ]);
  } catch (error) {
    if (!isSupabaseSchemaNotReady(error)) throw error;
    schemaNotReady = true;
    subjects = [];
    quizzes = [];
  }
  const featuredQuizzes = quizzes.slice(0, 3);

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> HỌC NHẸ NHÀNG, NHỚ LÂU HƠN</span>
          <h1>Mỗi câu hỏi<br />là một bước <span>tiến bộ.</span></h1>
          <p>
            Ôn tập theo cách của bạn. Chọn một chủ đề, bắt đầu làm bài và
            theo dõi tiến độ ngay trên thiết bị của mình.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/subjects">
              Khám phá môn học <span aria-hidden="true">↗</span>
            </Link>
            <span className="hero-note"><span aria-hidden="true">✦</span> Miễn phí · Không cần tài khoản</span>
          </div>
          <div className="hero-stats">
            <div><strong>{subjects.length.toString().padStart(2, "0")}</strong><span>Môn học</span></div>
            <div><strong>{quizzes.length.toString().padStart(2, "0")}</strong><span>Bộ đề</span></div>
            <div><strong>∞</strong><span>Cơ hội luyện tập</span></div>
          </div>
        </div>
        <div className="hero-art" aria-label="Minh họa hành trình học tập" role="img">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-sun">✳</div>
          <div className="art-card art-card-main">
            <div className="art-card-top"><span className="art-mini-icon">✦</span><span>HÔM NAY</span><span className="art-menu">•••</span></div>
            <div className="art-plant" aria-hidden="true"><span /><span /><span /><i /></div>
            <p className="art-caption">Một chút mỗi ngày,<br /><strong>tiến xa hơn bạn nghĩ.</strong></p>
            <div className="art-progress"><span /><span /><span /><span /><span /><b>5 ngày</b></div>
          </div>
          <div className="art-float art-float-check"><span>✓</span><div><b>Đang tiến bộ</b><small>Tiếp tục nhé!</small></div></div>
          <div className="art-float art-float-score"><span>✳</span><b>+12 điểm</b></div>
          <div className="art-spark spark-one">✦</div><div className="art-spark spark-two">✧</div>
        </div>
      </section>

      {schemaNotReady && <SupabaseSetupNotice />}

      <section className="section-block" aria-labelledby="subjects-heading">
        <div className="section-heading">
          <div><span className="eyebrow">BẮT ĐẦU TỪ ĐÂU?</span><h2 id="subjects-heading">Chọn môn bạn muốn học</h2></div>
          <Link className="text-link" href="/subjects">Tất cả môn học <span aria-hidden="true">→</span></Link>
        </div>
        {subjects.length === 0 ? (
          <div className="empty-card">
            <span className="empty-icon">✳</span>
            <h3>Chưa có môn học nào</h3>
            <p>Các môn học đã xuất bản sẽ xuất hiện ở đây.</p>
          </div>
        ) : (
          <div className="subject-grid">
            {subjects.slice(0, 4).map((subject, index) => (
              <Link className={`subject-card subject-tone-${index % 4}`} href={`/subjects/${subject.slug}`} key={subject.id}>
                <span className="subject-symbol" aria-hidden="true">{["∑", "文", "⚛", "◈"][index % 4]}</span>
                <span className="subject-number">0{index + 1}</span>
                <h3>{subject.name}</h3>
                <p>{subject.description || "Khám phá bài học và luyện tập theo chủ đề."}</p>
                <span className="subject-arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="section-block section-quizzes" aria-labelledby="quizzes-heading">
        <div className="section-heading">
          <div><span className="eyebrow">LUYỆN TẬP MỖI NGÀY</span><h2 id="quizzes-heading">Bộ đề dành cho bạn</h2></div>
        </div>
        {featuredQuizzes.length === 0 ? (
          <div className="empty-card empty-card-horizontal">
            <span className="empty-icon">↗</span><div><h3>Đề mới sắp lên kệ</h3><p>Quay lại sau nhé, tụi mình đang chuẩn bị nội dung.</p></div>
          </div>
        ) : (
          <div className="quiz-list">
            {featuredQuizzes.map((quiz, index) => (
              <Link className="quiz-row" href={`/quiz/${quiz.slug}`} key={quiz.id}>
                <span className={`quiz-row-icon quiz-icon-${index % 3}`} aria-hidden="true">{["✳", "◉", "⌁"][index % 3]}</span>
                <span className="quiz-row-info"><strong>{quiz.title}</strong><small>{quiz.subject_name}{quiz.chapter_title ? ` · ${quiz.chapter_title}` : ""}</small></span>
                <span className="quiz-meta">{formatDuration(quiz.time_limit_seconds)}</span>
                <span className="quiz-go" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        )}
      </section>
      <section className="closing-banner">
        <div><span className="eyebrow">BẠN ĐÃ SẴN SÀNG CHƯA?</span><h2>Học một chút.<br /><span>Tiến bộ thật nhiều.</span></h2></div>
        <Link className="button button-light" href="/subjects">Bắt đầu học ngay <span aria-hidden="true">↗</span></Link>
        <span className="banner-doodle" aria-hidden="true">✳</span>
      </section>
    </main>
  );
}

function HomeLoading() {
  return (
    <main className="site-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">GÓC HỌC TẬP CỦA BẠN</span>
          <h1>Mỗi câu hỏi<br />là một bước <span>tiến bộ.</span></h1>
          <p>Đang tải môn học và bộ đề đã xuất bản...</p>
        </div>
      </section>
    </main>
  );
}
