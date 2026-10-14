import { PageShell } from "@/components/PageShell";
import { ArchivePending, IntroNext, SchoolPhoto } from "@/components/Introduction";

export default function AboutHistoryPage() {
  return (
    <PageShell title="총동문회 연혁" group="총동문회 소개" description="동문과 모교가 함께 걸어온 시간을 기록합니다." introduction>
      <SchoolPhoto caption="추억을 잇고, 다음 세대로" />
      <ArchivePending title="총동문회의 발자취를 준비하고 있습니다.">
        창립과 활동에 관한 기록을 확인한 뒤 연혁을 게재하겠습니다.
      </ArchivePending>
      <IntroNext href="/school/history" label="모교의 기록">1924년부터 이어온 학교 연혁</IntroNext>
    </PageShell>
  );
}
