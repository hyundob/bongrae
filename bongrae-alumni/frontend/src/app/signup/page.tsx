"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { api, Member, message, POLICY_VERSION } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { PageShell } from "@/components/PageShell";
import { graduationYear, latestGraduatingClass } from "@/lib/graduation";
const provinces = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
  "해외",
];
export default function SignupPage() {
  const router = useRouter();
  const { setUser, loading } = useAuth();
  const [classNo, setClassNo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("passwordConfirm")) {
      setError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    const data: Record<string, unknown> = Object.fromEntries(form);
    for (const key of [
      "termsAgreed",
      "privacyAgreed",
      "smsAgreed",
      "emailAgreed",
      "directoryAgreed",
      "ageConfirmed",
    ])
      data[key] = form.has(key);
    data.classNo = Number(classNo);
    data.policyVersion = POLICY_VERSION;
    setBusy(true);
    try {
      setUser(
        await api<Member>("/api/auth/signup", {
          method: "POST",
          body: JSON.stringify(data),
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
    <PageShell title="회원가입">
      <form className="member-form" onSubmit={submit} method="post">
        <fieldset className="form-fields" disabled={loading}>
          <h2>기본 정보</h2>
          <div className="field-grid">
            <label>
              아이디
              <input
                name="username"
                required
                autoComplete="username"
                pattern={"[a-zA-Z0-9_.\\-]{4,30}"}
                minLength={4}
                maxLength={30}
                title="영문, 숫자, 밑줄, 점, 하이픈 4~30자"
                placeholder="영문·숫자 등 4~30자"
              />
            </label>
            <label>
              이름
              <input
                name="name"
                required
                autoComplete="name"
                minLength={2}
                maxLength={50}
              />
            </label>
            <label>
              비밀번호
              <input
                name="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={10}
                maxLength={72}
                placeholder="10자 이상"
              />
            </label>
            <label>
              비밀번호 확인
              <input
                name="passwordConfirm"
                type="password"
                required
                autoComplete="new-password"
                maxLength={72}
              />
            </label>
            <label>
              이메일
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                maxLength={120}
              />
            </label>
            <label>
              휴대폰 번호
              <input
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                pattern="01[016789]-?[0-9]{3,4}-?[0-9]{4}"
                placeholder="010-0000-0000"
              />
            </label>
            <label>
              도 / 특별시 / 광역시 (선택)
              <select name="regionProvince">
                <option value="">선택 안 함</option>
                {provinces.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label>
              시 / 군 / 구 (선택)
              <input
                name="regionCity"
                autoComplete="address-level2"
                maxLength={50}
                placeholder="고흥군"
              />
            </label>
            <label>
              졸업 기수
              <select
                name="classNo"
                required
                value={classNo}
                onChange={(e) => setClassNo(e.target.value)}
              >
                <option value="">선택</option>
                {Array.from(
                  { length: latestGraduatingClass() },
                  (_, i) => i + 1,
                ).map((n) => (
                  <option key={n} value={n}>
                    {n}회
                  </option>
                ))}
              </select>
            </label>
            <label>
              졸업 연도
              <input
                readOnly
                value={classNo ? graduationYear(Number(classNo)) + "년" : ""}
              />
            </label>
          </div>
          <h2>약관 및 동의</h2>
          <div className="consents">
            <label>
              <input type="checkbox" name="ageConfirmed" required />만 14세
              이상입니다 (필수)
            </label>
            <label>
              <input type="checkbox" name="termsAgreed" required />
              <a href="/legal/terms" target="_blank" rel="noopener">
                이용약관 동의 (필수)
              </a>
            </label>
            <label>
              <input type="checkbox" name="privacyAgreed" required />
              <a href="/legal/privacy" target="_blank" rel="noopener">
                개인정보 수집 및 이용 동의 (필수)
              </a>
            </label>
            <label>
              <input type="checkbox" name="directoryAgreed" />
              <a href="/legal/directory" target="_blank" rel="noopener">
                동문 검색 정보 제공 동의 (선택)
              </a>
            </label>
            <label>
              <input type="checkbox" name="smsAgreed" />
              <a href="/legal/notifications" target="_blank" rel="noopener">
                문자(SMS) 수신 동의 (선택)
              </a>
            </label>
            <label>
              <input type="checkbox" name="emailAgreed" />
              <a href="/legal/notifications" target="_blank" rel="noopener">
                이메일 수신 동의 (선택)
              </a>
            </label>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="actions">
            <button className="action" disabled={busy}>
              <UserPlus size={18} />
              {busy ? "가입 중" : "회원가입"}
            </button>
          </div>
        </fieldset>
      </form>
    </PageShell>
  );
}
