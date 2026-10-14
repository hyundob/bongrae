import { PageShell } from "@/components/PageShell";
import { IntroNext, SchoolPhoto } from "@/components/Introduction";
import { presidentGreeting } from "@/lib/site";

export default function GreetingPage() {
  return (
    <PageShell title="총동문회장 대표 인사말" group="총동문회 소개" introduction>
      <SchoolPhoto caption="우리가 함께 자란 곳, 봉래초등학교" />
      <article className="president-letter" aria-labelledby="greeting-title">
        <header className="president-letter-heading">
          <p className="intro-kicker">{presidentGreeting.title}</p>
          <h2 id="greeting-title">{presidentGreeting.headline}</h2>
        </header>
        <div className="president-letter-body">
          {presidentGreeting.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <p className="president-signature">
          <span>{presidentGreeting.signerTitle}</span>
          <strong>{presidentGreeting.signerName}</strong> {presidentGreeting.closing}
        </p>
      </article>
      <IntroNext href="/about/executives" label="함께하는 사람들">총동문회 임원 소개</IntroNext>
    </PageShell>
  );
}
