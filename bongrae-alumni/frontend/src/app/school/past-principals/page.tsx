import { pastPrincipals } from "@/lib/site";
import { PageShell } from "@/components/PageShell";

export default function PastPrincipalsPage() {
  return (
    <PageShell title="역대 교장" group="모교소개" description="1924년 개교 이래 봉래의 배움을 이끌어온 교장 선생님들입니다." introduction>
      <div className="archive-heading"><span className="intro-kicker">봉래의 교육을 이끌다</span><h2>배움의 길을 열어주신<br />선생님들을 기억합니다.</h2></div>
      <p className="intro-source-note">제공된 역대 교장 명단 기준</p>

      <div className="principals-table-wrap">
        <table className="principals-table">
          <thead>
            <tr>
              <th scope="col">대수</th>
              <th scope="col">성명</th>
              <th scope="col">취임</th>
              <th scope="col">이임</th>
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
    </PageShell>
  );
}
