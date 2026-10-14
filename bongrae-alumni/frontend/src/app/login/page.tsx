"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { api, Member, message } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { PageShell } from "@/components/PageShell";
export default function LoginPage() {
  const { setUser, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      setUser(
        await api<Member>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify(values),
        }),
      );
      router.replace("/account");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <PageShell title="로그인">
      <form className="member-form login-form" onSubmit={submit} method="post">
        <fieldset className="form-fields" disabled={loading}>
          <label>
            아이디
            <input
              name="username"
              required
              autoComplete="username"
              maxLength={50}
            />
          </label>
          <label>
            비밀번호
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="action" disabled={busy}>
            <LogIn size={18} />
            {busy ? "로그인 중" : "로그인"}
          </button>
          <Link className="text-link" href="/signup">
            회원가입
          </Link>
        </fieldset>
      </form>
    </PageShell>
  );
}
