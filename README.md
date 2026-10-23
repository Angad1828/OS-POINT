# OS-POINT

An evidence-first digital investigation workspace for authorized open-source research.

OS-POINT collects public, attributable observations about an email address or domain, records the
status and provenance of every check, keeps failures visible, and stores each run as a reproducible
case.

## Current state (Stages 2–5 of the roadmap)

Primary navigation contains exactly four destinations:

| Destination | State | What it does |
| --- | --- | --- |
| **Workspace** (`/`) | Working | Starts a run for any of the three entity types, lists stored cases with genuine counts, filters, and documents method limits |
| **Email intelligence** (`/email`) | Working | Validation, domain DNS, SPF/DMARC parsing, mail-provider inference, RDAP context, Gravatar avatar, rule-based summary, and an optional (off by default) GitHub local-part discovery step that is recorded separately and labelled *association not verified* |
| **Domain intelligence** (`/domain`) | Working | Six DNS record types, SPF/DMARC, provider inference, RDAP registration data |
| **Username intelligence** (`/username`) | Working | One unauthenticated request to GitHub's documented `/users/{name}` endpoint, classified strictly as a discovery lead |

Deferred and removed from the interface: phone, IP, hash, URL and image modules, the synthetic threat
feed, the signal map, the invented KPI/uptime metrics, pricing, notifications, global search, and the
fabricated breach and profile panels. No breach, exposure, image or AI service is queried.

### What a run records

- **Checks (13 for email, 14 when the optional discovery step is enabled, 12 for domain, 2 for
  username)** with an id, label, status, observation, source URL, retrieval time and duration. Status
  is `completed`, `no record`, `failed` or `not checked`.
- **Findings** classified as observed, source-reported, inferred, failed or not checked, each linked
  to the checks that support it, with an explicit limitation.
- **Relationships** — evidence-linked entity connections (for example *address → domain*,
  *domain → mail provider*, *username → GitHub profile*). Each carries a type, a classification
  (directly observed, source-reported, inferred, unverified), the supporting check IDs, an
  explanation and a limitation, rendered as an interactive map plus a plain list. Cases with no
  supported relationship show an honest empty state instead of a decorative graph.
- **Assessment** that reports identity confidence and security risk as *not assessed* /
  *insufficient evidence* rather than inventing a score.
- **Collection timeline** in UTC, separated from source-reported registry dates.
- **Analyst notes**, stored with the case.

### Sources

- Google Public DNS over HTTPS (`dns.google/resolve`) for A, AAAA, MX, NS, TXT, CAA and `_dmarc`.
- RDAP via `rdap.org`, which redirects to the responsible registry.
- Gravatar (`gravatar.com/avatar/<md5>?d=404`) for avatar existence only.
- GitHub public API (`api.github.com/users/{name}`) for username discovery — 60 unauthenticated
  requests per hour per IP; a rate-limited response is reported as a failed check with its reset
  time, never as “no profile found”. Returned URLs are validated against the expected
  `https://github.com/<login>` pattern before they are ever rendered as links.

All requests run from the analyst's browser. There is no server proxy and no API key. Those services
see the browser's IP address; Gravatar also receives the MD5 hash of the normalised address.

## Evidence rules

1. A failed lookup is recorded as a failure, never as "nothing found".
2. An absent DNS record is an observation about published configuration, not a security verdict.
3. An avatar or a username-shaped local part is not identity evidence.
4. Identity confidence and security risk are separate concepts and remain unassessed without
   supporting evidence.
5. Source-reported facts (for example registry dates) are labelled apart from direct observations.
6. Timestamps are collection times in UTC; no event time is invented.
7. A relationship is only recorded when a check in the same case supports it. Two values appearing
   in one result set is not enough, and a username match on one platform is a lead, not ownership.

## Storage

Cases live in this browser's `localStorage` under `osp.cases.v2`, capped at 100 records, unencrypted
and not shared between devices. Records are schema-versioned (`schemaVersion: 3`); version-2 cases
saved by earlier builds are migrated on read instead of being dropped. Deleting a case removes it
from the browser only. JSON and CSV exports are generated from the stored model (including
relationship rows); the PDF path is the browser's own print-to-PDF with a dedicated print
stylesheet.

## Development

```sh
npm install
npm run dev        # Vite + TanStack Start
npm run typecheck  # tsc --noEmit
npm run lint
npm run build
```

The app is a TanStack Start (React 19) application. The Vite build produces a Nitro/Cloudflare Worker
bundle in `.output/`.

### Structure

```text
src/routes/            file-based routes: workspace, email, domain, username, case detail
src/components/        shell, workspace, investigation view, case report, relationship map, status marks
src/hooks/             case store subscription, investigation runner, hydration/media queries
src/lib/osint/         types, validation, DNS, RDAP, Gravatar, GitHub, check builders, pipelines
src/lib/case-store.ts  versioned browser case store with v2 → v3 migration on read
src/lib/export.ts      JSON and escaped CSV exports (findings and relationships included)
src/lib/theme.ts       theme application and pre-hydration script
src/styles.css         design tokens and the workstation layout (dark / light / print)
```



