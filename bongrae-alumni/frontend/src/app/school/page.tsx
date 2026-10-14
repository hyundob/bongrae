import Link from "next/link";
import { menuGroups } from "@/lib/site";

const group = menuGroups.find((g) => g.title === "모교소개");

export default function SchoolPage() {
  return (
    <section className="section narrow">
      <p className="eyebrow">모교소개</p>
      <h1>봉래초등학교</h1>
      <p className="lead">
        1924년 개교, 전라남도 고흥군 봉래면 신금길 7
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
