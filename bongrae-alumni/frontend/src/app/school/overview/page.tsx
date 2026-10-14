import { PageShell } from "@/components/PageShell";
import { SchoolPhoto } from "@/components/Introduction";

const nameHistory = [
  { date: "1924. 9. 10", name: "봉래공립보통학교",         type: "개교" },
  { date: "1938. 4. 1",  name: "봉래공립심상소학교",        type: "개칭" },
  { date: "1941. 4. 1",  name: "봉래공립국민학교",          type: "개칭" },
  { date: "1950. 6. 1",  name: "봉래국민학교",              type: "개칭" },
  { date: "1994. 9. 1",  name: "사양국민학교 통합 · 사양분교장 격하", type: "통합" },
  { date: "1996. 3. 1",  name: "봉래초등학교",              type: "개칭" },
  { date: "1996. 9. 1",  name: "봉래남초등학교 통합 · 봉래남분교장 격하", type: "통합" },
  { date: "1999. 9. 1",  name: "사양분교장 통폐합",          type: "폐교" },
  { date: "2012. 3. 1",  name: "봉래남분교장 통폐합",        type: "통폐합" },
];

const tfMembers = [
  "전남교육청 중등교육과장",
  "남부대학교 교수",
  "창평중학교 수석 교사",
  "매성고등학교 교감",
  "장흥용산중학교 교사",
  "나주중학교 수석 교사",
  "전남교육청 장학관",
  "전남교육청 장학사 (2명)",
];

