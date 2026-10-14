"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";
import type { MenuItem } from "@/lib/site";

export function SectionMenu({ items, title, introduction }: {
  items: MenuItem[];
  title: string;
  introduction: boolean;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    function revealCurrent() {
      if (!nav || nav.scrollWidth <= nav.clientWidth) return;
      const current = nav.querySelector<HTMLElement>('[aria-current="page"]');
      if (!current) return;
      const link = current.getBoundingClientRect();
      const container = nav.getBoundingClientRect();
      nav.scrollLeft += link.left - container.left - (nav.clientWidth - link.width) / 2;
    }
    const observer = new ResizeObserver(revealCurrent);
    observer.observe(nav);
    revealCurrent();
    return () => observer.disconnect();
  }, [title]);

  return (
    <nav ref={ref} aria-label="하위 메뉴">
      {items.map((item) => (
        <Link key={item.href} href={item.href} aria-current={item.title === title ? "page" : undefined}>
          {item.title}
          {introduction && <ChevronRight size={15} aria-hidden="true" />}
        </Link>
      ))}
    </nav>
  );
}
