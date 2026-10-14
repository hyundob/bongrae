export default function AlumniSearchPage() {
  return (
    <section className="section narrow">
      <p className="eyebrow">봉래人</p>
      <h1>동문 검색</h1>
      <div className="guard-panel">
        <strong>회원 전용</strong>
        <p>동문 검색은 개인정보 보호를 위해 승인된 회원만 이용할 수 있습니다.</p>
      </div>
      <form className="form-panel">
        <label>
          이름
          <input type="text" name="name" placeholder="예: 홍길동" />
        </label>
        <label>
          기수
          <input type="text" name="classNo" placeholder="예: 40" />
        </label>
        <button type="button">검색</button>
      </form>
    </section>
  );
}
