import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { Workspace } from "@/components/workspace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Workspace — OS-POINT" }],
  }),
  component: WorkspacePage,
});

function WorkspacePage() {
  return (
    <AppShell>
      <Workspace />
    </AppShell>
  );
}
