/**
 * Shared evidence model for OS-POINT.
 *
 * A check is one reproducible question asked of one source. Checks never carry
 * a synthetic score: they carry a status, what was observed, where it came
 * from, and when it was retrieved.
 */

export const CASE_SCHEMA_VERSION = 3;
export const TOOL_VERSION = "0.3.0";

export type EntityType = "email" | "domain" | "username";

/**
 * completed   — the source answered and returned data
 * no_record   — the source answered and had nothing to return for this query
 * failed      — the query could not be completed
 * not_checked — the check is not possible with the information available
 */
export type CheckStatus = "completed" | "no_record" | "failed" | "not_checked";

export type CheckGroup = "input" | "dns" | "mail" | "registry" | "avatar" | "identity";

export type CaseStatus = "complete" | "partial" | "failed";

export type FindingClassification =
  "observed" | "source_reported" | "inferred" | "failed" | "not_checked";

export interface DnsRecordValue {
  /** Record type as returned by the resolver (A, CNAME, MX, TXT, ...). */
  type: string;
  /** Record data exactly as returned, minus the trailing root dot. */
  data: string;
  ttl: number;
}

export interface CheckSource {
  name: string;
  url: string;
}

export interface CheckField {
  label: string;
  value: string;
}

export interface CheckResult {
  /** Stable identifier, e.g. "dns.mx" or "mail.dmarc". */
  id: string;
  label: string;
  group: CheckGroup;
  status: CheckStatus;
  /** Short human-readable observation. Null when nothing was observed. */
  observed: string | null;
  /** Structured DNS answers, when the check was a DNS query. */
  records?: DnsRecordValue[];
  /** DNS response code for DNS checks (0 = NOERROR, 3 = NXDOMAIN). */
  rcode?: number | null;
  /** Structured values extracted from the observation (registrar, policy, ...). */
  fields?: CheckField[];
  /** Interpretation of the observation, kept separate from the observation. */
  detail?: string;
  /** What this check cannot establish. */
  limitation?: string;
  source: CheckSource | null;
  /** ISO-8601 collection timestamp (UTC). */
  retrievedAt: string;
  durationMs?: number;
  /** Transport/HTTP error text. Never a substitute for an observation. */
  error?: string;
}

export interface Finding {
  id: string;
  classification: FindingClassification;
  statement: string;
  /** Checks that support (or fail to support) this finding. */
  checkIds: string[];
  limitation?: string;
}

/** Node kinds that can appear as the endpoint of a relationship. */
export type NodeKind = EntityType | "profile" | "organization";

export const NODE_KIND_LABEL: Record<NodeKind, string> = {
  email: "Email address",
  domain: "Domain",
  username: "Username",
  profile: "Public profile",
  organization: "Organization",
};

/**
 * How a relationship was established. "unverified" is reserved for
 * associations that rest on a shared string (for example a username-shaped
 * email local part) rather than on source evidence.
 */
export type RelationshipClassification =
  "observed" | "source_reported" | "inferred" | "unverified" | "contradicted";

export const RELATIONSHIP_LABEL: Record<RelationshipClassification, string> = {
  observed: "Directly observed",
  source_reported: "Source-reported",
  inferred: "Inferred",
  unverified: "Unverified",
  contradicted: "Contradicted",
};

export interface RelationshipNode {
  kind: NodeKind;
  /** Display value: the address, domain, login, profile URL or organisation. */
  label: string;
  /** Only set when the URL was returned and validated from a trusted pattern. */
  url?: string;
}

/**
 * An evidence-supported link between two entities. A relationship is only
 * recorded when a check in the same case supports it; co-occurrence in a
 * result set is never enough.
 */
export interface Relationship {
  id: string;
  from: RelationshipNode;
  to: RelationshipNode;
  /** Relationship type, e.g. "Address is at this domain". */
  type: string;
  classification: RelationshipClassification;
  /** Check IDs in this case that support the link. */
  evidenceIds: string[];
  /** How the link was derived, in plain language. */
  explanation: string;
  limitation?: string;
}

export interface CaseRecord {
  schemaVersion: typeof CASE_SCHEMA_VERSION;
  id: string;
  entityType: EntityType;
  /** Original analyst input, preserved verbatim. */
  target: string;
  /** Normalised form used for collection. */
  normalized: string;
  createdAt: string;
  completedAt: string;
  status: CaseStatus;
  checks: CheckResult[];
  findings: Finding[];
  /** Evidence-supported entity links. Never decorative; may be empty. */
  relationships: Relationship[];
  /** Rule-based summary. Never labelled as AI output. */
  summary: string;
  notes: string;
  notesUpdatedAt: string | null;
  toolVersion: string;
}

export const CHECK_STATUS_LABEL: Record<CheckStatus, string> = {
  completed: "Collected",
  no_record: "No record",
  failed: "Failed",
  not_checked: "Not checked",
};

/** v2 records predate relationships; the store migrates them on read. */
export const LEGACY_CASE_SCHEMA_VERSION = 2;

export const CLASSIFICATION_LABEL: Record<FindingClassification, string> = {
  observed: "Observed",
  source_reported: "Source-reported",
  inferred: "Inferred",
  failed: "Lookup failed",
  not_checked: "Not checked",
};

export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  complete: "Complete",
  partial: "Partial",
  failed: "Failed",
};

export function deriveCaseStatus(checks: CheckResult[]): CaseStatus {
  const attempted = checks.filter((check) => check.status !== "not_checked");
  if (attempted.length === 0 || attempted.every((check) => check.status === "failed")) {
    return "failed";
  }
  if (checks.some((check) => check.status === "failed")) return "partial";
  return "complete";
}

export function countByStatus(checks: CheckResult[], status: CheckStatus): number {
  return checks.filter((check) => check.status === status).length;
}
