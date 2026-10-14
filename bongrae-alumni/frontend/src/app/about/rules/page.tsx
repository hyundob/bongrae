import { rules } from "@/lib/site";
import { PageShell } from "@/components/PageShell";

// chapter 순서를 배열 순서 그대로 유지하며 그룹핑
function groupByChapter(articles: typeof rules) {
  const seen = new Map<string, typeof rules>();
  for (const a of articles) {
    if (!seen.has(a.chapter)) seen.set(a.chapter, []);
    seen.get(a.chapter)!.push(a);
  }
  return Array.from(seen.entries());
}

export default function RulesPage() {
  const chapters = groupByChapter(rules);

  return (
    <PageShell title="총동문회 회칙" group="총동문회 소개" description="모교의 발전과 동문의 화합을 위한 공동의 약속입니다." introduction>
      <div className="rules-intro"><span className="intro-kicker">봉래초등학교 총동문회 회칙</span><p>2025년 제정</p></div>
      <nav className="chapter-links" aria-label="회칙 목차">
        {chapters.map(([chapter], index) => <a key={chapter} href={`#chapter-${index + 1}`}>{chapter}</a>)}
      </nav>

      {chapters.map(([chapter, articles], index) => (
        <section key={chapter} id={`chapter-${index + 1}`} className="rules-chapter">
          <h2 className="rules-chapter-title">{chapter}</h2>
          {articles.map((article) => (
            <article key={article.no} className="rule-article">
              <h3 className="rule-no">
                {article.no}
                {article.title ? <span>({article.title})</span> : null}
              </h3>
              <p className="rule-body">{article.body}</p>
            </article>
          ))}
        </section>
      ))}
    </PageShell>
  );
}
