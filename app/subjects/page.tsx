import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";
import { isSupabaseSchemaNotReady } from "@/lib/data/errors";
import type { PublicSubject } from "@/lib/supabase/database.types";
import { listPublishedSubjects } from "@/lib/data/subjects";

export const metadata: Metadata = {
  title: "Môn học",
  description: "Khám phá các môn học và chủ đề ôn tập trên JayQuiz.",
};

export default function SubjectsPage() {
  return (
    <Suspense fallback={<SubjectsLoading />}>
      <SubjectsContent />
    </Suspense>
  );
}

async function SubjectsContent() {
  let subjects: PublicSubject[] = [];
  let schemaNotReady = false;
  try {
    subjects = await listPublishedSubjects();
  } catch (error) {
    if (!isSupabaseSchemaNotReady(error)) throw error;
    subjects = [];
    schemaNotReady = true;
  }

  return (
    <main className="site-shell">
      {schemaNotReady && <SupabaseSetupNotice />}
      <section className="page-intro">
        <nav className="breadcrumbs" aria-label="Đường dẫn">
          <Link href="/">Trang chủ</Link><span aria-hidden="true">/</span><span>Môn học</span>
        </nav>
        <h1>Góc học tập của bạn</h1>
        <p>Chọn một môn học để khám phá các chương và bộ đề đã được chuẩn bị.</p>
        <div className="content-count">{subjects.length} môn học đã xuất bản</div>
      </section>

      {subjects.length === 0 ? (
        <div className="empty-card">
          <span className="empty-icon">✳</span>
          <h2>Chưa có môn học nào</h2>
          <p>Nội dung sẽ xuất hiện tại đây sau khi được xuất bản.</p>
        </div>
      ) : (
        <div className="subject-grid">
          {subjects.map((subject, index) => (
            <Link className={`subject-card subject-tone-${index % 4}`} href={`/subjects/${subject.slug}`} key={subject.id}>
              <span className="subject-symbol" aria-hidden="true">{["∑", "文", "⚛", "◈"][index % 4]}</span>
              <span className="subject-number">{String(index + 1).padStart(2, "0")}</span>
              <h2>{subject.name}</h2>
              <p>{subject.description || "Khám phá bài học và luyện tập theo chủ đề."}</p>
              <span className="subject-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

function SubjectsLoading() {
  return (
    <main className="site-shell">
      <section className="page-intro">
        <span className="eyebrow">GÓC HỌC TẬP</span>
        <h1>Đang tải môn học...</h1>
      </section>
    </main>
  );
}
