import { historyItems } from "@/lib/site";

export default function HistoryPage() {
  return (
    <section className="section narrow">
      <p className="eyebrow">학교 연혁</p>
      <h1>봉래초등학교 연혁</h1>
      <ol className="timeline-list">
        {historyItems.map((item) => (
          <li key={`${item.date}-${item.text}`}>
            <time>{item.date}</time>
            <p>{item.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
