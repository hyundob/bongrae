import Link from "next/link";
import { menuGroups } from "@/lib/site";

const group = menuGroups.find((g) => g.title === "총동문회 소개");

export default function AboutPage() {
  return (
    <section className="section narrow">
      <p className="eyebrow">총동문회 소개</p>
      <h1>봉래초등학교 총동문회</h1>
      <p className="lead">
        모교 발전 및 후원사업에 기여하고 동문 상호 간의 친목 도모를 목적으로 합니다.
      </p>
      <nav className="content-grid" style={{ marginTop: 32 }}>
        {group?.items.map((item) => (
          <Link className="board-card" key={item.href} href={item.href}>
            <strong>{item.title}</strong>
          </Link>
        ))}
      </nav>
    </section>
  );
}