export default function SchoolOverviewPage() {
  return (
    <PageShell title="학교 현황" group="모교소개" description="나로도에서 꿈을 키우는 배움터, 봉래초등학교입니다." introduction>
      <SchoolPhoto />
      <p className="intro-source-note">학교 현황은 제공된 2026년 자료 기준입니다.</p>
      <nav className="chapter-links" aria-label="학교 현황 목차"><a href="#school-info">기본 현황</a><a href="#students">재학생</a><a href="#staff">교직원</a><a href="#facilities">시설</a></nav>

      {/* ── 기본 현황 ── */}
      <h2 id="school-info" className="overview-section-title">기본 현황</h2>
      <div className="overview-info-grid">
        <div className="info-row">
          <span className="info-label">학교명</span>
          <span className="info-value">봉래초등학교</span>
        </div>
        <div className="info-row">
          <span className="info-label">소재지</span>
          <span className="info-value">고흥군 봉래면 신금길 7번지 (신금리 655번지)</span>
        </div>
        <div className="info-row">
          <span className="info-label">학교 위치</span>
          <span className="info-value">동경 127° 28′ 12″ · 북위 34° 28′ 6″</span>
        </div>
        <div className="info-row">
          <span className="info-label">학교 부지</span>
          <span className="info-value">11,370㎡</span>
        </div>
        <div className="info-row">
          <span className="info-label">건물 연면적</span>
          <span className="info-value">2,480㎡</span>
        </div>
      </div>

      {/* ── 재학생 현황 ── */}
      <h2 id="students" className="overview-section-title">재학생 현황 <span className="section-sub">(2026년 기준)</span></h2>
      <div className="overview-stats">
        <div className="stat-card stat-card--accent">
          <span className="stat-label">초등 전체</span>
          <strong className="stat-value">26명</strong>
        </div>
        <div className="stat-card stat-card--accent">
          <span className="stat-label">유치원</span>
          <strong className="stat-value">10명</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">1학년</span>
          <strong className="stat-value">2명</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">2학년</span>
          <strong className="stat-value">2명</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">3학년</span>
          <strong className="stat-value">4명</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">4학년</span>
          <strong className="stat-value">7명</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">5학년</span>
          <strong className="stat-value">5명</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">6학년</span>
          <strong className="stat-value">6명</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">도움반</span>
          <strong className="stat-value">1명</strong>
        </div>
      </div>

      {/* ── 교직원 현황 ── */}
      <h2 id="staff" className="overview-section-title">교직원 현황</h2>
      <div className="overview-stats overview-stats--small">
        <div className="stat-card">
          <span className="stat-label">교장</span>
          <strong className="stat-value">1명</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">교감</span>
          <strong className="stat-value">1명</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">부장교사</span>
          <strong className="stat-value">3명</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">일반교사</span>
          <strong className="stat-value">4명</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">행정직원</span>
          <strong className="stat-value">2명</strong>
        </div>
      </div>

      {/* ── 시설 현황 ── */}
      <h2 id="facilities" className="overview-section-title">시설 현황</h2>
      <div className="overview-info-grid">
        <div className="info-row">
          <span className="info-label">운동장</span>
          <span className="info-value">9,715㎡</span>
        </div>
        <div className="info-row">
          <span className="info-label">체육관</span>
          <span className="info-value">1동</span>
        </div>
        <div className="info-row">
          <span className="info-label">특별실</span>
          <span className="info-value">컴퓨터실, 도서관, 영어체험실, 방송실, 미술실, 예절실</span>
        </div>
      </div>

      {/* ── 학교 설립 동기 ── */}
      <details className="school-record-details">
      <summary>학교의 시작과 교명의 변천</summary>
      <h2 className="overview-section-title">학교 설립 동기</h2>
      <div className="overview-prose">
        <p>
          일제 중엽에 일본인들이 어업 입지 조건이 좋은 점을 감안하여 나로도에 이주하는 자가 많아지자,
          일본인들은 그들의 자녀를 교육하기 위하여 심상소학교를 설립하였습니다. 이에 도민(島民)들은
          자녀 교육의 필요성을 절감하고 처음 비치리에 사립학교를 설립하였으나, 도민들의 한결같은
          간청과 소망으로 본면에 단 하나의 공립 보통학교를 설치하기에 이르렀습니다.
        </p>
        <p>
          일제 시대에는 연안에 새우가 많이 나고 기타 수많은 어선들이 몰려 성시를 이루었으며,
          지역 주민들의 인심도 비교적 후한 편이었습니다.
        </p>
        <p>
          1995년 나로도 연륙교와 연도교가 개통되어 생활 여건이 편리해지고, 문화·경제 면이 크게
          향상될 전망을 맞이하였습니다.
        </p>
      </div>

      {/* ── 학교명 유래 ── */}
      <h2 className="overview-section-title">학교명 유래</h2>
      <div className="overview-prose">
        <p>
          봉래초등학교는 고흥군 봉래면에 있는 단 하나밖에 없는 가장 큰 중심 학교이며, 처음 생긴
          학교이기에 소재지의 이름을 붙여 <strong>봉래초등학교</strong>라 하였습니다.
        </p>
      </div>

      {/* ── 학교명 변천 ── */}
      <h2 className="overview-section-title">학교명 변천</h2>
      <div className="principals-table-wrap">
        <table className="principals-table">
          <thead>
            <tr>
              <th>년 월 일</th>
              <th>교명</th>
              <th>구분</th>
            </tr>
          </thead>
          <tbody>
            {nameHistory.map((row) => (
              <tr key={row.date + row.type}>
                <td style={{ whiteSpace: "nowrap" }}>{row.date}</td>
                <td>{row.name}</td>
                <td style={{ whiteSpace: "nowrap" }}>{row.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 교가 변경 과정 ── */}
      </details>
      <details className="school-record-details">
      <summary>새 교가가 만들어지기까지</summary>
      <h2 className="overview-section-title">교가 변경 과정</h2>

      <div className="overview-prose">
        <p className="prose-label">공문</p>
        <p>「학교 내 친일 잔재 청산」 기본 계획 (정책기획관_3757, 2019. 4. 3)</p>
        <ul className="overview-list">
          <li>3·1절 100주년을 맞아 역사교육 강화를 위해 학교 내 친일 잔재 청산 추진</li>
          <li>조사 대상: 학교 상징, 교가, 학교장 사진, 석물 등</li>
        </ul>
      </div>

      <div className="overview-prose">
        <p className="prose-label">교가 TF 위원</p>
        <ul className="overview-list overview-list--grid">
          {tfMembers.map((m) => <li key={m}>{m}</li>)}
        </ul>
      </div>

      <div className="overview-prose">
        <p className="prose-label">1차 컨설팅 주요 내용</p>
        <ul className="overview-list">
          <li>기존 교가 중 &apos;청아한 학도야&apos; 가사는 현시대 초등학생에게 적합하지 않아 전체 교가 변경 필요</li>
          <li>미래 지향적인 가사로 새롭게 정립 필요</li>
          <li>학생들이 기억하기 쉬운 어휘와 문장으로 작사 필요</li>
          <li>학교 교육 목표와 의미를 포함할 것</li>
        </ul>
        <p style={{ marginTop: "0.75rem", color: "var(--muted)", fontSize: "0.9rem" }}>
          1차 컨설팅 후 가사를 교내에 공개하고, TF 구성원 협의 후 작곡가에게 가사를 전달하였습니다.
          이를 통해 봉래초등학교는 기존 교가를 폐지하고 새로운 교가를 정립하기로 결정하였습니다.
        </p>
      </div>

      <h2 className="overview-section-title" style={{ fontSize: "1rem" }}>변경 전·후 교가 가사</h2>
      <div className="song-compare">
        <div className="song-compare-col">
          <p className="song-compare-label">변경 전 교가</p>
          <pre className="song-lyrics">{`우렁찬 태평양의 물결소리는
억만백사 굴리어 옥을 만들고
창공에 솟아오른 청송정기는
강철같은 봉래의 기상이로다
희망의 슬기있는 청아한 학도야
빛나는 봉래전통 교풍이루세`}</pre>
        </div>
        <div className="song-compare-col song-compare-col--new">
          <p className="song-compare-label">변경 후 교가</p>
          <pre className="song-lyrics">{`나로도 푸른물결 고운꿈이 넘실대고
우주의 문을여니 미래의 희망이 솟는다.
늘푸른 동백처럼 건강하게 자라고
존중하고 배려하며 바른마음 키운다.
세계를 꿈에안고 미래를 꿈꾸는
봉래초 우리학교 행복한 배움터`}</pre>
        </div>
      </div>

      <div className="overview-prose" style={{ marginTop: "1.5rem" }}>
        <p className="prose-label">작곡 추진 일지</p>
        <ul className="overview-list">
          <li><time>2020. 10. 5</time> — 1차 작곡 후 TF 구성원 전체 공람 (작곡: 신동민 교수)</li>
          <li><time>2020. 10. 7</time> — TF 의견 수렴 후 수정</li>
          <li><time>2020. 10. 13</time> — 2차 수정 작곡(시안) 후 TF 구성원 전체 공람</li>
          <li><time>2020. 10. 14</time> — 최종 작곡 결정</li>
        </ul>
      </div>
      </details>
    </PageShell>
  );
}
