import { Download, Printer, Trash2 } from "lucide-react";
import { useState } from "react";

import { deleteCase, isStorageAvailable, updateCaseNotes } from "@/lib/case-store";
import { exportCaseCsv, exportCaseJson } from "@/lib/export";
import { formatDuration, formatUtc } from "@/lib/format";
import type { CaseRecord, CheckGroup, CheckResult } from "@/lib/osint/types";
import { CaseStatusMark, CheckOutcome } from "./status-mark";
import { RelationshipMap } from "./relationship-map";

const ENTITY_LABEL: Record<CaseRecord["entityType"], string> = {
  email: "Email intelligence",
  domain: "Domain intelligence",
  username: "Username intelligence",
};

const GROUP_LABEL: Record<CheckGroup, string> = {
  input: "Input",
  dns: "DNS",
  mail: "Mail policy",
  registry: "Registry",
  avatar: "Avatar",
  identity: "Identity",
};

function CheckFields({ check }: { check: CheckResult }) {
  if (check.id === "avatar.gravatar" && check.status === "completed" && check.source) {
    return (
      <div className="avatar">
        <img
          src={check.source.url}
          alt=""
          width={88}
          height={88}
          loading="lazy"
          referrerPolicy="no-referrer"
          decoding="async"
        />
        <p className="avatar-note">
          Public avatar returned by Gravatar for the MD5 hash of this address. Presence of an avatar
          does not identify the mailbox owner.
        </p>
      </div>
    );
  }

  if (check.records && check.records.length > 0) {
    return (
      <ul className="records">
        {check.records.map((record, index) => (
          <li key={`${check.id}-${index}`}>
            <span className="record-type">{record.type}</span>
            {record.data}
            <span className="dim"> · TTL {record.ttl}s</span>
          </li>
        ))}
      </ul>
    );
  }

  const fields = (check.fields ?? []).filter((field) => field.value !== check.observed);
  if (fields.length > 0) {
    return (
      <dl className="field-list">
        {fields.map((field) => (
          <div key={`${check.id}-${field.label}`} className="field-row">
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return null;
}

function CheckRow({ check }: { check: CheckResult }) {
  return (
    <tr id={`check-${check.id}`}>
      <td data-label="Check">
        <div className="check-observation">{check.label}</div>
        <span className="check-id">
          {GROUP_LABEL[check.group]} · {check.id}
        </span>
      </td>
      <td data-label="Status">
        <CheckOutcome check={check} />
      </td>
      <td data-label="Observation">
        {check.records && check.records.length > 0 ? null : check.observed &&
          check.observed !== check.detail ? (
          <div className="check-observation">{check.observed}</div>
        ) : null}
        <CheckFields check={check} />
        {check.detail ? <div className="check-detail">{check.detail}</div> : null}
        {check.error && check.status === "failed" ? (
          <div className="check-detail">Error: {check.error}</div>
        ) : null}
      </td>
      <td data-label="Source and retrieval">
        {check.source ? (
          <span className="check-source">
            <a href={check.source.url} target="_blank" rel="noreferrer noopener">
              {check.source.name}
            </a>
          </span>
        ) : (
          <span className="dim">—</span>
        )}
        <div className="check-id">{formatUtc(check.retrievedAt)}</div>
        <div className="check-id">
          {check.durationMs !== undefined ? formatDuration(check.durationMs) : "—"}
        </div>
      </td>
    </tr>
  );
}

export function CaseReport({
  record,
  onDelete,
  onRerun,
}: {
  record: CaseRecord;
  onDelete?: () => void;
  onRerun?: () => void;
}) {
  const [notes, setNotes] = useState(record.notes);
  const [notesState, setNotesState] = useState<"idle" | "saved" | "error">("idle");
  const [notesError, setNotesError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [storageAvailable] = useState(() => isStorageAvailable());

  const sources = Array.from(
    new Map(
      record.checks
        .filter((check) => check.source)
        .map((check) => [check.source!.url, check.source!] as const),
    ).values(),
  );

  const failedChecks = record.checks.filter((check) => check.status === "failed");
  const notChecked = record.checks.filter((check) => check.status === "not_checked");
  const collected = record.checks.filter((check) => check.status === "completed").length;
  const noRecord = record.checks.filter((check) => check.status === "no_record").length;
  const relationships = record.relationships ?? [];
  const hasIdentityLookup = record.checks.some((check) => check.group === "identity");

  const timeline = [...record.checks].sort((a, b) => a.retrievedAt.localeCompare(b.retrievedAt));
  const registryDates = record.checks
    .filter((check) => check.id === "registry.rdap")
    .flatMap((check) =>
      (check.fields ?? []).filter((field) =>
        ["Registered", "Expires", "Last changed"].includes(field.label),
      ),
    );

  const saveNotes = () => {
    const result = updateCaseNotes(record.id, notes);
    if (result.ok) {
      setNotesState("saved");
      setNotesError("");
    } else {
      setNotesState("error");
      setNotesError(result.error ?? "Notes could not be saved.");
    }
  };

  const removeCase = () => {
    const result = deleteCase(record.id);
    if (!result.ok) {
      setDeleteError(result.error ?? "The case could not be removed.");
      return;
    }
    onDelete?.();
  };

  return (
    <article aria-labelledby="case-target">
      <header className="case-head">
        <div>
          <div className="eyebrow">{ENTITY_LABEL[record.entityType]}</div>
          <h1 className="case-target" id="case-target">
            {record.normalized}
          </h1>
          <div className="meta-line">
            <span>
              Case <b>{record.id}</b>
            </span>
            <span>
              Collected <b>{formatUtc(record.completedAt)}</b>
            </span>
            <span>
              <CaseStatusMark status={record.status} />
            </span>
            <span>
              <b>{record.checks.length}</b> checks · <b>{collected}</b> collected ·{" "}
              <b>{noRecord}</b> no record · <b>{failedChecks.length}</b> failed
            </span>
            <span>
              <b>{sources.length}</b> endpoint{sources.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="page-actions no-print">
          <button type="button" className="btn" onClick={() => exportCaseJson(record)}>
            <Download size={15} aria-hidden="true" /> JSON
          </button>
          <button type="button" className="btn" onClick={() => exportCaseCsv(record)}>
            <Download size={15} aria-hidden="true" /> CSV
          </button>
          <button type="button" className="btn" onClick={() => window.print()}>
            <Printer size={15} aria-hidden="true" /> Print / PDF
          </button>
          {onRerun ? (
            <button type="button" className="btn btn-quiet" onClick={onRerun}>
              Run again
            </button>
          ) : null}
        </div>
      </header>

      {!storageAvailable ? (
        <div className="notice notice--danger" role="status">
          Browser storage is unavailable. This case exists only in the current session; export it
          before closing the tab.
        </div>
      ) : null}

      <div className="assessment">
        <div>
          <div className="assessment-label">Identity confidence</div>
          <div className="assessment-value">Not assessed</div>
          <p className="assessment-note">
            {record.entityType === "email"
              ? "No independent source in this run links the address to a person. An avatar or a username-shaped local part is not identity evidence."
              : record.entityType === "username"
                ? "A matching login on one platform is a discovery lead. Without a second, independent source, identity confidence stays unassessed."
                : "This run collects infrastructure and registration observations. It does not attempt to identify an owner or operator."}
          </p>
        </div>
        <div>
          <div className="assessment-label">Security risk</div>
          <div className="assessment-value">Insufficient evidence</div>
          <p className="assessment-note">
            Published DNS and registration data do not by themselves support a risk rating. No
            exposure, reputation or breach source is queried in this build.
          </p>
        </div>
      </div>

      <section className="panel" aria-labelledby="summary-title">
        <div className="panel-head">
          <h2 className="panel-title" id="summary-title">
            Summary
          </h2>
          <span className="panel-meta">Rule-based · AI analysis not configured</span>
        </div>
        <div className="panel-body">
          <p className="prose">{record.summary}</p>
          <p className="field-hint" style={{ marginTop: 10 }}>
            Original input: <span className="mono">{record.target}</span>
          </p>
        </div>
      </section>

      <section className="panel" aria-labelledby="findings-title">
        <div className="panel-head">
          <h2 className="panel-title" id="findings-title">
            Findings
          </h2>
          <span className="panel-meta">
            {record.findings.length} finding{record.findings.length === 1 ? "" : "s"} · linked to
            checks
          </span>
        </div>
        <div className="panel-body">
          {record.findings.length === 0 ? (
            <div className="empty">
              <span className="empty-title">No findings were derived</span>
              The checks did not produce a material observation.
            </div>
          ) : (
            record.findings.map((finding) => (
              <div className="finding" key={finding.id}>
                <div className={`finding-class finding-class--${finding.classification}`}>
                  {finding.classification === "source_reported"
                    ? "Source-reported"
                    : finding.classification === "not_checked"
                      ? "Not checked"
                      : finding.classification === "failed"
                        ? "Lookup failed"
                        : finding.classification.charAt(0).toUpperCase() +
                          finding.classification.slice(1)}
                </div>
                <div>
                  <p className="finding-statement">{finding.statement}</p>
                  {finding.limitation ? (
                    <p className="finding-limit">{finding.limitation}</p>
                  ) : null}
                  <p className="check-refs">Supported by: {finding.checkIds.join(" · ")}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="panel" aria-labelledby="relationships-title">
        <div className="panel-head">
          <h2 className="panel-title" id="relationships-title">
            Relationships
          </h2>
          <span className="panel-meta">
            {relationships.length === 0
              ? "None derived"
              : `${relationships.length} evidence-linked · select to inspect`}
          </span>
        </div>
        <div className="panel-body">
          {relationships.length === 0 ? (
            <div className="empty">
              <span className="empty-title">No evidence-supported relationships in this case</span>A
              connection is only drawn when a check in this case supports it. Two values appearing
              in the same result set is not enough.
            </div>
          ) : (
            <RelationshipMap record={record} relationships={relationships} />
          )}
        </div>
      </section>

      <section className="panel" aria-labelledby="checks-title">
        <div className="panel-head">
          <h2 className="panel-title" id="checks-title">
            Checks
          </h2>
          <span className="panel-meta">Every check, including failures and skips</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <caption className="visually-hidden">
              Individual checks, their status, observation, source and retrieval time
            </caption>
            <thead>
              <tr>
                <th scope="col">Check</th>
                <th scope="col">Status</th>
                <th scope="col">Observation</th>
                <th scope="col">Source and retrieval</th>
              </tr>
            </thead>
            <tbody>
              {record.checks.map((check) => (
                <CheckRow key={check.id} check={check} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" aria-labelledby="sources-title">
        <div className="panel-head">
          <h2 className="panel-title" id="sources-title">
            Sources queried
          </h2>
          <span className="panel-meta">Unique endpoints queried</span>
        </div>
        <div className="panel-body">
          {sources.length === 0 ? (
            <p className="muted small">No external source was queried in this run.</p>
          ) : (
            <dl className="field-list">
              {sources.map((source) => (
                <div key={source.url} className="field-row">
                  <dt>{source.name}</dt>
                  <dd>
                    <a href={source.url} target="_blank" rel="noreferrer noopener">
                      {source.url}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <section className="panel" aria-labelledby="timeline-title">
        <div className="panel-head">
          <h2 className="panel-title" id="timeline-title">
            Collection timeline
          </h2>
          <span className="panel-meta">Collection time only · UTC</span>
        </div>
        <div className="panel-body">
          <ul className="running-list">
            <li>
              <span className="check-source">{formatUtc(record.createdAt)}</span>
              <span>Case opened for {record.normalized}</span>
            </li>
            {timeline.map((check) => (
              <li key={`timeline-${check.id}`}>
                <span className="check-source">{formatUtc(check.retrievedAt)}</span>
                <span>{check.label}</span>
                <CheckOutcome check={check} />
              </li>
            ))}
            <li>
              <span className="check-source">{formatUtc(record.completedAt)}</span>
              <span>Case recorded</span>
            </li>
          </ul>

          {registryDates.length > 0 ? (
            <>
              <hr className="rule" />
              <p className="field-hint">
                Dates reported by the registry are source-reported facts, not events in this
                investigation.
              </p>
              <dl className="field-list">
                {registryDates.map((field) => (
                  <div key={field.label} className="field-row">
                    <dt>{field.label}</dt>
                    <dd>{field.value}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : null}
        </div>
      </section>

      <section className="panel" aria-labelledby="limitations-title">
        <div className="panel-head">
          <h2 className="panel-title" id="limitations-title">
            Limitations
          </h2>
          <span className="panel-meta">Read before relying on this record</span>
        </div>
        <div className="panel-body">
          <ul className="prose" style={{ paddingLeft: 18, display: "grid", gap: 7 }}>
            <li>
              DNS answers and RDAP objects describe published configuration at retrieval time. They
              can change and do not establish ownership, intent or legitimacy.
            </li>
            <li>
              Checks ran from this browser directly against Google Public DNS, RDAP and Gravatar.
              Those services saw this browser's IP address. No proxy or server-side key is used in
              this build.
            </li>{" "}
            <li>
              No breach, exposure, image or AI analysis is performed in this build.
              {hasIdentityLookup
                ? " Username discovery is limited to the GitHub lookup recorded above, and one platform is not exhaustive."
                : " A username-shaped local part is not treated as a username."}
            </li>
            <li>
              A Gravatar lookup sends the MD5 hash of the normalised address to gravatar.com. A hash
              is not secret from the service that receives it.
            </li>
            <li>
              A failed check is a failure, not a negative finding. An absent record is a DNS
              observation, not a security verdict.
            </li>{" "}
            <li>
              Cases are stored in this browser only, unencrypted, and are not shared between
              devices.
            </li>
            <li>
              A case status of “Complete” means every attempted check finished without a transport
              failure. It does not mean the investigation is exhaustive or that the target is
              trustworthy.
            </li>
            {failedChecks.length > 0 ? (
              <li>
                {failedChecks.length} check{failedChecks.length === 1 ? "" : "s"} failed in this
                run: {failedChecks.map((check) => check.label).join(", ")}. Their subjects remain
                unknown.
              </li>
            ) : null}
            {notChecked.length > 0 ? (
              <li>
                {notChecked.length} check{notChecked.length === 1 ? "" : "s"} could not be
                attempted: {notChecked.map((check) => check.label).join(", ")}.
              </li>
            ) : null}
          </ul>
        </div>
      </section>

      <section className="panel no-print" aria-labelledby="notes-title">
        <div className="panel-head">
          <h2 className="panel-title" id="notes-title">
            Analyst notes
          </h2>
          <span className="panel-meta">
            {record.notesUpdatedAt
              ? `Saved ${formatUtc(record.notesUpdatedAt)}`
              : "Not recorded yet"}
          </span>
        </div>
        <div className="panel-body notes">
          <label className="field-label" htmlFor="case-notes">
            Notes for this case
          </label>
          <textarea
            id="case-notes"
            className="textarea"
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              setNotesState("idle");
            }}
            placeholder="Record what you verified, what you could not verify, and what should be checked next."
          />
          <div className="notes-actions">
            <button
              type="button"
              className="btn"
              onClick={saveNotes}
              disabled={notes === record.notes}
            >
              Save notes
            </button>
            <span className="notes-state" role="status">
              {notesState === "saved"
                ? "Saved to this browser."
                : notesState === "error"
                  ? notesError
                  : "Notes are stored with the case in this browser."}
            </span>
          </div>
        </div>
      </section>

      {onDelete ? (
        <div className="row no-print" style={{ marginTop: 18 }}>
          {confirmingDelete ? (
            <>
              <button type="button" className="btn btn-danger" onClick={removeCase}>
                <Trash2 size={15} aria-hidden="true" /> Confirm delete
              </button>
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </button>
              <span className="notes-state">
                This removes the case from this browser. Exports are unaffected.
              </span>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 size={15} aria-hidden="true" /> Delete case
            </button>
          )}
          {deleteError ? <span className="field-error">{deleteError}</span> : null}
        </div>
      ) : null}
    </article>
  );
}
