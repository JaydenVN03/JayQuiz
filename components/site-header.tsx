import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-shell header-inner">
        <Link className="brand" href="/" aria-label="JayQuiz - Trang chủ">
          <span className="brand-mark" aria-hidden="true">j.</span>
          <span>jayquiz</span>
        </Link>
        <nav className="main-nav" aria-label="Điều hướng chính">
          <Link href="/subjects">Môn học</Link>
          <Link href="/#quizzes-heading">Bộ đề</Link>
        </nav>
        <Link className="header-cta" href="/subjects">Bắt đầu học <span aria-hidden="true">↗</span></Link>
      </div>
    </header>
  );
}
