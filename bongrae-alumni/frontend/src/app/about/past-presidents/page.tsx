import { PageShell } from "@/components/PageShell";
import { ArchivePending, IntroNext } from "@/components/Introduction";

export default function PastPresidentsPage() {
  return (
    <PageShell title="역대 총동문회장" group="총동문회 소개" description="총동문회의 길을 함께 열어온 분들을 기립니다." introduction>
      <div className="archive-heading"><span className="intro-kicker">봉래의 사람들</span><h2>모교를 향한 마음,<br />그 헌신을 기억합니다.</h2></div>
      <ArchivePending title="역대 총동문회장 명단을 준비하고 있습니다.">
        성명과 재임 기간을 확인한 뒤 순차적으로 게재하겠습니다.
      </ArchivePending>
      <IntroNext href="/about/executives" label="현재 임원진">총동문회 임원 소개</IntroNext>
    </PageShell>
  );
}
