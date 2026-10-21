import { formatRecords, lookupDns, type DnsLookupResult, unquoteTxt } from "./dns";
import { lookupGravatar } from "./gravatar";
import { lookupRdap } from "./rdap";
import type { CheckField, CheckResult, CheckStatus, EntityType, Relationship } from "./types";

/** Canonical display order, independent of query completion order. */
export const CHECK_ORDER = [
  "input.normalize",
  "dns.a",
  "dns.aaaa",
  "dns.mx",
  "dns.ns",
  "dns.txt",
  "dns.caa",
  "mail.spf",
  "mail.dmarc",
  "mail.dkim",
  "mail.provider",
  "registry.rdap",
  "avatar.gravatar",
  "identity.github",
];

export type EmitCheck = (check: CheckResult) => void;

export function sortChecks(checks: CheckResult[]): CheckResult[] {
  const rank = (id: string) => {
    const index = CHECK_ORDER.indexOf(id);
    return index === -1 ? CHECK_ORDER.length : index;
  };
  return [...checks].sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id));
}

export function createCaseId(now: Date = new Date()): string {
  const date = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(
    now.getUTCDate(),
  ).padStart(2, "0")}`;
  let suffix: string;
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(3));
    suffix = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  } else {
    suffix = Math.random().toString(16).slice(2, 8).toUpperCase().padEnd(6, "0");
  }
  return `CASE-${date}-${suffix}`;
}

export const DNS_TYPES = ["A", "AAAA", "MX", "NS", "TXT", "CAA"] as const;
export type DnsType = (typeof DNS_TYPES)[number];

const DNS_LIMITATIONS: Record<DnsType, string> = {
  A: "An address record describes where the name resolves, not who controls the infrastructure.",
  AAAA: "An address record describes where the name resolves, not who controls the infrastructure.",
  MX: "MX records describe mail routing for the whole domain; they do not establish that a specific mailbox exists or who owns it.",
  NS: "Name servers indicate delegated DNS hosting, not registrar or organisational ownership.",
  TXT: "TXT records are free-form; a string appearing here does not by itself identify its publisher.",
  CAA: "CAA records restrict which certificate authorities may issue certificates; they say nothing about the content of a site.",
};

export interface DnsCheckBundle {
  lookups: Map<string, DnsLookupResult>;
  checks: Map<string, CheckResult>;
}

function dnsCheck(type: DnsType, domain: string, result: DnsLookupResult): CheckResult {
  const observed =
    result.status === "completed"
      ? formatRecords(result.records)
      : result.status === "no_record"
        ? result.detail
        : null;

  return {
    id: `dns.${type.toLowerCase()}`,
    label: `${type} records`,
    group: "dns",
    status: result.status,
    observed,
    records: result.records,
    rcode: result.rcode,
    detail: result.detail,
    limitation: DNS_LIMITATIONS[type],
    source: { name: "Google Public DNS (DoH)", url: result.requestUrl },
    retrievedAt: new Date().toISOString(),
    durationMs: result.durationMs,
    error: result.error,
  };
}

/**
 * Runs the six DNS record queries concurrently and emits each check the
 * moment it resolves, so the interface can report real progress.
 */
export async function runDnsChecks(domain: string, emit: EmitCheck): Promise<DnsCheckBundle> {
  const lookups = new Map<string, DnsLookupResult>();
  const checks = new Map<string, CheckResult>();

  await Promise.all(
    DNS_TYPES.map(async (type) => {
      const result = await lookupDns(domain, type);
      const check = dnsCheck(type, domain, result);
      lookups.set(type, result);
      checks.set(check.id, check);
      emit(check);
    }),
  );

  return { lookups, checks };
}

export interface SpfSummary {
  records: string[];
  record: string;
  allMechanism: string | null;
  allQualifier: string | null;
  includes: string[];
  multiple: boolean;
}

export function parseSpf(values: string[]): SpfSummary | null {
  const records = values.filter((value) => /^v=spf1(?:\s|$)/i.test(value.trim()));
  if (records.length === 0) return null;
  const record = records[0];
  const allMatch = record.match(/(?:^|\s)([+\-~?]?)all(?:\s|$)/i);
  const allMechanism = allMatch ? `${allMatch[1] ?? ""}all` : null;
  const includes = Array.from(record.matchAll(/\binclude:(\S+)/gi), (match) => match[1]);
  return {
    records,
    record,
    allMechanism,
    allQualifier: allMatch ? allMatch[1] || "+" : null,
    includes,
    multiple: records.length > 1,
  };
}

function qualifierMeaning(qualifier: string | null): string {
  switch (qualifier) {
    case "-":
      return "hardfail — receivers may reject mail that does not match";
    case "~":
      return "softfail — receivers may mark non-matching mail as suspicious";
    case "?":
      return "neutral — no assertion is made about non-matching mail";
    case "+":
      return "pass — every sender is authorised (permissive)";
    default:
      return "no all mechanism — receivers fall back to their default handling";
  }
}

export function buildSpfCheck(txtCheck: CheckResult | undefined, domain: string): CheckResult {
  const base = {
    id: "mail.spf",
    label: "SPF policy",
    group: "mail" as const,
    retrievedAt: new Date().toISOString(),
    limitation:
      "SPF publication is a property of the domain. It does not verify any individual message, and this build does not evaluate a sender against the policy.",
  };

  if (!txtCheck || txtCheck.status === "failed") {
    return {
      ...base,
      status: "failed",
      observed: null,
      detail: "The TXT lookup failed, so SPF cannot be determined.",
      source: txtCheck?.source ?? null,
      error: txtCheck?.error ?? "TXT lookup unavailable",
    };
  }

  const values = (txtCheck.records ?? []).map((record) => unquoteTxt(record.data));
  const spf = parseSpf(values);

  if (!spf) {
    return {
      ...base,
      status: "no_record",
      observed: null,
      detail: `No SPF record was returned in the TXT records for ${domain}.`,
      source: txtCheck.source,
    };
  }

  const fields: CheckField[] = [
    { label: "Record", value: spf.record },
    { label: "All mechanism", value: spf.allMechanism ?? "none" },
  ];
  if (spf.includes.length > 0) {
    fields.push({ label: "Includes", value: spf.includes.join(", ") });
  }
  if (spf.multiple) {
    fields.push({ label: "Records found", value: String(spf.records.length) });
  }

  return {
    ...base,
    status: "completed",
    observed: spf.record,
    fields,
    detail: spf.multiple
      ? `SPF is published, but ${spf.records.length} records were returned. RFC 7208 requires exactly one, so receivers may treat the policy as invalid.`
      : `SPF is published. The all mechanism is ${spf.allMechanism ?? "absent"} (${qualifierMeaning(
          spf.allQualifier,
        )}).`,
    source: txtCheck.source,
  };
}

export interface DmarcSummary {
  record: string;
  policy: string | null;
  subdomainPolicy: string | null;
  percentage: string | null;
  aggregateReports: boolean;
  multiple: boolean;
}

export function parseDmarc(values: string[]): DmarcSummary | null {
  const records = values.filter((value) => /^v=DMARC1(?:\s*;|$)/i.test(value.trim()));
  if (records.length === 0) return null;
  const record = records[0];
  const tags = new Map<string, string>();
  for (const part of record.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) continue;
    tags.set(rawKey.trim().toLowerCase(), rest.join("=").trim());
  }
  return {
    record,
    policy: tags.get("p") ?? null,
    subdomainPolicy: tags.get("sp") ?? null,
    percentage: tags.get("pct") ?? null,
    aggregateReports: tags.has("rua"),
    multiple: records.length > 1,
  };
}

export async function buildDmarcCheck(domain: string): Promise<CheckResult> {
  const name = `_dmarc.${domain}`;
  const result = await lookupDns(name, "TXT");
  const base = {
    id: "mail.dmarc",
    label: "DMARC policy (_dmarc TXT)",
    group: "mail" as const,
    retrievedAt: new Date().toISOString(),
    source: { name: "Google Public DNS (DoH)", url: result.requestUrl },
    durationMs: result.durationMs,
    limitation:
      "DMARC publication describes a domain policy. It does not prove that a given message passed authentication.",
  };

  if (result.status === "failed") {
    return {
      ...base,
      status: "failed",
      observed: null,
      detail: `The DMARC query for ${name} failed.`,
      error: result.error,
    };
  }

  if (result.status === "no_record" || result.records.length === 0) {
    return {
      ...base,
      status: "no_record",
      observed: null,
      detail:
        result.rcode === 3
          ? `No _dmarc.${domain} name exists, so no DMARC policy is published.`
          : `No DMARC record was returned for _dmarc.${domain}.`,
    };
  }

  const values = result.records.map((record) => unquoteTxt(record.data));
  const dmarc = parseDmarc(values);

  if (!dmarc) {
    return {
      ...base,
      status: "no_record",
      observed: values.join(" · ") || null,
      detail: `TXT records exist at _dmarc.${domain}, but none is a DMARC policy (v=DMARC1).`,
    };
  }

  const fields: CheckField[] = [
    { label: "Record", value: dmarc.record },
    { label: "Policy (p)", value: dmarc.policy ?? "not specified" },
  ];
  if (dmarc.subdomainPolicy)
    fields.push({ label: "Subdomain policy (sp)", value: dmarc.subdomainPolicy });
  if (dmarc.percentage) fields.push({ label: "Percentage (pct)", value: dmarc.percentage });
  fields.push({
    label: "Aggregate reports (rua)",
    value: dmarc.aggregateReports ? "requested" : "not requested",
  });

  return {
    ...base,
    status: "completed",
    observed: dmarc.record,
    fields,
    detail: dmarc.multiple
      ? "More than one DMARC record was returned; receivers may ignore the policy."
      : `DMARC is published with policy p=${dmarc.policy ?? "unspecified"}.`,
  };
}

export function buildDkimCheck(): CheckResult {
  return {
    id: "mail.dkim",
    label: "DKIM signature record",
    group: "mail",
    status: "not_checked",
    observed: null,
    detail:
      "A DKIM query needs a selector (the s= value chosen by the sending domain). No selector was supplied, so no DKIM lookup was made.",
    limitation:
      "DKIM selectors are not discoverable from DNS alone and vary per sending service. This build does not guess them.",
    source: null,
    retrievedAt: new Date().toISOString(),
  };
}

const PROVIDERS: { pattern: RegExp; name: string }[] = [
  {
    pattern: /(^|[.\s])aspmx\d*\.l\.google\.com|googlemail|google\.com$/i,
    name: "Google Workspace",
  },
  { pattern: /protection\.outlook\.com|outlook\.com|office365|microsoft/i, name: "Microsoft 365" },
  { pattern: /pphosted|proofpoint/i, name: "Proofpoint" },
  { pattern: /mimecast/i, name: "Mimecast" },
  { pattern: /zoho/i, name: "Zoho Mail" },
  { pattern: /protonmail|proton\.ch/i, name: "Proton Mail" },
  { pattern: /amazonses|amazonaws/i, name: "Amazon SES" },
  { pattern: /messagingengine|fastmail/i, name: "Fastmail" },
  { pattern: /cloudflare\.net/i, name: "Cloudflare Email Routing" },
  { pattern: /mailgun/i, name: "Mailgun" },
  { pattern: /sendgrid/i, name: "SendGrid" },
];

export function isNullMx(mxCheck: CheckResult | undefined): boolean {
  return (mxCheck?.records ?? []).some((record) => /^0\s+\.$/.test(record.data.trim()));
}

export function inferProvider(mxRecords: string[]): string | null {
  if (mxRecords.length === 0) return null;
  const joined = mxRecords.join(" ");
  const match = PROVIDERS.find((provider) => provider.pattern.test(joined));
  return match ? match.name : null;
}

export function buildProviderCheck(mxCheck: CheckResult | undefined, domain: string): CheckResult {
  const base = {
    id: "mail.provider",
    label: "Mail provider indicator",
    group: "mail" as const,
    retrievedAt: new Date().toISOString(),
    limitation:
      "The provider is inferred from MX hostnames. It describes mail infrastructure for the domain, not the mailbox owner or the service the person uses.",
  };

  if (!mxCheck || mxCheck.status === "failed") {
    return {
      ...base,
      status: "failed",
      observed: null,
      detail: "The MX lookup failed, so no provider inference is possible.",
      source: mxCheck?.source ?? null,
      error: mxCheck?.error ?? "MX lookup unavailable",
    };
  }

  if (mxCheck.status === "no_record") {
    return {
      ...base,
      status: "not_checked",
      observed: null,
      detail: "No MX records were returned, so no provider was inferred.",
      source: mxCheck.source,
    };
  }

  if (isNullMx(mxCheck)) {
    return {
      ...base,
      status: "not_checked",
      observed: null,
      detail:
        "The domain publishes a null MX (0 .), which declares that it does not accept email. No provider inference is possible.",
      source: mxCheck.source,
    };
  }

  const hosts = (mxCheck.records ?? []).map((record) => record.data);
  const provider = inferProvider(hosts);

  return {
    ...base,
    status: "completed",
    observed: provider ?? "No known provider matched the MX hostnames",
    fields: provider ? [{ label: "Provider", value: provider }] : undefined,
    detail: provider
      ? `${domain} publishes MX hostnames consistent with ${provider}.`
      : "MX records are published, but their hostnames do not match a provider this build recognises. They are not necessarily self-hosted.",
    source: mxCheck.source,
  };
}

export async function buildRdapCheck(domain: string): Promise<CheckResult> {
  const result = await lookupRdap(domain);
  const base = {
    id: "registry.rdap",
    label: "Domain registration (RDAP)",
    group: "registry" as const,
    retrievedAt: new Date().toISOString(),
    source: { name: "RDAP via rdap.org", url: result.finalUrl ?? result.requestUrl },
    durationMs: result.durationMs,
    limitation:
      "Registration data is reported by the registry and is frequently redacted. Registrant identity is not established by this record.",
  };

  if (result.status === "failed" || !result.summary) {
    return {
      ...base,
      status: result.status,
      observed: null,
      detail: result.detail,
      error: result.error,
      fields: result.httpStatus
        ? [{ label: "HTTP status", value: String(result.httpStatus) }]
        : undefined,
    };
  }

  const summary = result.summary;
  const fields: CheckField[] = [
    { label: "Handle", value: summary.handle ?? "not reported" },
    { label: "Registrar", value: summary.registrar ?? "not reported" },
    { label: "Registered", value: summary.registered ?? "not reported" },
    { label: "Expires", value: summary.expires ?? "not reported" },
    { label: "Last changed", value: summary.lastChanged ?? "not reported" },
    {
      label: "Name servers",
      value: summary.nameservers.length > 0 ? summary.nameservers.join(", ") : "not reported",
    },
    {
      label: "Registry status",
      value: summary.statuses.length > 0 ? summary.statuses.join(", ") : "not reported",
    },
  ];

  return {
    ...base,
    status: "completed",
    observed: [
      summary.registrar ?? "Registrar not reported",
      summary.registered ? `registered ${summary.registered}` : null,
      summary.expires ? `expires ${summary.expires}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    fields,
    detail: "The registry returned an RDAP object for this domain name.",
  };
}

