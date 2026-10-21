import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { InvestigationView } from "@/components/investigation-view";

export const Route = createFileRoute("/username")({
  validateSearch: (search: Record<string, unknown>): { target?: string } => ({
    target: typeof search.target === "string" ? search.target : undefined,
  }),
  head: () => ({
    meta: [{ title: "Username intelligence — OS-POINT" }],
  }),
  component: UsernamePage,
});

function UsernamePage() {
  const { target } = Route.useSearch();
  return (
    <AppShell>
      <InvestigationView entity="username" initialTarget={target} />

      <details className="panel details" style={{ marginTop: 18 }}>
        <summary className="panel-summary">
          How this module works, and what it will not claim
        </summary>
        <div className="table-wrap">
          <table className="data-table">
            <caption className="visually-hidden">
              Username module sources, limits and classification rules
            </caption>
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Detail</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td data-label="Item">Provider</td>
                <td data-label="Detail">
                  GitHub public API — the only documented source connected
                </td>
              </tr>
              <tr>
                <td data-label="Item">Access method</td>
                <td data-label="Detail">
                  Unauthenticated GET requests to the documented endpoint. No scraping, no login
                  attempts, no anti-bot circumvention, no guessed profile URLs.
                </td>
              </tr>
              <tr>
                <td data-label="Item">Rate limit</td>
                <td data-label="Detail">
                  <span className="mono">60 requests/hour per IP</span> for unauthenticated GitHub
                  API requests. When it is exhausted the check reports that fact and its reset time
                  instead of a negative result.
                </td>
              </tr>
              <tr>
                <td data-label="Item">Classification rule</td>
                <td data-label="Detail">
                  A matching account name is recorded as a discovery lead with platform, profile
                  URL, source, retrieval time and verification status. It is never presented as
                  proof of identity or common ownership.
                </td>
              </tr>
              <tr>
                <td data-label="Item">Coverage</td>
                <td data-label="Detail">
                  One platform. Results are not an enumeration of social media, and absence on
                  GitHub says nothing about other sites.
                </td>
              </tr>
              <tr>
                <td data-label="Item">Explicitly excluded</td>
                <td data-label="Detail">
                  Guessed profile URLs, broad social enumeration, email-local-part merging, login or
                  password-reset probing, and avatar-to-person attribution.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </AppShell>
  );
}
