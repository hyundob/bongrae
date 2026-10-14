import { AuthGate } from "@/components/AuthProvider";
import { AdminWorkspace } from "@/components/AdminWorkspace";
import { PageShell } from "@/components/PageShell";
export default function AdminPage() {
  return (
    <PageShell title="관리자">
      <AuthGate admin>
        <AdminWorkspace />
      </AuthGate>
    </PageShell>
  );
}
