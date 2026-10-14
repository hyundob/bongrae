import { historyItems } from "@/lib/site";

export default function SchoolHistoryPage() {
  return (
    <section className="section">
      <p className="eyebrow">모교소개</p>
      <h1>봉래초등학교 연혁</h1>
      <p className="lead" style={{ marginBottom: "2.5rem" }}>
        1924년 개교 이래 봉래초등학교의 주요 연혁을 정리하였습니다.
      </p>

      <ol className="history-timeline">
        {historyItems.map((item, index) => (
          <li key={`${item.date}-${item.text}`} className="history-item">
            <div className="history-dot" aria-hidden="true" />
            <div className="history-content">
              <time className="history-date">{item.date}</time>
              <p className="history-text">{item.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
