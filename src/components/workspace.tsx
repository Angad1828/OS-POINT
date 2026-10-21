import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { useCases } from "@/hooks/use-cases";
import { useHydrated } from "@/hooks/use-hydrated";
import { isStorageAvailable } from "@/lib/case-store";
import { formatUtc } from "@/lib/format";
import { normalizeDomain, normalizeEmail, normalizeUsername } from "@/lib/osint/validation";
import { CaseStatusMark } from "./status-mark";

const ENTITY_LABEL: Record<string, string> = {
  email: "Email",
  domain: "Domain",
  username: "Username",
};

export function Workspace() {
  const cases = useCases();
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const [entity, setEntity] = useState<"email" | "domain" | "username">("email");
  const [target, setTarget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [storageAvailable] = useState(() => isStorageAvailable());

  const checksCollected = cases.reduce(
    (total, record) => total + record.checks.filter((check) => check.status === "completed").length,
    0,
  );
  const failedChecks = cases.reduce(
    (total, record) => total + record.checks.filter((check) => check.status === "failed").length,
    0,
  );

  const query = filter.trim().toLowerCase();
  const visibleCases = query
    ? cases.filter((record) =>
        [record.target, record.id, record.entityType].some((value) =>
          value.toLowerCase().includes(query),
        ),
      )
    : cases;

  const start = () => {
    const value = target.trim();
    const validation =
      entity === "email"
        ? normalizeEmail(value)
        : entity === "domain"
          ? normalizeDomain(value)
          : normalizeUsername(value);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    setError(null);
    void navigate({
      to: entity === "email" ? "/email" : entity === "domain" ? "/domain" : "/username",
      search: { target: value },
    });
  };

  return (
    <div>
      <header className="page-head">
        <div>
          <div className="eyebrow">Investigation workspace</div>
          <h1 className="page-title">Cases</h1>
          <p className="page-sub">
            A case is the record of what was asked, what each source answered, and what remains
            unknown. Start with an email address or a domain; the target is validated before any
            request is sent.
          </p>
        </div>
        <div className="page-actions">
          <Link to="/username" className="btn">
            Username intelligence
          </Link>
        </div>
      </header>

      <section className="entry" aria-labelledby="start-title">
        <h2 className="panel-title" id="start-title">
          Start an investigation
        </h2>
        <div className="row" role="group" aria-label="Investigation type" style={{ marginTop: 12 }}>
          <span className="field-label">Type</span>
          <button
            type="button"
            className="btn"
            aria-pressed={entity === "email"}
            onClick={() => {
              setEntity("email");
              setError(null);
            }}
          >
            Email
          </button>
          <button
            type="button"
            className="btn"
            aria-pressed={entity === "domain"}
            onClick={() => {
              setEntity("domain");
              setError(null);
            }}
          >
            Domain
          </button>
          <button
            type="button"
            className="btn"
            aria-pressed={entity === "username"}
            onClick={() => {
              setEntity("username");
              setError(null);
            }}
          >
            Username
          </button>
          <span className="field-hint">
            {entity === "username"
              ? "One documented source: the GitHub public API."
              : "Validated before any request is sent."}
          </span>
        </div>

        <form
          className="entry-form"
          style={{ marginTop: 12 }}
          autoComplete="off"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            start();
          }}
        >
          <div className="field">
            <label className="field-label" htmlFor="workspace-target">
              {entity === "email"
                ? "Email address"
                : entity === "domain"
                  ? "Domain name"
                  : "Account name"}
            </label>
            <input
              id="workspace-target"
              className="input"
              type="text"
              spellCheck={false}
              autoCapitalize="none"
              placeholder={
                entity === "email"
                  ? "analyst@example.com"
                  : entity === "domain"
                    ? "example.com"
                    : "octocat"
              }
              value={target}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "workspace-error" : "workspace-hint"}
              onChange={(event) => {
                setTarget(event.target.value);
                if (error) setError(null);
              }}
            />
            <p className="field-hint" id="workspace-hint">
              You will see the scope of the run before any request is made.
            </p>
            {error ? (
              <p className="field-error" id="workspace-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
          <div className="entry-actions">
            <button type="submit" className="btn btn-primary">
              Continue
            </button>
          </div>
        </form>
      </section>

      {!storageAvailable ? (
        <div className="notice notice--danger" style={{ marginTop: 18 }} role="status">
          Browser storage is unavailable in this session. Cases will not persist after you close the
          tab.
        </div>
      ) : null}

      {!hydrated ? (
        <div className="notice" style={{ marginTop: 18 }} role="status">
          Reading the case store from this browser…
        </div>
      ) : null}

      <div className="metrics" aria-label="Workspace totals">
        <div className="metric">
          <div className="metric-label">Cases in this browser</div>
          <div className="metric-value">{cases.length}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Checks collected</div>
          <div className="metric-value">{checksCollected}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Failed checks retained</div>
          <div className="metric-value">{failedChecks}</div>
        </div>
      </div>

      <div className="section-head">
        <h2 className="section-title">Recent cases</h2>
        <span className="section-note">
          {visibleCases.length}
          {query ? ` of ${cases.length}` : ""} shown
        </span>
      </div>

      {!hydrated ? null : cases.length === 0 ? (
        <div className="empty">
          <span className="empty-title">No investigations recorded</span>
          Run an email, domain or username check and the case will appear here with its evidence,
          notes and timeline.
        </div>
      ) : (
        <div className="panel">
          <div className="panel-head">
            <label className="field-label" htmlFor="case-filter">
              Filter cases
            </label>
            <input
              id="case-filter"
              className="input"
              style={{
                maxWidth: 280,
                padding: "7px 10px",
                fontFamily: "var(--font-ui)",
                fontSize: 13,
              }}
              type="search"
              placeholder="Target, case ID or type"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </div>
          {visibleCases.length === 0 ? (
            <div className="empty" style={{ border: 0 }}>
              <span className="empty-title">No cases match “{filter}”</span>
              Clear the filter to see every case stored in this browser.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <caption className="visually-hidden">Cases stored in this browser</caption>
                <thead>
                  <tr>
                    <th scope="col">Target</th>
                    <th scope="col">Type</th>
                    <th scope="col">Status</th>
                    <th scope="col">Checks</th>
                    <th scope="col">Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCases.map((record) => {
                    const completed = record.checks.filter(
                      (check) => check.status === "completed",
                    ).length;
                    const failed = record.checks.filter(
                      (check) => check.status === "failed",
                    ).length;
                    return (
                      <tr key={record.id}>
                        <td data-label="Target">
                          <Link
                            to="/cases/$caseId"
                            params={{ caseId: record.id }}
                            className="cell-target"
                          >
                            {record.normalized}
                          </Link>
                          <div className="cell-meta">{record.id}</div>
                        </td>
                        <td data-label="Type">
                          {ENTITY_LABEL[record.entityType] ?? record.entityType}
                        </td>
                        <td data-label="Status">
                          <CaseStatusMark status={record.status} />
                        </td>
                        <td data-label="Checks">
                          <span className="num">
                            {completed}/{record.checks.length}
                          </span>
                          {failed > 0 ? <div className="cell-meta">{failed} failed</div> : null}
                        </td>
                        <td data-label="Collected">
                          <span className="check-source">{formatUtc(record.completedAt)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="section-head" id="method">
        <h2 className="section-title">Method and limitations</h2>
        <span className="section-note">Applies to every case</span>
      </div>
      <div className="panel">
        <div className="panel-body">
          <ul className="prose" style={{ paddingLeft: 18, display: "grid", gap: 7 }}>
            <li>
              Each retained module asks public sources one question at a time and stores the status,
              the observation, the source URL and the retrieval time separately.
            </li>
            <li>
              A failed lookup is recorded as a failure. It is never rendered as “no exposure found”,
              and a missing DNS record is never treated as a malicious signal.
            </li>
            <li>
              Identity confidence and security risk are reported as “not assessed” unless evidence
              supports them. This build has no scoring model, and it does not invent one.
            </li>
            <li>
              Cases live in this browser's local storage, unencrypted. There is no account, sharing
              or server-side retention. Export a case to keep it beyond this browser.
            </li>{" "}
            <li>
              Username intelligence queries one documented source (the GitHub public API). A
              matching account name is a discovery lead — no profile URLs are guessed and no
              identity is asserted.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
