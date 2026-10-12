import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell footer-inner">
        <span>© 2026 JayQuiz · Học theo nhịp của bạn.</span>
        <div className="footer-links">
          <Link className="footer-link" href="/subjects">Môn học</Link>
          <Link className="footer-link" href="/">Trang chủ</Link>
        </div>
      </div>
    </footer>
  );
}
