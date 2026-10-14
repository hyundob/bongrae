"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Search } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { isAdmin, message } from "@/lib/api";
import { menuGroups } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    try {
      await logout();
      setError("");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <header className="site-header">
      <div className="utility-bar">
        <div className="container utility-inner">
          <Link href="/">홈으로</Link>
          {loading ? (
            <span>확인 중</span>
          ) : user ? (
            <>
              <Link href="/account">{user.name} 님</Link>
              <button
                className="text-button"
                onClick={() => void signOut()}
                disabled={busy}
              >
                <LogOut size={14} />
                로그아웃
              </button>
              {isAdmin(user) && <Link href="/admin">관리자</Link>}
            </>
          ) : (
            <>
              <Link href="/login">로그인</Link>
              <Link href="/signup">회원가입</Link>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="container header-main">
        <Link className="brand" href="/" aria-label="봉래초등학교 총동문회 홈">
          <img
            className="brand-logo"
            src="/images/logo.png"
            alt="봉래초등학교 교표"
          />
          <span>
            <strong>봉래초등학교 총동문회</strong>
            <small>함께한 백년 역사, 천년을 향한 꿈</small>
          </span>
        </Link>

        <form className="site-search" action="/notice/announcements">
          <label htmlFor="site-search">공지 검색</label>
          <div>
            <input
              id="site-search"
              name="q"
              type="search"
              placeholder="검색어를 입력하세요"
            />
            <button type="submit" title="공지 검색">
              <Search size={18} />
            </button>
          </div>
        </form>
      </div>

      <nav className="primary-nav" aria-label="주 메뉴">
        <div className="container nav-inner">
          {menuGroups.map((group) => (
            <div className="nav-item" key={group.title}>
              <Link href={group.href} aria-current={group.items.some((item) => pathname === item.href) ? "location" : undefined}>{group.title}</Link>
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
