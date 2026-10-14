"use client";
import { useState } from "react";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthGate, useAuth } from "@/components/AuthProvider";
import { PageShell } from "@/components/PageShell";
import { api, message } from "@/lib/api";
import { useRemote } from "@/lib/useRemote";
type Account = {
  username: string;
  name: string;
  email: string;
  phone: string;
  regionProvince?: string;
  regionCity?: string;
  classNo?: number;
  graduationYear?: number;
  smsAgreed: boolean;
  emailAgreed: boolean;
  directoryAgreed: boolean;
};
export default function AccountPage() {
  return (
    <PageShell title="내 정보">
      <AuthGate>
        <AccountContent />
      </AuthGate>
    </PageShell>
  );
}
function AccountContent() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const { data, error, reload } = useRemote<Account>("/api/account");
  const [status, setStatus] = useState("");
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  async function preferences(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setFailure("");
    setStatus("");
    try {
      await api("/api/account/preferences", {
        method: "PATCH",
        body: JSON.stringify({
          smsAgreed: form.has("smsAgreed"),
          emailAgreed: form.has("emailAgreed"),
          directoryAgreed: form.has("directoryAgreed"),
        }),
      });
      setStatus("동의 설정을 저장했습니다.");
      reload();
    } catch (e) {
      setFailure(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function withdraw(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window.confirm("회원 정보가 삭제됩니다. 정말 탈퇴할까요?")) return;
    const password = new FormData(event.currentTarget).get("password");
    setBusy(true);
    setFailure("");
    try {
      await api("/api/account", {
        method: "DELETE",
        body: JSON.stringify({ password }),
      });
      setUser(null);
      router.replace("/");
    } catch (e) {
      setFailure(message(e));
    } finally {
      setBusy(false);
    }
  }
  if (error)
    return (
      <div className="empty-state">
        <p role="alert">{error}</p>
        <button onClick={reload}>다시 시도</button>
      </div>
    );
  if (!data) return <p className="empty-state">불러오는 중입니다.</p>;
  return (
    <>
      <dl className="account-details">
        {[
          ["아이디", data.username],
          ["이름", data.name],
          ["이메일", data.email],
          ["휴대폰 번호", data.phone],
          [
            "거주 지역",
            [data.regionProvince, data.regionCity].filter(Boolean).join(" ") ||
              "미입력",
          ],
          [
            "졸업",
            data.classNo
              ? `${data.classNo}회 (${data.graduationYear}년)`
              : "미입력",
          ],
        ].map(([name, value]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <form className="member-form" onSubmit={preferences}>
        <h2>동의 설정</h2>
        <div className="consents">
          <label>
            <input
              name="directoryAgreed"
              type="checkbox"
              defaultChecked={data.directoryAgreed}
            />
            <a href="/legal/directory" target="_blank" rel="noopener">
              동문 검색 정보 제공 동의 (선택)
            </a>
          </label>
          <label>
            <input
              name="smsAgreed"
              type="checkbox"
              defaultChecked={data.smsAgreed}
            />
            <a href="/legal/notifications" target="_blank" rel="noopener">
              문자(SMS) 수신 동의 (선택)
            </a>
          </label>
          <label>
            <input
              name="emailAgreed"
              type="checkbox"
              defaultChecked={data.emailAgreed}
            />
            <a href="/legal/notifications" target="_blank" rel="noopener">
              이메일 수신 동의 (선택)
            </a>
          </label>
        </div>
        <div className="actions">
          <button className="action" disabled={busy}>
            <Save size={18} />
            저장
          </button>
        </div>
      </form>
      {status && (
        <p className="success-note" role="status">
          {status}
        </p>
      )}
      {failure && (
        <p className="form-error" role="alert">
          {failure}
        </p>
      )}
      {user?.role !== "SUPER_ADMIN" && (
        <details className="withdrawal">
          <summary>회원 탈퇴</summary>
          <p>
            회원 정보와 동문 명부 연결은 삭제됩니다. 작성한 게시글과 첨부파일은
            ‘탈퇴 회원’으로 남으므로 개인정보가 담긴 글은 탈퇴 전에 삭제해
            주세요.
          </p>
          <form className="member-form" onSubmit={withdraw} method="post">
            <label>
              현재 비밀번호
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </label>
            <div>
              <button className="action danger" disabled={busy}>
                회원 탈퇴
              </button>
            </div>
          </form>
        </details>
      )}
    </>
  );
}
