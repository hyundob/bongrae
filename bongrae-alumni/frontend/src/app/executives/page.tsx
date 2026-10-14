import { executives } from "@/lib/site";

export default function ExecutivesPage() {
  return (
    <section className="section">
      <p className="eyebrow">임원진 소개</p>
      <h1>봉래초등학교 총동문회 임원진</h1>
      <p className="lead">첨부 임원진 명단 HWP 자료를 기준으로 초기 데이터를 구성했습니다.</p>
      <div className="executive-table" role="table" aria-label="임원진 명단">
        <div className="table-row table-head" role="row">
          <span role="columnheader">직책</span>
          <span role="columnheader">성명</span>
          <span role="columnheader">기수</span>
        </div>
        {executives.map((person) => (
          <div className="table-row" role="row" key={`${person.role}-${person.name}`}>
            <span role="cell">{person.role}</span>
            <strong role="cell">{person.name}</strong>
            <span role="cell">{person.classNo}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
