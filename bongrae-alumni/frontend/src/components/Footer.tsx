import Link from "next/link";
import { associationContact } from "@/lib/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-office">
          <strong>봉래초등학교 총동문회</strong>
          <address>
            <span>총동문회 사무실</span>
            <p>({associationContact.postalCode}) {associationContact.officeAddress}</p>
          </address>
          <p>문의 전화·이메일: 미정</p>
        </div>
        <section className="footer-donation" aria-label="후원금 계좌 안내">
          <h2>후원금 계좌 안내</h2>
          <p className="footer-account">
            <span>{associationContact.donation.bank}</span>
            <strong>{associationContact.donation.accountNumber}</strong>
          </p>
          <p>예금주: {associationContact.donation.accountHolder}</p>
        </section>
      </div>
      <div className="container footer-bottom">
        <p>COPYRIGHT © 봉래초등학교 총동문회. ALL RIGHTS RESERVED.</p>
        <div className="footer-links">
          <Link href="/legal/terms">이용약관</Link>
          <Link href="/legal/privacy">개인정보 처리방침</Link>
        </div>
      </div>
    </footer>
  );
}
