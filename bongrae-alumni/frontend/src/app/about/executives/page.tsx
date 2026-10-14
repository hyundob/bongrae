import { executives } from "@/lib/site";
import { PageShell } from "@/components/PageShell";
import { IntroNext } from "@/components/Introduction";

export default function ExecutivesPage() {
  const roles = [...new Set(executives.map((person) => person.role))];
  return (
    <PageShell title="총동문회 임원 소개" group="총동문회 소개" description="모교와 동문을 위해 함께하는 봉래초등학교 총동문회 임원진입니다." introduction>
      <div className="roster-heading"><span className="intro-kicker">봉래초등학교 총동문회</span><p>같은 마음으로,<br /><strong>함께 이어가는 봉래.</strong></p></div>
      <div className="executive-roster">
        {roles.map((role) => (
          <section className="executive-group" key={role} aria-label={role}>
            <h2>{role}</h2>
            <ul>{executives.filter((person) => person.role === role).map((person) => (
              <li className="executive-person" key={person.name}><strong>{person.name}</strong><span>제{person.classNo}회</span></li>
            ))}</ul>
          </section>
        ))}
      </div>
      <p className="intro-source-note">제공된 총동문회 임원진 명단 기준</p>
      <IntroNext href="/about/rules" label="총동문회의 약속">총동문회 회칙</IntroNext>
    </PageShell>
  );
}
