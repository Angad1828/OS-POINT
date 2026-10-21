import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { InvestigationView } from "@/components/investigation-view";

export const Route = createFileRoute("/domain")({
  validateSearch: (search: Record<string, unknown>): { target?: string } => ({
    target: typeof search.target === "string" ? search.target : undefined,
  }),
  head: () => ({
    meta: [{ title: "Domain intelligence — OS-POINT" }],
  }),
  component: DomainPage,
});

function DomainPage() {
  const { target } = Route.useSearch();
  return (
    <AppShell>
      <InvestigationView entity="domain" initialTarget={target} />
    </AppShell>
  );
}
