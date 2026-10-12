export function SupabaseSetupNotice() {
  return (
    <aside className="setup-notice" role="status">
      <span className="setup-notice-icon" aria-hidden="true">!</span>
      <div>
        <strong>Cần áp dụng schema JayQuiz lên Supabase</strong>
        <p>
          Kết nối Supabase đã hoạt động, nhưng database chưa có các view JayQuiz.
          Để không cần đăng nhập Supabase CLI, mở SQL Editor của project và lần
          lượt chạy nội dung hai file bên dưới:
        </p>
        <ol className="setup-steps">
          <li>
            <a
              href="https://supabase.com/dashboard/project/altlbaskbyesrjhynujd/sql/new"
              rel="noreferrer"
              target="_blank"
            >
              Mở Supabase SQL Editor <span aria-hidden="true">↗</span>
            </a>
          </li>
          <li>
            Chạy <code>supabase/migrations/202610120001_initial_schema.sql</code>.
          </li>
          <li>Chạy tiếp <code>supabase/seed.sql</code> để thêm dữ liệu mẫu.</li>
        </ol>
        <p className="setup-cli-note">
          Nếu Supabase CLI đã đăng nhập sẵn trên máy, có thể thay hai bước SQL
          bằng <code>npx supabase db push --project-ref altlbaskbyesrjhynujd</code>.
        </p>
      </div>
    </aside>
  );
}
