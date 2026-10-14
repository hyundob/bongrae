import Image from "next/image";
import { ExternalLink, Music2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";

const BASE = "https://bongnae.es.jne.kr";

const symbolItems = [
  {
    name: "교화",
    value: "동백",
    desc: "늘 푸른 기상, 정열과 의지",
    src: `${BASE}/upload/bongnae_es/ss/img_1a59v3da7=42va3=4bv22=a2v66=97c5vab66v54b9_v6050.png`,
  },
  {
    name: "교목",
    value: "비자나무",
    desc: "꿋꿋하고 강한 마음",
    src: `${BASE}/upload/bongnae_es/ss/img_4d7evfbc1=7dvcb=41v4f=80vc6=847av7237v96a0_v7363.png`,
  },
  {
    name: "교색",
    value: "파랑색",
    desc: "하늘과 바다와 같은 큰 꿈",
    src: `${BASE}/upload/bongnae_es/ss/img_5df2vde70=4bvc8=4av8e=a0v2a=2d8cvde78v9a62_v2079.png`,
  },
];

export default function SchoolSymbolsPage() {
  return (
    <PageShell title="교가 및 상징" group="모교소개" description="봉래의 마음과 꿈을 담은 우리 학교의 상징입니다." introduction>

      {/* 교표 */}
      <div className="symbol-emblem-wrap">
        <div className="symbol-emblem-img">
          <Image
            src="/images/logo.png" width={180} height={180}
            alt="봉래초등학교 교표"
          />
        </div>
        <div className="symbol-emblem-text">
          <p className="eyebrow">교표</p>
          <h2>우주를 품은 큰 꿈</h2>
          <p>
            무궁화 꽃잎은 섬세한 아름다움과 완강한 자생력을 의미하며,
            중앙의 원은 우주를 품은 큰 꿈을 의미합니다.
          </p>
        </div>
      </div>

      {/* 교화·교목·교색 */}
      <div className="symbols-trio">
        {symbolItems.map((s) => (
          <div className="symbol-card" key={s.name}>
            <div className="symbol-card-img">
              <img src={s.src} alt={`${s.name} — ${s.value}`} />
            </div>
            <div className="symbol-card-body">
              <span className="symbol-card-label">{s.name}</span>
              <strong className="symbol-card-value">{s.value}</strong>
              <p className="symbol-card-desc">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 교가 */}
      <div className="intro-section-heading"><h2><Music2 size={22} aria-hidden="true" /> 봉래초등학교 교가</h2><a href="/images/school-song.jpg" target="_blank" rel="noopener noreferrer">악보 크게 보기 <ExternalLink size={15} aria-hidden="true" /></a></div>
      <div className="song-sheet">
        <Image
          src="/images/school-song.jpg" width={992} height={1403} sizes="(max-width: 680px) 100vw, 860px"
          alt="봉래초등학교 교가 악보"
        />
      </div>
    </PageShell>
  );
}
