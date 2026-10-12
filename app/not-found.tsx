import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="site-shell error-page not-found">
      <span className="empty-icon">?</span>
      <h1>Không tìm thấy nội dung</h1>
      <p>Đường dẫn có thể đã thay đổi hoặc nội dung chưa được xuất bản.</p>
      <Link className="button button-primary" href="/subjects">Khám phá môn học</Link>
    </main>
  );
}
