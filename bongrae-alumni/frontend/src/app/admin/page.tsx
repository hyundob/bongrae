export default function AdminPage() {
  return (
    <section className="section">
      <p className="eyebrow">관리자</p>
      <h1>운영 관리</h1>
      <p className="lead">
        관리자 API는 ADMIN 권한만 접근하도록 백엔드 보안 설정에서 분리했습니다.
      </p>
      <div className="admin-grid">
        {["회원 승인", "게시판 관리", "임원진 관리", "회칙 관리", "첨부파일 관리", "감사 로그"].map(
          (item) => (
            <article key={item}>
              <strong>{item}</strong>
              <p>운영 화면 확장 시 이 메뉴에서 CRUD와 승인 흐름을 연결합니다.</p>
            </article>
          )
        )}
      </div>
    </section>
  );
}
