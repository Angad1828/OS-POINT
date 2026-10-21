import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { ReportView } from "@/components/report-view";
import { useCase } from "@/hooks/use-cases";
import { useHydrated } from "@/hooks/use-hydrated";

export const Route = createFileRoute("/report/$caseId")({
  head: () => ({
    meta: [{ title: "Report — OS-POINT" }],
  }),
  component: ReportPage,
});

export function ReportPage() {
  const { caseId } = Route.useParams();
  const record = useCase(caseId);
  const hydrated = useHydrated();
  const navigate = useNavigate();

  return (
    <AppShell>
      {!hydrated ? (
        <div className="panel">
          <div className="panel-body muted small" role="status">
            Opening the report from this browser…
          </div>
        </div>
      ) : record ? (
        <ReportView caseId={caseId} />
      ) : (
        <>
          <header className="page-head">
            <div>
              <div className="eyebrow">Case record</div>
              <h1 className="page-title">Case not found</h1>
              <p className="page-sub">
                No case with the identifier <span className="mono">{caseId}</span> is stored in this
                browser. Cases are local to this browser and are not shared between devices.
              </p>
            </div>
          </header>
          <div className="empty">
            <span className="empty-title">Nothing to open</span>
            Return to the workspace to view the cases that are stored here, or start a new
            investigation.
            <div className="empty-actions">
              <Link to="/" className="btn btn-primary">
                Go to workspace
              </Link>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
