import Link from "next/link";
import {
  ArrowUpRight,
  GraduationCap,
  Users,
  CalendarDays,
  MessageSquare,
  Landmark,
  BookOpen,
} from "lucide-react";
import { HomePosts } from "@/components/HomePosts";
import { historyItems, quickLinks, schoolSymbols } from "@/lib/site";
const icons = [
  Users,
  BookOpen,
  GraduationCap,
  Users,
  CalendarDays,
  MessageSquare,
];
export default function HomePage() {
  return (
    <div className="home-page">
      <section className="school-hero">
        <img src="/images/school-front.jpg" alt="봉래초등학교 전경" />
        <div className="container hero-copy">
          <p>고흥 나로도, 우리의 배움이 시작된 곳</p>
          <h1>봉래초등학교 총동문회</h1>
          <span>함께한 백년 역사, 천년을 향한 꿈</span>
        </div>
      </section>
      <section className="quick-menu-band">
        <div className="container home-shortcuts">
          {quickLinks.map((item, index) => {
            const Icon = icons[index];
            return (
              <Link key={item.title} href={item.href}>
                <Icon size={25} />
                <strong>{item.title}</strong>
                <ArrowUpRight size={14} />
              </Link>
            );
          })}
        </div>
      </section>
      <section className="container home-news">
        <article>
          <div className="box-heading">
            <h2>공지사항</h2>
            <Link href="/notice/announcements" aria-label="공지사항 더보기">
              <ArrowUpRight size={20} />
            </Link>
          </div>
          <HomePosts board="announcements" />
        </article>
        <article>
          <div className="box-heading">
            <h2>행사 안내</h2>
            <Link href="/notice/events" aria-label="행사 안내 더보기">
              <ArrowUpRight size={20} />
            </Link>
          </div>
          <HomePosts board="events" />
        </article>
      </section>
      <section className="home-community-band">
        <div className="container home-community">
          <article>
            <div className="box-heading">
              <h2>열린 광장</h2>
              <Link href="/board/free" aria-label="자유게시판 더보기">
                <ArrowUpRight size={20} />
              </Link>
            </div>
            <HomePosts board="free" />
          </article>
          <article className="alumni-invitation">
            <Users size={28} />
            <h2>반가운 이름, 다시 만나는 동문</h2>
            <Link href="/alumni/search" className="action">
              동문 찾기
              <ArrowUpRight size={17} />
            </Link>
          </article>
        </div>
      </section>
      <section className="container home-records">
        <article>
          <div className="box-heading">
            <h2>모교의 발자취</h2>
            <Link href="/school/history">학교 연혁</Link>
          </div>
          <ol className="compact-history">
            {historyItems.slice(0, 4).map((item) => (
              <li key={item.date + item.text}>
                <time>{item.date}</time>
                <span>{item.text}</span>
              </li>
            ))}
          </ol>
          <div className="symbol-inline">
            {schoolSymbols.map((symbol) => (
              <span key={symbol.name}>
                {symbol.name} <strong>{symbol.value}</strong>
              </span>
            ))}
          </div>
        </article>
        <figure>
          <img
            src="/images/centennial-stone.jpg"
            alt="봉래초등학교 개교 100주년 기념석"
          />
          <figcaption>
            <Landmark size={17} />
            개교 100주년 기념석
            <Link href="/notice/gallery">
              행사 사진 및 영상
              <ArrowUpRight size={16} />
            </Link>
          </figcaption>
        </figure>
      </section>
    </div>
  );
}
