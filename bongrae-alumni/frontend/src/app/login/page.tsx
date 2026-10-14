import Link from "next/link";

export default function LoginPage() {
  return (
    <section className="section narrow">
      <p className="eyebrow">회원공간</p>
      <h1>로그인</h1>
      <form className="form-panel">
        <label>
          아이디
          <input type="text" name="username" autoComplete="username" />
        </label>
        <label>
          비밀번호
          <input type="password" name="password" autoComplete="current-password" />
        </label>
        <button type="button">로그인</button>
      </form>
      <div className="inline-links" id="find-account">
        <Link href="/signup">회원가입</Link>
        <a href="#find-account">아이디/비밀번호 찾기</a>
      </div>
    </section>
  );
}
