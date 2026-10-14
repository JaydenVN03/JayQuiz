import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/supabase/auth-server";

export const metadata = { title: "Tổng quan Admin" };

export default function AdminDashboardPage() {
  return <Suspense fallback={<div className="admin-loading">Đang tải bảng điều khiển...</div>}><DashboardContent /></Suspense>;
}

async function DashboardContent() {
  const { supabase, user } = await requireAdmin();
  const [subjects, chapters, quizzes, questions, drafts] = await Promise.all([
    supabase.from("subjects").select("id", { count: "exact", head: true }),
    supabase.from("chapters").select("id", { count: "exact", head: true }),
    supabase.from("quizzes").select("id", { count: "exact", head: true }),
    supabase.from("questions").select("id", { count: "exact", head: true }),
    supabase.from("quizzes").select("id", { count: "exact", head: true }).eq("status", "draft"),
  ]);

  const resultError = [subjects, chapters, quizzes, questions, drafts].find((result) => result.error);
  if (resultError?.error) {
    throw new Error("Không thể tải dữ liệu tổng quan Admin.", { cause: resultError.error });
  }

  const stats = [
    { label: "Môn học", count: subjects.count ?? 0, href: "/admin/subjects", icon: "◈" },
    { label: "Chương", count: chapters.count ?? 0, href: "/admin/chapters", icon: "▤" },
    { label: "Bộ đề", count: quizzes.count ?? 0, href: "/admin/quizzes", icon: "✳" },
    { label: "Câu hỏi", count: questions.count ?? 0, href: "/admin/questions", icon: "?" },
  ];

  return (
    <>
      <header className="admin-page-heading">
        <div><span className="eyebrow">KHÔNG GIAN LÀM VIỆC</span><h1>Tổng quan</h1></div>
        <p>{user.email}</p>
      </header>
      <section className="admin-stat-grid" aria-label="Thống kê nội dung">
        {stats.map((stat) => (
          <Link className="admin-stat-card" href={stat.href} key={stat.label}>
            <span>{stat.icon} {stat.label}</span><strong>{stat.count}</strong><small>Quản lý nội dung ↗</small>
          </Link>
        ))}
      </section>
      <section className="admin-panel admin-dashboard-note">
        <div><span className="admin-panel-icon">✎</span><div><h2>Tiếp tục xây dựng thư viện đề</h2><p>{drafts.count ?? 0} bộ đề đang ở trạng thái nháp. Nội dung chỉ công khai sau khi xuất bản.</p></div></div>
        <div className="admin-dashboard-actions">
          <Link className="button button-secondary" href="/admin/import-questions">Nhập câu hỏi từ Excel</Link>
          <Link className="button button-primary" href="/admin/quizzes">Quản lý bộ đề</Link>
        </div>
      </section>
      <section className="admin-panel">
        <h2>Quy trình xuất bản</h2>
        <ol className="admin-workflow">
          <li>Tạo môn học, sau đó thêm chương nếu cần.</li>
          <li>Tạo và lưu bộ đề ở trạng thái nháp.</li>
          <li>Nhập câu hỏi cùng đáp án bằng một file Excel cho bộ đề.</li>
          <li>Xem trước nội dung rồi chuyển trạng thái sang “Đã xuất bản”.</li>
        </ol>
      </section>
    </>
  );
}
