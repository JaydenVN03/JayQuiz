"use client";

import Link from "next/link";
import { useState } from "react";
import { QuizExcelImport } from "@/components/quiz-excel-import";

type QuizOption = { id: string; title: string };

export function AdminQuizExcelImportPage({ quizzes }: { quizzes: QuizOption[] }) {
  const [quizId, setQuizId] = useState("");

  return (
    <>
      <header className="admin-page-heading">
        <div>
          <span className="eyebrow">QUẢN LÝ NỘI DUNG</span>
          <h1>Nhập câu hỏi từ Excel</h1>
          <p>Chọn bộ đề, tải biểu mẫu Excel, điền câu hỏi rồi nhập hàng loạt.</p>
        </div>
      </header>
      <section className="admin-panel admin-excel-import-page">
        {quizzes.length > 0 ? (
          <label className="admin-field">
            Bộ đề nhận câu hỏi
            <select onChange={(event) => setQuizId(event.target.value)} value={quizId}>
              <option value="">Chọn bộ đề</option>
              {quizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
              ))}
            </select>
          </label>
        ) : (
          <div className="admin-excel-no-quizzes">
            <p>Chưa có bộ đề để nhập câu hỏi. Bạn vẫn có thể tải biểu mẫu Excel trước.</p>
            <Link className="button button-secondary" href="/admin/quizzes">Tạo bộ đề</Link>
          </div>
        )}
        <QuizExcelImport key={quizId || "no-quiz-selected"} quizId={quizId} />
      </section>
    </>
  );
}
