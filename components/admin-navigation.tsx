"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  ["Tổng quan", "/admin"],
  ["Môn học", "/admin/subjects"],
  ["Chương", "/admin/chapters"],
  ["Bộ đề", "/admin/quizzes"],
  ["Câu hỏi", "/admin/questions"],
] as const;

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Điều hướng quản trị" className="admin-nav">
      {navigation.map(([label, href]) => {
        const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
        return (
          <Link aria-current={isActive ? "page" : undefined} href={href} key={href}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
