import type { Metadata } from "next";
import Link from "next/link";
import { AdminLoginForm } from "@/app/admin/login-form";

export const metadata: Metadata = { title: "Đăng nhập Admin" };

export default function AdminLoginPage() {
  return (
    <main className="site-shell admin-login-page">
      <Link className="breadcrumbs" href="/">← Quay lại JayQuiz</Link>
      <section className="admin-login-card">
        <span className="eyebrow">KHU VỰC QUẢN TRỊ</span>
        <h1>Chào mừng trở lại.</h1>
        <p>Đăng nhập bằng tài khoản quản trị JayQuiz của bạn.</p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
