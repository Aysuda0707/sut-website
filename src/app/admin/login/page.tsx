"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Admin login. Posts the password to /api/admin/login, which sets an
 * HMAC-signed session cookie. On success we navigate to the dashboard.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "ورود ناموفق بود.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("خطای شبکه. دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={onSubmit}>
        <h1 className="admin-login__title">پنل مدیریت آرشیو</h1>
        <p className="admin-login__subtitle">
          برای ویرایش محتوا وارد شوید.
        </p>

        {error ? (
          <div className="admin-alert admin-alert--error" role="alert">
            {error}
          </div>
        ) : null}

        <div className="admin-field">
          <label htmlFor="password">گذرواژه</label>
          <input
            id="password"
            className="admin-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
        </div>

        <button className="admin-btn" type="submit" disabled={busy}>
          {busy ? <span className="admin-spinner" aria-hidden="true" /> : null}
          {busy ? "در حال ورود…" : "ورود"}
        </button>
      </form>
    </div>
  );
}
