import Link from "next/link";
import { menuGroups } from "@/lib/site";

export function Header() {
  return (
    <header className="site-header">
      <div className="utility-bar">
        <div className="container utility-inner">
          <Link href="/">홈으로</Link>
          <Link href="/login">로그인</Link>
          <Link href="/signup">회원가입</Link>
          <Link href="/admin">관리자</Link>
        </div>
      </div>

      <div className="container header-main">
        <Link className="brand" href="/" aria-label="봉래초등학교 총동문회 홈">
          <img className="brand-logo" src="/images/logo.png" alt="봉래초등학교 교표" />
          <span>
            <strong>봉래초등학교 총동문회</strong>
            <small>함께한 백년 역사, 천년을 향한 꿈</small>
          </span>
        </Link>

        <form className="site-search" action="/boards">
          <label htmlFor="site-search">통합검색</label>
          <div>
            <input id="site-search" name="q" type="search" placeholder="검색어를 입력하세요" />
            <button type="submit">검색</button>
          </div>
        </form>
      </div>

      <nav className="primary-nav" aria-label="주 메뉴">
        <div className="container nav-inner">
          {menuGroups.map((group) => (
            <div className="nav-item" key={group.title}>
              <Link href={group.href}>{group.title}</Link>
              <div className="sub-menu">
                {group.items.map((item) => (
                  <Link key={item.title} href={item.href}>
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </header>
  );
}
