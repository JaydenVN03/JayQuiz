"use client";

import { useActionState } from "react";
import { loginAdmin, type AdminFormState } from "@/app/admin/actions";

const initialState: AdminFormState = { success: true, message: "" };

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, initialState);

  return (
    <form className="admin-login-form" action={action}>
      <label>
        Email Admin
        <input autoComplete="username" name="email" required type="email" />
      </label>
      <label>
        Mật khẩu
        <input autoComplete="current-password" name="password" required type="password" />
      </label>
      {state.message && (
        <p aria-live="polite" className="admin-form-message is-error">{state.message}</p>
      )}
      <button className="button button-primary" disabled={pending} type="submit">
        {pending ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
      <p className="admin-login-help">Chỉ tài khoản đã được cấp quyền Admin mới có thể truy cập.</p>
    </form>
  );
}
