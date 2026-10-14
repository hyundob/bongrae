import { historyItems } from "@/lib/site";
import { PageShell } from "@/components/PageShell";
import { IntroNext, SchoolPhoto } from "@/components/Introduction";

const eras = [
  { label: "1924 - 1950", title: "배움의 시작", start: 1924, end: 1950 },
  { label: "1981 - 1996", title: "함께 자라는 학교", start: 1981, end: 1996 },
  { label: "2009 - 2026", title: "이어지는 봉래의 역사", start: 2009, end: 2026 },
];

export default function SchoolHistoryPage() {
  return (
    <PageShell title="학교 연혁" group="모교소개" description="1924년, 나로도에 피어난 배움. 봉래초등학교의 시간을 돌아봅니다." introduction>
      <SchoolPhoto caption="1924년부터 이어온 봉래의 배움터" />
      <dl className="heritage-facts">
        <div><dt>개교</dt><dd>1924<span>년</span></dd></div>
        <div><dt>제99회 졸업</dt><dd>2026<span>년</span></dd></div>
        <div><dt>누계 졸업생 · 2026. 1.</dt><dd>6,971<span>명</span></dd></div>
      </dl>
      <nav className="chapter-links" aria-label="연혁 시기"><a href="#era-1924">1924 - 1950</a><a href="#era-1981">1981 - 1996</a><a href="#era-2009">2009 - 2026</a></nav>
      <div className="school-chronology">
        {eras.map((era) => (
          <section className="chronology-era" id={`era-${era.start}`} key={era.start}>
            <div className="era-heading"><span>{era.label}</span><h2>{era.title}</h2></div>
            <ol>{historyItems.filter((item) => { const year = Number(item.date.split(".")[0]); return year >= era.start && year <= era.end; }).map((item) => (
              <li className="chronology-entry" key={item.date}><time>{item.date}</time><p>{item.text}</p></li>
            ))}</ol>
          </section>
        ))}
      </div>
      <p className="intro-source-note">제공된 학교 연혁 자료 기준 · 2026년 1월까지 수록</p>
      <IntroNext href="/school/overview" label="오늘의 봉래">학교 현황</IntroNext>
    </PageShell>
  );
}
