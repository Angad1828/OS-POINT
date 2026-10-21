import {
  buildDkimCheck,
  buildDmarcCheck,
  buildNormalizationCheck,
  buildProviderCheck,
  buildProviderRelationship,
  buildRdapCheck,
  buildRegistrarRelationship,
  buildSpfCheck,
  createCaseId,
  isNullMx,
  type EmitCheck,
  runDnsChecks,
  sortChecks,
  statusCounts,
} from "./collect";
import { normalizeDomain } from "./validation";
import {
  CASE_SCHEMA_VERSION,
  TOOL_VERSION,
  deriveCaseStatus,
  type CaseRecord,
  type CheckResult,
  type Finding,
  type Relationship,
} from "./types";

function finding(
  id: string,
  classification: Finding["classification"],
  statement: string,
  checkIds: string[],
  limitation?: string,
): Finding {
  return { id, classification, statement, checkIds, limitation };
}

function addressFinding(a: CheckResult | undefined, aaaa: CheckResult | undefined): Finding | null {
  if (!a && !aaaa) return null;

  if (a?.status === "failed" && aaaa?.status === "failed") {
    return finding(
      "finding.address-lookup-failed",
      "failed",
      "Neither the A nor the AAAA lookup completed, so the domain's address records are unknown.",
      ["dns.a", "dns.aaaa"],
      "A failed lookup is not evidence that the domain has no addresses.",
    );
  }

  if (a?.status === "no_record" && a.rcode === 3) {
    return finding(
      "finding.nxdomain",
      "observed",
      "The resolver returned NXDOMAIN for this name, which means the name does not exist in DNS.",
      ["dns.a"],
      "NXDOMAIN describes the queried name at query time.",
    );
  }

  const aRecords = a?.records ?? [];
  const aaaaRecords = aaaa?.records ?? [];

  if (aRecords.length === 0 && aaaaRecords.length === 0) {
    return finding(
      "finding.no-address",
      "observed",
      "No A or AAAA records were returned for the domain.",
      ["dns.a", "dns.aaaa"],
      "A domain can host mail or other services without publishing address records.",
    );
  }

  return finding(
    "finding.addresses",
    "observed",
    `${aRecords.length} A and ${aaaaRecords.length} AAAA record${
      aRecords.length + aaaaRecords.length === 1 ? "" : "s"
    } were returned for the domain.`,
    ["dns.a", "dns.aaaa"],
    "Address records show where the name resolves, not who controls the infrastructure.",
  );
}

function mxFinding(mx: CheckResult | undefined): Finding | null {
  if (!mx) return null;
  if (mx.status === "completed") {
    if (isNullMx(mx)) {
      return finding(
        "finding.null-mx",
        "observed",
        "The domain publishes a null MX record (0 .), which declares that it does not accept email.",
        ["dns.mx"],
        "A null MX is an explicit DNS declaration. It does not prove the domain is unused for other services.",
      );
    }
    const count = mx.records?.length ?? 0;
    return finding(
      "finding.mx",
      "observed",
      `The domain publishes ${count} mail exchange record${count === 1 ? "" : "s"}.`,
      ["dns.mx"],
      "MX records describe mail routing for the domain; they do not show that any individual mailbox exists.",
    );
  }
  if (mx.status === "no_record") {
    return finding(
      "finding.no-mx",
      "observed",
      "No MX records were returned for the domain.",
      ["dns.mx"],
      "Absence of MX records is a configuration observation, not evidence of malicious activity.",
    );
  }
  return finding(
    "finding.mx-failed",
    "failed",
    "The MX lookup failed, so mail routing for the domain is unknown.",
    ["dns.mx"],
  );
}

function spfFinding(spf: CheckResult): Finding {
  if (spf.status === "completed") {
    return finding(
      "finding.spf",
      "observed",
      "An SPF policy is published for the domain.",
      ["mail.spf"],
      "SPF publication does not verify any individual message.",
    );
  }
  if (spf.status === "no_record") {
    return finding(
      "finding.no-spf",
      "observed",
      "No SPF record was returned for the domain.",
      ["mail.spf"],
      "SPF absence is a domain configuration property, not evidence of malicious activity.",
    );
  }
  return finding(
    "finding.spf-failed",
    "failed",
    "SPF could not be determined because the TXT lookup did not complete.",
    ["mail.spf"],
  );
}

function dmarcFinding(dmarc: CheckResult): Finding {
  if (dmarc.status === "completed") {
    const policy = dmarc.fields?.find((field) => field.label.startsWith("Policy"))?.value;
    return finding(
      "finding.dmarc",
      "observed",
      `A DMARC policy is published${policy ? ` with p=${policy}` : ""}.`,
      ["mail.dmarc"],
      "DMARC publication describes a domain policy; it does not prove that any message passed authentication.",
    );
  }
  if (dmarc.status === "no_record") {
    return finding(
      "finding.no-dmarc",
      "observed",
      "No DMARC record was returned at _dmarc for the domain.",
      ["mail.dmarc"],
      "An absent DMARC record is a configuration observation, not a security verdict.",
    );
  }
  return finding(
    "finding.dmarc-failed",
    "failed",
    "The DMARC query failed, so the domain's policy is unknown.",
    ["mail.dmarc"],
    "A failed query is not a missing policy.",
  );
}

