import {
  buildDkimCheck,
  buildDmarcCheck,
  buildGravatarCheck,
  buildNormalizationCheck,
  buildProviderCheck,
  buildRdapCheck,
  buildSpfCheck,
  createCaseId,
  isNullMx,
  type EmitCheck,
  runDnsChecks,
  sortChecks,
  statusCounts,
} from "./collect";
import { lookupGithubProfile } from "./github";
import { normalizeEmail } from "./validation";
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
      "NXDOMAIN describes the queried name at query time; it does not by itself indicate anything about intent.",
    );
  }

  const records = [
    ...(a?.records ?? []).map((record) => `${record.data} (A)`),
    ...(aaaa?.records ?? []).map((record) => `${record.data} (AAAA)`),
  ];

  if (records.length === 0) {
    return finding(
      "finding.no-address",
      "observed",
      "No A or AAAA records were returned for the domain.",
      ["dns.a", "dns.aaaa"],
      "A domain can be used for mail or other services without publishing address records.",
    );
  }

  return finding(
    "finding.addresses",
    "observed",
    `The domain resolves to ${records.length} address record${records.length === 1 ? "" : "s"}: ${records
      .slice(0, 6)
      .join(", ")}${records.length > 6 ? ", …" : ""}.`,
    ["dns.a", "dns.aaaa"],
    "Address records show where the name resolves, not who controls it.",
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
      "MX records describe routing for the whole domain. They do not show that this address exists, is deliverable, or is read by anyone.",
    );
  }
  if (mx.status === "no_record") {
    return finding(
      "finding.no-mx",
      "observed",
      "No MX records were returned for the domain.",
      ["dns.mx"],
      "Some domains still receive mail through an implicit address-record fallback, so this is not proof that mail is impossible.",
    );
  }
  return finding(
    "finding.mx-failed",
    "failed",
    "The MX lookup failed, so mail routing for the domain is unknown.",
    ["dns.mx"],
    "A failed lookup must not be reported as an absence of mail infrastructure.",
  );
}

