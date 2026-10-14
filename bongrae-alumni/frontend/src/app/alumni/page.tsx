export default function AlumniPage() {
  return (
    <section className="section narrow">
      <p className="eyebrow">동문마당</p>
      <h1>동문 검색</h1>
      <div className="guard-panel">
        <strong>ALUMNI_MEMBER 이상 접근</strong>
        <p>
          동문 검색은 개인정보가 포함될 수 있으므로 승인된 동문회원, 기수 관리자,
          관리자만 접근하도록 설계했습니다.
        </p>
      </div>
      <form className="form-panel">
        <label>
          이름
          <input type="text" name="name" placeholder="예: 신판로" />
        </label>
        <label>
          기수
          <input type="text" name="classNo" placeholder="예: 40" />
        </label>
        <label>
          지역
          <input type="text" name="region" placeholder="예: 고흥, 서울" />
        </label>
        <button type="button">검색</button>
      </form>
    </section>
  );
}