function rdapFinding(rdap: CheckResult): Finding | null {
  if (rdap.status === "completed") {
    const registrar = rdap.fields?.find((field) => field.label === "Registrar")?.value;
    const registered = rdap.fields?.find((field) => field.label === "Registered")?.value;
    return finding(
      "finding.rdap",
      "source_reported",
      `Registry data reports ${registrar ?? "an unstated registrar"}${
        registered ? `, registered ${registered}` : ""
      }.`,
      ["registry.rdap"],
      "Registration data is reported by the registry, is often redacted, and does not identify an operator.",
    );
  }
  if (rdap.status === "failed") {
    return finding(
      "finding.rdap-failed",
      "failed",
      "The registration lookup failed, so registry context is unavailable.",
      ["registry.rdap"],
    );
  }
  return null;
}

function buildSummary(domain: string, checks: CheckResult[]): string {
  const counts = statusCounts(checks);
  const attempted = checks.filter((check) => check.status !== "not_checked").length;
  const byId = new Map(checks.map((check) => [check.id, check]));
  const mx = byId.get("dns.mx");
  const provider = byId.get("mail.provider");
  const spf = byId.get("mail.spf");
  const dmarc = byId.get("mail.dmarc");
  const rdap = byId.get("registry.rdap");

  const parts: string[] = [
    `${counts.completed} of ${attempted} attempted checks returned observations${
      counts.failed > 0 ? `, and ${counts.failed} failed` : ""
    }.`,
  ];

  if (mx?.status === "completed") {
    if (isNullMx(mx)) {
      parts.push(`${domain} publishes a null MX (0 .) and declares that it does not accept email.`);
    } else {
      const providerName = provider?.status === "completed" ? provider.observed : null;
      parts.push(
        `${domain} publishes mail exchange records${providerName ? ` (${providerName})` : ""}.`,
      );
    }
  } else if (mx?.status === "no_record") {
    parts.push(`${domain} returned no MX records.`);
  } else if (mx?.status === "failed") {
    parts.push("The MX lookup failed, so mail routing is unknown.");
  }

  if (spf?.status === "completed") parts.push("An SPF policy is published.");
  else if (spf?.status === "no_record") parts.push("No SPF policy was returned.");
  else if (spf?.status === "failed") parts.push("SPF could not be determined.");

  if (dmarc?.status === "completed") {
    const policy = dmarc.fields?.find((field) => field.label.startsWith("Policy"))?.value;
    parts.push(`DMARC is published${policy ? ` (p=${policy})` : ""}.`);
  } else if (dmarc?.status === "no_record") parts.push("No DMARC policy was returned.");
  else if (dmarc?.status === "failed") parts.push("The DMARC query failed.");

  if (rdap?.status === "completed") parts.push("Registry registration data was retrieved.");
  else if (rdap?.status === "failed")
    parts.push("Registry registration data could not be retrieved.");

  return parts.filter(Boolean).join(" ");
}

/** Runs the domain investigation, emitting checks as each one resolves. */
export async function runDomainInvestigation(
  input: string,
  onCheck: EmitCheck,
): Promise<CaseRecord> {
  const validation = normalizeDomain(input);
  if (!validation.ok) throw new Error(validation.error);
  const domain = validation.normalized;

  const createdAt = new Date().toISOString();
  const checks: CheckResult[] = [];
  const emit: EmitCheck = (check) => {
    checks.push(check);
    onCheck(check);
  };

  emit(
    buildNormalizationCheck({
      entityType: "domain",
      original: validation.original,
      normalized: domain,
      domain,
    }),
  );

  const { checks: dnsChecks } = await runDnsChecks(domain, emit);

  const spf = buildSpfCheck(dnsChecks.get("dns.txt"), domain);
  emit(spf);
  const provider = buildProviderCheck(dnsChecks.get("dns.mx"), domain);
  emit(provider);
  emit(buildDkimCheck());

  const [dmarc, rdap] = await Promise.all([
    buildDmarcCheck(domain).then((check) => {
      emit(check);
      return check;
    }),
    buildRdapCheck(domain).then((check) => {
      emit(check);
      return check;
    }),
  ]);

  const ordered = sortChecks(checks);
  const findings = [
    addressFinding(dnsChecks.get("dns.a"), dnsChecks.get("dns.aaaa")),
    mxFinding(dnsChecks.get("dns.mx")),
    spfFinding(spf),
    dmarcFinding(dmarc),
    rdapFinding(rdap),
  ].filter((item): item is Finding => item !== null);

  const relationships: Relationship[] = [
    buildProviderRelationship(domain, provider),
    buildRegistrarRelationship(domain, rdap),
  ].filter((item): item is Relationship => item !== null);

  return {
    schemaVersion: CASE_SCHEMA_VERSION,
    id: createCaseId(),
    entityType: "domain",
    target: validation.original,
    normalized: domain,
    createdAt,
    completedAt: new Date().toISOString(),
    status: deriveCaseStatus(ordered),
    checks: ordered,
    findings,
    relationships,
    summary: buildSummary(domain, ordered),
    notes: "",
    notesUpdatedAt: null,
    toolVersion: TOOL_VERSION,
  };
}