export interface AvatarCheckResult {
  check: CheckResult;
  url: string | null;
  hash: string;
}

export async function buildGravatarCheck(email: string): Promise<AvatarCheckResult> {
  const result = await lookupGravatar(email);
  const check: CheckResult = {
    id: "avatar.gravatar",
    label: "Gravatar public avatar",
    group: "avatar",
    status: result.status,
    observed:
      result.status === "completed"
        ? `Avatar image returned for MD5 hash ${result.hash}`
        : result.status === "no_record"
          ? result.detail
          : null,
    detail: result.detail,
    limitation:
      "A Gravatar entry is keyed by the MD5 hash of the address. It is a source-reported artefact of that address, not proof of identity, ownership or use.",
    source: { name: "Gravatar", url: result.requestUrl },
    retrievedAt: new Date().toISOString(),
    durationMs: result.durationMs,
    error: result.error,
    fields: [{ label: "MD5 hash", value: result.hash }],
  };
  return { check, url: result.url, hash: result.hash };
}

export function buildNormalizationCheck(params: {
  entityType: EntityType;
  original: string;
  normalized: string;
  domain?: string;
  localPart?: string;
}): CheckResult {
  const fields: CheckField[] = [{ label: "Original input", value: params.original }];
  if (params.localPart !== undefined) fields.push({ label: "Local part", value: params.localPart });
  if (params.domain !== undefined) fields.push({ label: "Domain", value: params.domain });
  fields.push({ label: "Normalised", value: params.normalized });

  return {
    id: "input.normalize",
    label: "Input validation and normalisation",
    group: "input",
    status: "completed",
    observed: params.normalized,
    fields,
    detail:
      params.entityType === "email"
        ? "The local part and domain were separated. The domain was lower-cased for DNS queries; the original input is preserved above."
        : params.entityType === "username"
          ? "A leading @ was removed and the name was validated against GitHub's account-name rules. The original input is preserved above."
          : "The domain was lower-cased and stripped of a trailing root dot before querying.",
    limitation:
      params.entityType === "email"
        ? "Syntax validity does not establish that the mailbox exists, is reachable, or belongs to any particular person."
        : params.entityType === "username"
          ? "A valid account name does not establish that an account exists, is active, or belongs to any particular person."
          : "A syntactically valid domain does not imply that it is registered, active or trustworthy.",
    source: null,
    retrievedAt: new Date().toISOString(),
  };
}

