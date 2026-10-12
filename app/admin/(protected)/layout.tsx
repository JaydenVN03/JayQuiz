import Link from "next/link";
import { logoutAdmin } from "@/app/admin/actions";
import { AdminNavigation } from "@/components/admin-navigation";
import { Suspense } from "react";
import type { ReactNode } from "react";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="brand" href="/admin">
          <span className="brand-mark">j.</span> JayQuiz <span className="admin-badge">ADMIN</span>
        </Link>
        <Suspense fallback={<nav aria-label="Điều hướng quản trị" className="admin-nav" />}>
          <AdminNavigation />
        </Suspense>
        <Link className="admin-public-link" href="/">← Xem website</Link>
        <form action={logoutAdmin}>
          <button className="admin-logout" type="submit">Đăng xuất ↗</button>
        </form>
      </aside>
      <section className="admin-content">{children}</section>
    </main>
  );
}
