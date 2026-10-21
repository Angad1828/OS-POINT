import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { useInvestigation, type InvestigationEntity } from "@/hooks/use-investigation";
import { CaseReport } from "./case-report";
import { CheckStatusMark } from "./status-mark";

const COPY = {
  email: {
    eyebrow: "Email intelligence",
    title: "Email investigation",
    description:
      "Validate an address, then collect domain DNS, mail policy and registration observations that can be attributed and challenged. Syntax and MX records do not prove that a mailbox exists.",
    placeholder: "analyst@example.com",
    hint: "The original input is preserved. The domain is lower-cased for DNS queries; the local part is not treated as a username.",
  },
  domain: {
    eyebrow: "Domain intelligence",
    title: "Domain investigation",
    description:
      "Collect DNS records, mail policy and registry registration data for a domain, with a status for every check and the source that answered it.",
    placeholder: "example.com",
    hint: "Enter a bare domain name. URLs, IP addresses and paths are rejected rather than silently rewritten.",
  },
  username: {
    eyebrow: "Username intelligence",
    title: "Username investigation",
    description:
      "Check one documented source — the GitHub public API — for a public profile with this account name. Every result is recorded as a discovery lead with its source and retrieval time, never as proof of identity.",
    placeholder: "octocat",
    hint: "A leading @ is removed. Names follow GitHub's rules: letters, digits and single hyphens, up to 39 characters.",
  },
} as const;

