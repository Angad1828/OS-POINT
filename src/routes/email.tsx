import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { InvestigationView } from "@/components/investigation-view";

export const Route = createFileRoute("/email")({
  validateSearch: (search: Record<string, unknown>): { target?: string } => ({
    target: typeof search.target === "string" ? search.target : undefined,
  }),
  head: () => ({
    meta: [{ title: "Email intelligence — OS-POINT" }],
  }),
  component: EmailPage,
});

function EmailPage() {
  const { target } = Route.useSearch();
  return (
    <AppShell>
      <InvestigationView entity="email" initialTarget={target} />
    </AppShell>
  );
}
