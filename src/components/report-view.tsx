import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getCase } from "@/lib/case-store";

import {
  CASE_SCHEMA_VERSION,
  TOOL_VERSION,
  CheckStatus,
  Finding,
  FindingClassification,
  Relationship,
  RelationshipClassification,
  deriveCaseStatus,
  CHECK_STATUS_LABEL,
  CLASSIFICATION_LABEL,
  RELATIONSHIP_LABEL,
} from "@/lib/osint/types";
import { formatUtc } from "@/lib/format";

export function ReportView({ caseId }: { caseId: string }) {
  const navigate = useNavigate();
  const caseRecord = getCase(caseId);

  // Use a ref to avoid stale closure on caseId - getCase reads from storage synchronously
  const caseRecordRef = useRef(caseRecord);
  caseRecordRef.current = caseRecord;

  useEffect(() => {
    if (!caseRecordRef.current) {
      navigate({ to: "/" });
    }
  }, [navigate]);

  if (!caseRecordRef.current) {
    return null;
  }

  const caseStatus = deriveCaseStatus(caseRecordRef.current.checks ?? []);

  // Classification label helpers — each uses its own label record.
  function classLabel(cls: FindingClassification): string {
    return CLASSIFICATION_LABEL[cls] || cls;
  }
  function relLabel(cls: RelationshipClassification): string {
    return RELATIONSHIP_LABEL[cls] || cls;
  }

  function checkStatusLabel(status: CheckStatus): string {
    return CHECK_STATUS_LABEL[status] || status;
  }

  // ---- Format a finding for display ----
  function formatFinding(finding: Finding): string {
    const classificationTag = classLabel(finding.classification);
    const checkRef =
      finding.checkIds.length > 0
        ? `Supporting checks: ${finding.checkIds.join(", ")}`
        : "No supporting checks";
    const parts: string[] = [finding.statement + " (" + classificationTag + ")", checkRef];
    if (finding.limitation) {
      parts.push("Limitation: " + finding.limitation);
    }
    return parts.join(" ");
  }

  // ---- Format a relationship for display ----
  function formatRelationship(rel: Relationship): string {
    const classificationTag = relLabel(rel.classification);
    const evidenceRef =
      rel.evidenceIds.length > 0
        ? `Supporting evidence: ${rel.evidenceIds.join(", ")}`
        : "No supporting evidence";
    const parts: string[] = [rel.type + " (" + classificationTag + ")", evidenceRef];
    if (rel.limitation) {
      parts.push("Limitation: " + rel.limitation);
    }
    return parts.join(" ");
  }

  // ---- Pre‑compute DNS records text (satisfies noUncheckedIndexedAccess) ----
  const dnsChecks = caseRecordRef.current.checks?.filter((c) => c.group === "dns") || [];
  const dnsRecordsText =
    dnsChecks.length > 0
      ? dnsChecks
          .flatMap((c) => c.records?.map((r) => `${r.type} ${r.data} (TTL: ${r.ttl})`))
          .join("\n") || "No DNS records collected"
      : "No DNS records collected";

  return (
    <div className="report-view">
      {/* 1. COVER + EXECUTIVE SUMMARY */}
      <header className="report-cover">
        <div className="report-branding">
          <div className="brand-mark">OS-POINT</div>
          <div className="brand-subtitle">
            Open-source intelligence and digital investigation workspace
          </div>
        </div>
        <div className="report-meta">
          <div className="meta-row">
            <span className="meta-label">Case ID</span>
            <span className="meta-value">{caseRecordRef.current.id}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Target</span>
            <span className="meta-value">{caseRecordRef.current.target}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Investigation type</span>
            <span className="meta-value">{caseRecordRef.current.entityType}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Generated</span>
            <span className="meta-value">
              {caseRecordRef.current.completedAt
                ? formatUtc(caseRecordRef.current.completedAt)
                : "In progress"}
            </span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Tool version</span>
            <span className="meta-value">{TOOL_VERSION}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Schema version</span>
            <span className="meta-value">{CASE_SCHEMA_VERSION}</span>
          </div>
        </div>
      </header>

      <section className="report-executive-summary">
        <h2 className="report-section-title">Executive summary</h2>
        <p className="report-executive-text">
          This report documents the findings of an OS-POINT intelligence investigation targeting
          {caseRecordRef.current.target}. The investigation queried public sources including Google Public DNS,
          RDAP, Gravatar, and (for username checks) the GitHub public API. All results are
          evidence-backed and linked to specific check IDs; conclusions are qualified by the
          supporting evidence.
        </p>
        <p className="report-executive-text">
          <strong>Overall assessment:</strong> {" "}
          {caseStatus === "complete"
            ? "All configured checks completed with collected observations."
            : caseStatus === "partial"
              ? "Some checks completed; certain sources returned no record or failed."
              : "One or more checks failed or were not attempted."}
        </p>
      </section>

      {/* 2. SCOPE AND METHODOLOGY */}
      <section className="report-section">
        <h2 className="report-section-title">Scope and methodology</h2>
        <dl className="report-dl">
          <div className="report-dl-row">
            <dt className="report-dt">Target investigated</dt>
            <dd className="report-dd">{caseRecordRef.current.target}</dd>
          </div>
          <div className="report-dl-row">
            <dt className="report-dt">Sources queried</dt>
            <dd className="report-dd">
              {caseRecordRef.current.checks?.map((check) => (
                <div key={check.id}>
                  •{check.group}: {checkStatusLabel(check.status)}
                </div>
              ))}
            </dd>
          </div>
          <div className="report-dl-row">
            <dt className="report-dt">Methods used</dt>
            <dd className="report-dd">
              <ul>
                <li>Syntax validation and domain/username normalisation</li>
                <li>DNS resolution via Google Public DNS</li>
                <li>SPF/DMARC/TXT record parsing</li>
                <li>RDAP registration data lookup</li>
                <li>Gravatar hash avatar lookup (email module)</li>
                <li>GitHub public API profile check (username module)</li>
              </ul>
            </dd>
          </div>
          <div className="report-dl-row">
            <dt className="report-dt">Sources unavailable</dt>
            <dd className="report-dd">
              {caseRecordRef.current.checks.some((c) => c.status === "not_checked")
                ? "Some checks could not be performed with the available information."
                : "None."}
            </dd>
          </div>
          <div className="report-dl-row">
            <dt className="report-dt">Investigation boundaries</dt>
            <dd className="report-dd">
              <p>
                No breach or exposure databases are queried without an explicit API key. No
                credential testing or mailbox probing is performed. Profile matches from the GitHub
                API are recorded as discovery leads — no profile URL is attributed to an email owner
                without supporting evidence.
              </p>
              <p>
                Identity confidence and security risk are reported as "not assessed" unless evidence
                supports them. This build has no scoring model and does not invent one.
              </p>
            </dd>
          </div>
        </dl>
      </section>

      {/* 3. KEY FINDINGS */}
      {caseRecordRef.current.findings.length > 0 ? (
        <section className="report-section">
          <h2 className="report-section-title">Key findings</h2>
          <ol>
            {caseRecordRef.current.findings.map((finding) => (
              <li key={finding.id}>{formatFinding(finding)}</li>
            ))}
          </ol>
        </section>
      ) : (
        <section className="report-section">
          <h2 className="report-section-title">Key findings</h2>
          <p>
            No findings recorded. The investigation ran but no observations were extracted, or all
            checks returned "no record" or "not checked".
          </p>
        </section>
      )}

      {/* 4. TECHNICAL OBSERVATIONS */}
      <section className="report-section">
        <h2 className="report-section-title">Technical observations</h2>
        <dl className="report-dl">
          <div className="report-dl-row">
            <dt className="report-dt">Case status</dt>
            <dd className="report-dd">
              {caseStatus === "complete"
                ? "All configured checks completed"
                : caseStatus === "partial"
                  ? "Partial — some checks completed, some failed or returned no record"
                  : "Failed — one or more checks failed"}
            </dd>
          </div>
          <div className="report-dl-row">
            <dt className="report-dt">Checks summary</dt>
            <dd className="report-dd">
              <div>
                {caseRecordRef.current.checks?.map((check) => (
                  <div key={check.id} style={{ display: "flex", gap: 8 }}>
                    <span className="check-label">{check.label}</span>
                    <span className="check-status">{checkStatusLabel(check.status)}</span>
                    {check.observed !== null && check.observed !== undefined && (
                      <span>
                        {typeof check.observed === "string"
                          ? check.observed.length > 60
                            ? check.observed.substring(0, 60) + "..."
                            : check.observed
                          : "data"}
                      </span>
                    )}
                    {check.detail && <span>Detail: {check.detail}</span>}
                  </div>
                ))}
              </div>
            </dd>
          </div>
          <div>
            <dt className="report-dt">DNS records (selected)</dt>
            <dd className="report-dd">
              <pre>{dnsRecordsText}</pre>
            </dd>
          </div>
          {caseRecordRef.current.checks.some((c) => c.group === "mail") && (
            <div>
              <dt className="report-dt">Mail configuration</dt>
              <dd className="report-dd">
                <pre>
                  {caseRecordRef.current.checks
                    .filter((c) => c.group === "mail")
                    .flatMap((c) => c.fields?.map((f) => `${f.label}: ${f.value}`) || [])
                    .join("\n") || "No mail configuration data collected"}
                </pre>
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* 5. EVIDENCE AND PROVENANCE */}
      <section className="report-section">
        <h2 className="report-section-title">Evidence and provenance</h2>
        <p>
          Every material finding in this report is linked to one or more check IDs. The table below
          shows the complete evidence trail for this case.
        </p>
        <table>
          <thead>
            <tr>
              <th>Evidence ID</th>
              <th>Type</th>
              <th>Observation</th>
              <th>Source</th>
              <th>Retrieved</th>
              <th>Status</th>
              <th>Limitation</th>
            </tr>
          </thead>
          <tbody>
            {caseRecordRef.current.checks?.map((check) => (
              <tr key={check.id}>
                <td>{check.id}</td>
                <td>{check.group}</td>
                <td>{check.observed ?? check.detail ?? ""}</td>
                <td>{check.source?.url ?? "—"}</td>
                <td>{formatUtc(check.retrievedAt)}</td>
                <td>{checkStatusLabel(check.status)}</td>
                <td>{check.limitation ?? ""}</td>
              </tr>
            ))}
            {caseRecordRef.current.findings.map((finding) => (
              <tr key={finding.id}>
                <td>{finding.id}</td>
                <td>Finding</td>
                <td>{finding.statement}</td>
                <td>—</td>
                <td>—</td>
                <td>{classLabel(finding.classification)}</td>
                <td>{finding.limitation ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small-text">
          <strong>How to read this table:</strong> Check rows carry the raw observation, source URL,
          and retrieval timestamp. Finding rows carry the analyst's interpretive statement, with
          classification and limitation. Every finding's
          <code>checkIds</code> field cross-references one or more check IDs in the table above.
        </p>
      </section>

      {/* 6. VISUAL ANALYSIS */}
      {caseRecordRef.current.relationships.length > 0 ? (
        <section className="report-section">
          <h2 className="report-section-title">Visual analysis</h2>
          <p>
            The following relationships were established during this investigation, each supported
            by evidence checks.
          </p>
          <ol>
            {caseRecordRef.current.relationships.map((rel) => (
              <li key={rel.id}>
                <p>
                  <strong>{rel.type}</strong> ({relLabel(rel.classification)})
                </p>
                <p>Supporting evidence: {rel.evidenceIds.join(", ")}</p>
                <p>{rel.explanation}</p>
                {rel.limitation && <p>Limitation: {rel.limitation}</p>}
              </li>
            ))}
          </ol>
          <p>
            These relationships are also visualised in the application's
            <a href="/username" style={{ color: "var(--accent)" }}>
              relationship map
            </a>
            (accessible via the Username intelligence module).
          </p>
        </section>
      ) : (
        <section className="report-section">
          <h2 className="report-section-title">Visual analysis</h2>
          <p>
            No relationships established. Relationships appear when the investigation collects
            evidence linking two or more entities.
          </p>
        </section>
      )}

      {/* 7. ANALYST ASSESSMENT */}
      <section className="report-section">
        <h2 className="report-section-title">Analyst assessment</h2>
        <p>
          <strong>What the evidence supports:</strong> The collected observations are technically
          verifiable through the documented public sources. Each finding is qualified by its
          classification (observed / source-reported / inferred / not checked) and its supporting
          check IDs. No identity is asserted beyond what the evidence directly supports.
        </p>
        <p>
          <strong>What remains uncertain:</strong> Where check status is "not_checked" or "no
          record", the source was unavailable or inconclusive for the given query. A missing result
          does not prove that an account, mailbox, or DNS record does not exist; it indicates that
          the source could not confirm its presence under the given conditions.
        </p>
        <p>
          <strong>Alternative explanations:</strong> Identical usernames across platforms may be
          coincidental. Domain ownership and DNS configuration can be shared or delegated. Gravatar
          avatar matches require an explicit email-domain association and do not independently
          establish identity.
        </p>
        <p>
          <strong>Recommended next steps:</strong> If further investigation is needed, consider:
          querying additional supported sources (with appropriate API keys), correlating
          observations with external threat-intelligence data, or conducting subject-focused
          research beyond the scope of automated public lookups. Always treat profile matches as
          leads, not confirmed identities, unless supported by independent evidence.
        </p>
      </section>

      {/* 8. APPENDIX */}
      <section className="report-section">
        <h2 className="report-section-title">Appendix</h2>
        <div>
          <h3>Detailed evidence records</h3>
          <p>
            The following records capture the raw output from each source queried during this
            investigation. These are reproduced faithfully; no interpretation or synthesis has been
            applied.
          </p>
          <div>
            {caseRecordRef.current.checks?.map((check) => (
              <div
                key={check.id}
                style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #ddd" }}
              >
                <h4>
                  {check.label} ({check.group})
                </h4>
                <pre>
                  {`\n  ID: ${check.id}\n  Label: ${check.label}\n  Group: ${check.group}\n  Status: ${checkStatusLabel(check.status)}\n  Observed: ${check.observed ?? "null"}\n  Detail: ${check.detail ?? "null"}\n  Limitation: ${check.limitation ?? "null"}\n  Source: ${check.source?.url ?? "null"}\n  Retrieved at: ${formatUtc(check.retrievedAt)}\n  Rcode: ${check.rcode ?? "null"}\n  Duration (ms): ${check.durationMs ?? "null"}\n  Error: ${check.error ?? "null"}\n`}
                </pre>
              </div>
            ))}
          </div>
          <h3>Finding register</h3>
          <p>
            Each finding is recorded with its classification, statement, supporting check IDs, and
            limitation. This register is the authoritative source for the "Key findings" section
            above.
          </p>
          <div>
            {caseRecordRef.current.findings.map((finding) => (
              <div
                key={finding.id}
                style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #ddd" }}
              >
                <h4>
                  {classLabel(finding.classification)}: {finding.statement}
                </h4>
                <pre>
                  {`\n  ID: ${finding.id}\n  Classification: ${finding.classification}\n  Statement: ${finding.statement}\n  Supporting checks: ${finding.checkIds.join(", ")}\n  Limitation: ${finding.limitation ?? "none"}\n`}
                </pre>
              </div>
            ))}
          </div>
          <h3>Case metadata</h3>
          <pre>
            {`\n  Case ID: ${caseRecordRef.current.id}\n  Entity type: ${caseRecordRef.current.entityType}\n  Target: ${caseRecordRef.current.target}\n  Normalised: ${caseRecordRef.current.normalized}\n  Created at: ${caseRecordRef.current.createdAt}\n  Completed at: ${caseRecordRef.current.completedAt}\n  Status: ${caseRecordRef.current.status}\n  Schema version: ${caseRecordRef.current.schemaVersion}\n  Tool version: ${caseRecordRef.current.toolVersion}\n  Notes: ${caseRecordRef.current.notes || "none"}\n  Notes updated at: ${caseRecordRef.current.notesUpdatedAt ?? "none"}\n  Relationships: ${caseRecordRef.current.relationships.length}\n  Findings: ${caseRecordRef.current.findings.length}\n  Checks: ${caseRecordRef.current.checks.length}\n`}
          </pre>
        </div>
      </section>
    </div>
  );
}