export function InvestigationView({
  entity,
  initialTarget,
}: {
  entity: InvestigationEntity;
  initialTarget?: string;
}) {
  const copy = COPY[entity];
  const [usernameDiscovery, setUsernameDiscovery] = useState(false);
  const { input, setInput, formError, setFormError, state, run, reset, saveNotice, total } =
    useInvestigation(entity, initialTarget, { usernameDiscovery });
  const running = state.phase === "running";
  const progress = Math.min(100, Math.round((state.checks.length / state.total) * 100));

  return (
    <div>
      <header className="page-head">
        <div>
          <div className="eyebrow">{copy.eyebrow}</div>
          <h1 className="page-title">{copy.title}</h1>
          <p className="page-sub">{copy.description}</p>
        </div>
        <nav className="switch no-print" aria-label="Investigation type">
          <Link
            to="/email"
            className="switch-link"
            aria-current={entity === "email" ? "page" : undefined}
          >
            Email
          </Link>
          <Link
            to="/domain"
            className="switch-link"
            aria-current={entity === "domain" ? "page" : undefined}
          >
            Domain
          </Link>
          <Link
            to="/username"
            className="switch-link"
            aria-current={entity === "username" ? "page" : undefined}
          >
            Username
          </Link>
        </nav>
      </header>

      <section className="entry" aria-labelledby="entry-title">
        <h2 className="panel-title" id="entry-title" style={{ marginBottom: 12 }}>
          Target
        </h2>
        <form
          className="entry-form"
          autoComplete="off"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void run();
          }}
        >
          <div className="field">
            <label className="field-label" htmlFor={`target-${entity}`}>
              {entity === "email"
                ? "Email address"
                : entity === "domain"
                  ? "Domain name"
                  : "Account name"}
            </label>
            <input
              id={`target-${entity}`}
              className="input"
              type="text"
              inputMode={entity === "email" ? "email" : "text"}
              spellCheck={false}
              autoCapitalize="none"
              placeholder={copy.placeholder}
              value={input}
              aria-invalid={formError ? true : undefined}
              aria-describedby={`target-hint-${entity}${formError ? ` target-error-${entity}` : ""}`}
              onChange={(event) => {
                setInput(event.target.value);
                if (formError) setFormError(null);
              }}
              disabled={running}
            />
            <p className="field-hint" id={`target-hint-${entity}`}>
              {copy.hint}
            </p>
            {formError ? (
              <p className="field-error" id={`target-error-${entity}`} role="alert">
                {formError}
              </p>
            ) : null}
          </div>
          {entity === "email" ? (
            <div className="field field--option">
              <label className="option-label" htmlFor="username-discovery">
                <input
                  id="username-discovery"
                  type="checkbox"
                  checked={usernameDiscovery}
                  onChange={(event) => setUsernameDiscovery(event.target.checked)}
                  disabled={running}
                />
                <span>
                  Optional username-based discovery — search GitHub for a profile matching the local
                  part
                </span>
              </label>
              <p className="field-hint">
                Association not verified. A matching GitHub login is a lead recorded separately from
                the email evidence, not evidence about the mailbox or its owner.
              </p>
            </div>
          ) : null}
          <div className="entry-actions">
            <button type="submit" className="btn btn-primary" disabled={running}>
              {running ? "Running checks…" : "Run checks"}
            </button>
          </div>
        </form>

        <p className="entry-note">
          <span>{entity === "username" ? "GitHub public API" : "Google Public DNS"}</span>
          <span aria-hidden="true">·</span>
          {entity === "username" ? (
            <span>60 requests/hour unauthenticated</span>
          ) : (
            <>
              <span>RDAP via rdap.org</span>
              <span aria-hidden="true">·</span>
              {entity === "email" ? (
                <>
                  <span>Gravatar (avatar only)</span>
                  <span aria-hidden="true">·</span>
                </>
              ) : null}
              {usernameDiscovery ? (
                <>
                  <span>GitHub (optional local-part search)</span>
                  <span aria-hidden="true">·</span>
                </>
              ) : null}
            </>
          )}
          <span>No breach, social or AI sources</span>
        </p>
      </section>

      {state.phase === "idle" ? (
        <section className="panel" aria-labelledby="scope-title" style={{ marginTop: 18 }}>
          <div className="panel-head">
            <h2 className="panel-title" id="scope-title">
              What this run collects
            </h2>
            <span className="panel-meta">{total} checks</span>
          </div>
          <div className="panel-body">
            <ul className="prose" style={{ paddingLeft: 18, display: "grid", gap: 6 }}>
              {entity === "username" ? (
                <>
                  <li>
                    Account-name validation against GitHub's documented rules, with the original
                    input preserved.
                  </li>
                  <li>
                    One unauthenticated request to GitHub's documented{" "}
                    <span className="mono">/users/{"{name}"}</span> endpoint, with rate-limit status
                    read from the response headers.
                  </li>
                  <li>
                    The profile URL, account type and source-reported creation date when a profile
                    is returned — classified as a discovery lead throughout.
                  </li>
                </>
              ) : (
                <>
                  <li>
                    Six DNS queries: A, AAAA, MX, NS, TXT and CAA, each with its own result status.
                  </li>
                  <li>
                    SPF and DMARC records parsed from TXT answers, including the published policy
                    terms.
                  </li>
                  <li>
                    Registration context from RDAP, reported separately from what this run observed.
                  </li>
                  {entity === "email" ? (
                    <li>
                      Gravatar avatar existence, keyed by the MD5 hash of the normalised address.
                    </li>
                  ) : null}
                  {entity === "email" && usernameDiscovery ? (
                    <li>
                      <em>Optional:</em> one GitHub search for the local part, recorded separately
                      and labelled association not verified.
                    </li>
                  ) : null}
                  <li>
                    DKIM is listed as <em>not checked</em> because a selector is required and none
                    is supplied.
                  </li>
                </>
              )}
            </ul>
          </div>
        </section>
      ) : null}

      {state.phase === "running" ? (
        <section className="panel" style={{ marginTop: 18 }} aria-live="polite">
          <div className="panel-head">
            <h2 className="panel-title">Collecting evidence</h2>
            <span className="progress-label">
              {state.checks.length} of {state.total} checks complete
            </span>
          </div>
          <div
            className="progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={state.total}
            aria-valuenow={state.checks.length}
            aria-label="Checks completed"
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="panel-body">
            <p className="field-hint" style={{ marginBottom: 10 }}>
              Results are recorded as each check answers. Failures are kept, not discarded.
            </p>
            <ul className="running-list">
              {state.checks.slice(-8).map((check) => (
                <li key={check.id}>
                  <CheckStatusMark status={check.status} />
                  <span>{check.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {state.phase === "error" ? (
        <div className="panel" style={{ marginTop: 18 }}>
          <div className="panel-body">
            <div className="notice notice--danger" role="alert">
              {state.error}
            </div>
            <p className="field-hint" style={{ marginTop: 10 }}>
              {state.checks.length} of {state.total} checks had already been recorded. No case was
              saved.
            </p>
            <div className="row" style={{ marginTop: 12 }}>
              <button type="button" className="btn" onClick={() => reset()}>
                Clear
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {state.phase === "done" && state.record ? (
        <>
          {saveNotice ? (
            <div className="notice notice--danger" style={{ marginTop: 18 }} role="status">
              {saveNotice}
            </div>
          ) : null}
          <div style={{ marginTop: 24 }}>
            <CaseReport record={state.record} onRerun={() => reset()} />
          </div>
        </>
      ) : null}
    </div>
  );
}