function spfFinding(spf: CheckResult): Finding {
  if (spf.status === "completed") {
    return finding(
      "finding.spf",
      "observed",
      "An SPF policy is published for the domain.",
      ["mail.spf"],
      "SPF publication does not verify any individual message and was not evaluated against a sender in this run.",
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
      "DMARC publication describes a domain policy. It does not prove that a given message passed authentication.",
    );
  }
  if (dmarc.status === "no_record") {
    return finding(
      "finding.no-dmarc",
      "observed",
      "No DMARC record was returned at _dmarc for the domain.",
      ["mail.dmarc"],
      "An absent DMARC record is a configuration observation, not a security verdict about the address.",
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

function avatarFinding(avatar: CheckResult): Finding | null {
  if (avatar.status === "completed") {
    return finding(
      "finding.gravatar",
      "source_reported",
      "Gravatar reports a public avatar for the MD5 hash of this address.",
      ["avatar.gravatar"],
      "The avatar is keyed by a hash of the address. It does not establish ownership, identity, or that the account is in use.",
    );
  }
  return null;
}

/**
 * Optional username-based discovery. Kept out of the email-specific findings
 * so a local-part match is never read as evidence about the mailbox.
 */
function usernameLeadFinding(
  github: { check: CheckResult; login: string | null } | null,
): Finding | null {
  if (!github) return null;
  if (github.check.status === "completed" && github.login) {
    return finding(
      "finding.username-lead",
      "source_reported",
      `Optional username-based discovery: GitHub reports a public profile with the login “${github.login}”, spelled the same as the address local part.`,
      ["identity.github"],
      "Association not verified. This is a lead from one platform, recorded separately from the email evidence; it does not link the profile to the mailbox or its owner.",
    );
  }
  if (github.check.status === "no_record") {
    return finding(
      "finding.username-lead-none",
      "observed",
      "Optional username-based discovery: GitHub returned no public profile for a login matching the address local part.",
      ["identity.github"],
      "Association not verified. Absence on GitHub says nothing about other platforms or about the address itself.",
    );
  }
  return finding(
    "finding.username-lead-failed",
    "failed",
    "Optional username-based discovery: the GitHub lookup did not complete, so no profile result is available.",
    ["identity.github"],
    "A failed lookup is not evidence that no matching profile exists.",
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
      "Registration data is reported by the registry, is often redacted, and does not identify the mailbox owner.",
    );
  }
  if (rdap.status === "failed") {
    return finding(
      "finding.rdap-failed",
      "failed",
      "The domain registration lookup failed, so registry context is unavailable.",
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
  const spf = byId.get("mail.spf");
  const dmarc = byId.get("mail.dmarc");
  const provider = byId.get("mail.provider");
  const rdap = byId.get("registry.rdap");

  const parts: string[] = [];
  parts.push(
    `${counts.completed} of ${attempted} attempted checks returned observations${
      counts.failed > 0 ? `, and ${counts.failed} failed` : ""
    }.`,
  );

  if (mx?.status === "completed") {
    if (isNullMx(mx)) {
      parts.push(`${domain} publishes a null MX (0 .) and declares that it does not accept email.`);
    } else {
      const providerName = provider?.status === "completed" ? provider.observed : null;
      parts.push(
        `${domain} publishes mail exchange records${providerName ? ` (${providerName})` : ""}. Mail routing does not establish that the mailbox exists.`,
      );
    }
  } else if (mx?.status === "no_record") {
    parts.push(`${domain} returned no MX records.`);
  } else if (mx?.status === "failed") {
    parts.push(`The MX lookup for ${domain} failed, so mail routing is unknown.`);
  }

  if (spf?.status === "completed") parts.push("An SPF policy is published.");
  else if (spf?.status === "no_record") parts.push("No SPF policy was returned.");
  else if (spf?.status === "failed") parts.push("SPF could not be determined.");

  if (dmarc?.status === "completed") {
    const policy = dmarc.fields?.find((field) => field.label.startsWith("Policy"))?.value;
    parts.push(`DMARC is published${policy ? ` (p=${policy})` : ""}.`);
  } else if (dmarc?.status === "no_record") parts.push("No DMARC policy was returned.");
  else if (dmarc?.status === "failed") parts.push("The DMARC query failed.");

  if (rdap?.status === "failed") parts.push("Registry data could not be retrieved.");
  else if (rdap?.status === "completed") parts.push("Registry data was retrieved.");

  const github = byId.get("identity.github");
  if (github?.status === "completed")
    parts.push(
      "Optional username-based discovery found a matching GitHub login; the association is not verified.",
    );
  else if (github?.status === "no_record")
    parts.push("Optional username-based discovery returned no matching GitHub profile.");
  else if (github?.status === "failed")
    parts.push("Optional username-based discovery did not complete.");

  parts.push(
    counts.not_checked > 0 ? `${counts.not_checked} check was not possible in this run.` : "",
  );

  return parts.filter(Boolean).join(" ");
}

/**
 * Runs the email investigation. Every check is emitted as soon as it resolves;
 * the returned case is the complete, ordered record.
 *
 * `options.usernameDiscovery` adds the optional username-based discovery step
 * for the address local part. It is off by default, is recorded under its own
 * check ID, and is never merged into the email-specific evidence.
 */
export async function runEmailInvestigation(
  input: string,
  onCheck: EmitCheck,
  options: { usernameDiscovery?: boolean } = {},
): Promise<CaseRecord> {
  const validation = normalizeEmail(input);
  if (!validation.ok) throw new Error(validation.error);
  const domain = validation.domain;
  if (!domain) throw new Error("The address does not contain a domain.");

  const createdAt = new Date().toISOString();
  const checks: CheckResult[] = [];
  const emit: EmitCheck = (check) => {
    checks.push(check);
    onCheck(check);
  };

  emit(
    buildNormalizationCheck({
      entityType: "email",
      original: validation.original,
      normalized: validation.normalized,
      domain,
      localPart: validation.localPart,
    }),
  );

  const { checks: dnsChecks } = await runDnsChecks(domain, emit);

  const spf = buildSpfCheck(dnsChecks.get("dns.txt"), domain);
  emit(spf);
  const provider = buildProviderCheck(dnsChecks.get("dns.mx"), domain);
  emit(provider);
  emit(buildDkimCheck());

  const githubSearch =
    options.usernameDiscovery && validation.localPart
      ? lookupGithubProfile(validation.localPart).then((result) => {
          emit({
            ...result.check,
            label: "GitHub profile matching the local part (optional discovery)",
          });
          return result;
        })
      : null;

  const [dmarc, rdap, avatar, github] = await Promise.all([
    buildDmarcCheck(domain).then((check) => {
      emit(check);
      return check;
    }),
    buildRdapCheck(domain).then((check) => {
      emit(check);
      return check;
    }),
    buildGravatarCheck(validation.normalized).then((result) => {
      emit(result.check);
      return result.check;
    }),
    githubSearch,
  ]);

  const ordered = sortChecks(checks);
  const findings = [
    finding(
      "finding.syntax",
      "observed",
      "The input parses as an email address and was normalised for collection.",
      ["input.normalize"],
      "Syntax validity does not establish that the mailbox exists, is reachable, or belongs to any particular person.",
    ),
    addressFinding(dnsChecks.get("dns.a"), dnsChecks.get("dns.aaaa")),
    mxFinding(dnsChecks.get("dns.mx")),
    spfFinding(spf),
    dmarcFinding(dmarc),
    rdapFinding(rdap),
    avatarFinding(avatar),
    usernameLeadFinding(github),
  ].filter((item): item is Finding => item !== null);

  const relationships: Relationship[] = [
    {
      id: "rel.address-domain",
      from: { kind: "email", label: validation.normalized },
      to: { kind: "domain", label: domain },
      type: "Address is at this domain",
      classification: "observed",
      evidenceIds: ["input.normalize"],
      explanation:
        "The domain was parsed directly from the address syntax in the original input above.",
      limitation:
        "Syntax only: this does not show that the mailbox exists, that mail is delivered, or that any person controls it.",
    },
  ];

  if (github?.check.status === "completed" && github.login) {
    relationships.push({
      id: "rel.localpart-lead",
      from: { kind: "email", label: validation.normalized },
      to: {
        kind: "profile",
        label: `github.com/${github.login}`,
        ...(github.profileUrl ? { url: github.profileUrl } : {}),
      },
      type: "Possible username lead matching the local part",
      classification: "unverified",
      evidenceIds: ["identity.github"],
      explanation:
        "The optional discovery step found a GitHub profile whose login matches the address local part.",
      limitation:
        "Optional username-based discovery — association not verified. A shared string is not evidence of common ownership.",
    });
  }

  return {
    schemaVersion: CASE_SCHEMA_VERSION,
    id: createCaseId(),
    entityType: "email",
    target: validation.original,
    normalized: validation.normalized,
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
