import { executives } from "@/lib/site";

export default function ExecutivesPage() {
  return (
    <section className="section">
      <p className="eyebrow">총동문회 소개</p>
      <h1>봉래초등학교 총동문회 임원 소개</h1>
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
