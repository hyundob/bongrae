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
    <section className="section">
      <p className="eyebrow">모교소개</p>
      <h1>교가 및 상징</h1>

      {/* 교표 */}
      <div className="symbol-emblem-wrap">
        <div className="symbol-emblem-img">
          <img
            src={`${BASE}/upload/bongnae_es/ss/img_5844v56ce=7ave5=4bv14=96v34=5fb6v4057vbc29_v3384.png`}
            alt="봉래초등학교 교표"
          />
        </div>
        <div className="symbol-emblem-text">
          <p className="eyebrow">교표</p>
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
      <p className="eyebrow" style={{ marginBottom: "14px" }}>교가</p>
      <div className="song-sheet">
        <img
          src={`${BASE}/upload/bongnae_es/ss/img_6a42vc273=13va7=4ev53=a6v81=dd5av3889v8210_v7243.png`}
          alt="봉래초등학교 교가 악보"
        />
      </div>
    </section>
  );
}