export function statusCounts(checks: CheckResult[]) {
  const counts: Record<CheckStatus, number> = {
    completed: 0,
    no_record: 0,
    failed: 0,
    not_checked: 0,
  };
  for (const check of checks) counts[check.status] += 1;
  return counts;
}

/**
 * Relationship builders shared by the email and domain runners. Each returns
 * null unless its supporting check actually produced an observation, so a
 * relationship is never drawn without evidence.
 */
export function buildProviderRelationship(
  domain: string,
  providerCheck: CheckResult | undefined,
): Relationship | null {
  if (!providerCheck || providerCheck.status !== "completed") return null;
  const providerName = providerCheck.fields?.find((field) => field.label === "Provider")?.value;
  if (!providerName) return null;
  return {
    id: "rel.mail-provider",
    from: { kind: "domain", label: domain },
    to: { kind: "organization", label: providerName },
    type: "Mail infrastructure consistent with provider",
    classification: "inferred",
    evidenceIds: ["dns.mx", "mail.provider"],
    explanation: `The MX hostnames returned for ${domain} match patterns this build associates with ${providerName}.`,
    limitation: providerCheck.limitation,
  };
}

export function buildRegistrarRelationship(
  domain: string,
  rdapCheck: CheckResult | undefined,
): Relationship | null {
  if (!rdapCheck || rdapCheck.status !== "completed") return null;
  const registrar = rdapCheck.fields?.find((field) => field.label === "Registrar")?.value;
  if (!registrar || registrar === "not reported") return null;
  return {
    id: "rel.registrar",
    from: { kind: "domain", label: domain },
    to: { kind: "organization", label: registrar },
    type: "Registered through this organisation",
    classification: "source_reported",
    evidenceIds: ["registry.rdap"],
    explanation: `The registry's RDAP response lists ${registrar} as the registrar for ${domain}.`,
    limitation: rdapCheck.limitation,
  };
}
