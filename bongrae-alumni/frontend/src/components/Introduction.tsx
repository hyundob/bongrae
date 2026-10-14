import Image from "next/image";
import Link from "next/link";
import { Archive, ArrowUpRight } from "lucide-react";

export function SchoolPhoto({ caption = "봉래초등학교 전경" }: { caption?: string }) {
  return (
    <figure className="intro-school-photo">
      <Image src="/images/school-front.jpg" alt="봉래초등학교 교사와 운동장" width={1536} height={1152} sizes="(max-width: 680px) 100vw, 920px" priority />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function ArchivePending({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="archive-pending">
      <Archive size={30} strokeWidth={1.4} aria-hidden="true" />
      <div><span className="intro-kicker">기록 준비 중</span><h2>{title}</h2><p>{children}</p></div>
    </div>
  );
}

export function IntroNext({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link className="intro-next" href={href}>
      <span><small>{label}</small><strong>{children}</strong></span><ArrowUpRight size={25} aria-hidden="true" />
    </Link>
  );
}
