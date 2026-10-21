import {
  CASE_STATUS_LABEL,
  CHECK_STATUS_LABEL,
  type CaseStatus,
  type CheckResult,
  type CheckStatus,
} from "@/lib/osint/types";

const CASE_CLASS: Record<CaseStatus, string> = {
  complete: "completed",
  partial: "partial",
  failed: "failed",
};

export function CheckStatusMark({ status }: { status: CheckStatus }) {
  return <span className={`status status--${status}`}>{CHECK_STATUS_LABEL[status]}</span>;
}

export function CheckOutcome({ check }: { check: CheckResult }) {
  if (check.group === "input") {
    return <span className="status status--prepared">Validated</span>;
  }
  return <CheckStatusMark status={check.status} />;
}

export function CaseStatusMark({ status }: { status: CaseStatus }) {
  return (
    <span className={`status status--${CASE_CLASS[status]}`}>{CASE_STATUS_LABEL[status]}</span>
  );
}
