import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <strong>봉래초등학교 총동문회</strong>
          <p>주소 : 전라남도 고흥군 봉래면 신금길 7 봉래초등학교 관내</p>
          <p>대표전화, 이메일, 회비/후원 계좌는 운영 확정 후 관리자 화면에서 등록합니다.</p>
          <p>COPYRIGHT © 봉래초등학교 총동문회. ALL RIGHTS RESERVED.</p>
        </div>
        <div className="footer-links">
          <Link href="/login">로그인</Link>
          <Link href="/signup">회원가입</Link>
          <Link href="/admin">관리자</Link>
        </div>
      </div>
    </footer>
  );
}
