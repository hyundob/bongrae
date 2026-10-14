import { pastPrincipals } from "@/lib/site";

export default function PastPrincipalsPage() {
  return (
    <section className="section">
      <p className="eyebrow">모교소개</p>
      <h1>역대 교장</h1>
      <p className="lead" style={{ marginBottom: "2.5rem" }}>
        1924년 개교 이래 봉래초등학교 역대 교장 선생님 명단입니다.
      </p>

      <div className="principals-table-wrap">
        <table className="principals-table">
          <thead>
            <tr>
              <th>대수</th>
              <th>성명</th>
              <th>취임</th>
              <th>이임</th>
            </tr>
          </thead>
          <tbody>
            {pastPrincipals.map((p) => (
              <tr key={p.no} className={p.end === "현재" ? "current-principal" : ""}>
                <td>{p.no}</td>
                <td>{p.name}</td>
                <td>{p.start}</td>
                <td>{p.end}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
