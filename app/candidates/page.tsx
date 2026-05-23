import { AppShell } from "@/components/app-shell";
import { CandidateTable } from "@/components/candidate-table";
import { getCandidates } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CandidatesPage() {
  const candidates = await getCandidates();

  return (
    <AppShell>
      <CandidateTable candidates={candidates} />
    </AppShell>
  );
}
