"use client";

import { useEffect } from "react";

export default function ApplicationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("JayQuiz page failed to load.", error);
  }, [error]);

  return (
    <main className="site-shell error-page">
      <span className="empty-icon">!</span>
      <h1>Chưa thể tải nội dung</h1>
      <p>
        JayQuiz chưa tải được dữ liệu. Kiểm tra kết nối Supabase và bảo đảm
        migration đã được áp dụng cho cơ sở dữ liệu.
      </p>
      {error.digest && <p>Mã lỗi: {error.digest}</p>}
      <button className="button button-primary" onClick={reset} type="button">Thử tải lại</button>
    </main>
  );
}
