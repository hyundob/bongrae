import { rules } from "@/lib/site";

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
    <section className="section">
      <p className="eyebrow">총동문회 소개</p>
      <h1>봉래초등학교 총동문회 회칙</h1>

      {chapters.map(([chapter, articles]) => (
        <div key={chapter} className="rules-chapter">
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
        </div>
      ))}
    </section>
  );
}
