import Link from "next/link";
import { ApiTestButton } from "@/components/ApiTestButton";
import { historyItems, quickLinks, schoolSymbols } from "@/lib/site";

const notices = [
  { title: "봉래초등학교 총동문회 홈페이지 구축 안내", date: "2026.06.16", href: "/notice/announcements" },
  { title: "총동문회 회원가입 및 동문 승인 절차 안내", date: "2026.06.16", href: "/signup" },
  { title: "임원진 명단과 회칙 초기 자료 등록", date: "2026.06.16", href: "/about/executives" },
  { title: "회비 및 후원금 안내 페이지 준비 중", date: "2026.06.16", href: "/scholarship" }
];

const freePosts = [
  { title: "자유게시판은 승인된 회원에게 공개됩니다.", date: "준비중", href: "/board/free" },
  { title: "동문 관련 소식과 소통은 열린 광장을 이용해 주세요.", date: "준비중", href: "/board/free" }
];

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="main-visual">
        <div className="container visual-grid">
          <div className="visual-banner">
            <img src="/images/school-front.jpg" alt="봉래초등학교 전경" />
            <div className="visual-copy">
              <p>고흥 나로도의 배움과 인연을 잇는 공간</p>
              <h1>봉래초등학교 총동문회</h1>
              <span>모교 발전과 동문 친목을 위한 공식 온라인 플랫폼</span>
            </div>
          </div>

          <aside className="notice-box">
            <div className="box-heading">
              <h2>공지사항</h2>
              <Link href="/notice/announcements">더보기</Link>
            </div>
            <ul className="post-list">
              {notices.map((notice) => (
                <li key={notice.title}>
                  <Link href={notice.href}>{notice.title}</Link>
                  <time>{notice.date}</time>
                </li>
              ))}
            </ul>
            <div className="member-links">
              <Link href="/login">로그인</Link>
              <Link href="/signup">회원가입</Link>
              <Link href="/alumni/search">동문 검색</Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="quick-menu-band">
        <div className="container">
          <div className="band-title">
            <strong>주요메뉴 바로가기</strong>
            <span>총동문회 운영에 필요한 핵심 메뉴입니다.</span>
          </div>
          <div className="quick-menu-grid">
            {quickLinks.map((item) => (
              <Link className="quick-menu-card" key={item.title} href={item.href}>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container content-columns">
        <article className="content-box">
          <div className="box-heading">
            <h2>열린 광장</h2>
            <Link href="/board/free">더보기</Link>
          </div>
          <p className="box-description">동문 간 소통의 공간입니다.</p>
          <ul className="post-list">
            {freePosts.map((item) => (
              <li key={item.title}>
                <Link href={item.href}>{item.title}</Link>
                <time>{item.date}</time>
              </li>
            ))}
          </ul>
        </article>

        <article className="content-box">
          <div className="box-heading">
            <h2>행사 사진·영상</h2>
            <Link href="/notice/gallery">더보기</Link>
          </div>
          <figure className="gallery-preview">
            <img src="/images/centennial-stone.jpg" alt="봉래초등학교 개교 100주년 기념석" />
            <figcaption>개교 100주년 기념사업 자료</figcaption>
          </figure>
        </article>

        <article className="content-box">
          <div className="box-heading">
            <h2>학교 상징</h2>
            <Link href="/school/symbols">더보기</Link>
          </div>
          <div className="symbol-mini-list">
            {schoolSymbols.map((symbol) => (
              <div key={symbol.name}>
                <strong>{symbol.name}</strong>
                <span>{symbol.value}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="container history-api-row">
        <article className="content-box">
          <div className="box-heading">
            <h2>학교 연혁</h2>
            <Link href="/school/history">더보기</Link>
          </div>
          <ol className="compact-history">
            {historyItems.slice(0, 5).map((item) => (
              <li key={`${item.date}-${item.text}`}>
                <time>{item.date}</time>
                <span>{item.text}</span>
              </li>
            ))}
          </ol>
        </article>

        <article className="content-box api-box">
          <div>
            <h2>API 연결 확인</h2>
            <p>Docker Compose 실행 시 Nginx의 /api 경로가 Spring Boot로 전달됩니다.</p>
          </div>
          <ApiTestButton />
        </article>
      </section>
    </div>
  );
}
