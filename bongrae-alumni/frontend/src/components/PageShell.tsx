import Link from "next/link";
import { ChevronRight, House } from "lucide-react";
import { menuGroups } from "@/lib/site";
import { SectionMenu } from "./SectionMenu";
export function PageShell({
  title,
  group,
  description,
  introduction = false,
  children,
}: {
  title: string;
  group?: string;
  description?: string;
  introduction?: boolean;
  children: React.ReactNode;
}) {
  const menu = menuGroups.find((item) => item.title === group);
  return (
    <div className={`container workspace${introduction ? " introduction-page" : ""}`}>
      <aside className="section-nav">
        <strong>{group ?? "회원 서비스"}</strong>
        <SectionMenu title={title} introduction={introduction} items={menu?.items ?? [
          { title: "내 정보", href: "/account" },
          { title: "동문 검색", href: "/alumni/search" },
          { title: "이용약관", href: "/legal/terms" },
          { title: "개인정보 처리방침", href: "/legal/privacy" },
        ]} />
      </aside>
      <section className="workspace-main">
        <div className="page-heading">
          {introduction ? (
            <nav className="intro-breadcrumbs" aria-label="현재 위치">
              <Link href="/" aria-label="홈" title="홈"><House size={14} /></Link>
              <ChevronRight size={12} aria-hidden="true" />
              <Link href={menu?.href ?? "/"}>{group}</Link>
              <ChevronRight size={12} aria-hidden="true" />
              <span>{title}</span>
            </nav>
          ) : <p>{group ?? "회원 서비스"}</p>}
          <h1>{title}</h1>
          {description && <p className="intro-description">{description}</p>}
        </div>
        {children}
      </section>
    </div>
  );
}
