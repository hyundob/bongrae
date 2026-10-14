import { boards } from "@/lib/site";

export default function BoardsPage() {
  return (
    <section className="section">
      <p className="eyebrow">게시판</p>
      <h1>알림마당과 열린광장</h1>
      <p className="lead">
        공지, 행사, 동문 동정, 애경사, 장학/후원 게시판을 권한별로 분리하는 구조입니다.
      </p>
      <div className="board-grid">
        {boards.map((board) => (
          <article className="board-card" key={board.type}>
            <span>{board.access}</span>
            <strong>{board.name}</strong>
            <p>{board.text}</p>
            <button type="button">목록 보기</button>
          </article>
        ))}
      </div>
    </section>
  );
}
