import {
  buildNormalizationCheck,
  createCaseId,
  type EmitCheck,
  sortChecks,
  statusCounts,
} from "./collect";
import { lookupGithubProfile } from "./github";
import { normalizeUsername } from "./validation";
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

function buildSummary(username: string, checks: CheckResult[]): string {
  const counts = statusCounts(checks);
  const attempted = checks.filter((check) => check.status !== "not_checked").length;
  const github = checks.find((check) => check.id === "identity.github");

  const parts: string[] = [
    `${counts.completed} of ${attempted} attempted checks returned observations${
      counts.failed > 0 ? `, and ${counts.failed} failed` : ""
    }.`,
  ];

  if (github?.status === "completed") {
    parts.push(
      `GitHub returned a public profile for the login “${username}”. This is a discovery lead on one platform, not an identity match.`,
    );
  } else if (github?.status === "no_record") {
    parts.push(
      `GitHub returned no public profile for the login “${username}”. Absence on GitHub does not establish absence elsewhere.`,
    );
  } else if (github?.status === "failed") {
    parts.push("The GitHub lookup did not complete, so no profile result is available.");
  }

  return parts.filter(Boolean).join(" ");
}

/**
 * Runs the username investigation against one documented source (the GitHub
 * public API). The result is classified as a discovery lead throughout; no
 * platform enumeration or identity claim is made.
 */
export async function runUsernameInvestigation(
  input: string,
  onCheck: EmitCheck,
): Promise<CaseRecord> {
  const validation = normalizeUsername(input);
  if (!validation.ok) throw new Error(validation.error);
  const username = validation.normalized;

  const createdAt = new Date().toISOString();
  const checks: CheckResult[] = [];
  const emit: EmitCheck = (check) => {
    checks.push(check);
    onCheck(check);
  };

  emit(
    buildNormalizationCheck({
      entityType: "username",
      original: validation.original,
      normalized: username,
    }),
  );

  const { check: githubCheck, profileUrl, login } = await lookupGithubProfile(username);
  emit(githubCheck);

  const ordered = sortChecks(checks);

  const findings: Finding[] = [
    finding(
      "finding.username-syntax",
      "observed",
      "The input parses as an account name and was normalised for the lookup.",
      ["input.normalize"],
      "A syntactically valid name does not imply that an account exists, is active, or belongs to any particular person.",
    ),
  ];

  if (githubCheck.status === "completed" && login) {
    findings.push(
      finding(
        "finding.github-profile",
        "source_reported",
        `GitHub reports a public profile with the login “${login}”.`,
        ["identity.github"],
        "A matching login on one platform is a discovery lead, not proof of identity or common ownership. Profile content was not verified against any other source.",
      ),
    );
  } else if (githubCheck.status === "no_record") {
    findings.push(
      finding(
        "finding.github-no-profile",
        "observed",
        "GitHub returned no public profile for this account name.",
        ["identity.github"],
        "Absence on GitHub does not establish that the name is unused elsewhere, or that any particular person does or does not control it.",
      ),
    );
  } else if (githubCheck.status === "failed") {
    findings.push(
      finding(
        "finding.github-failed",
        "failed",
        "The GitHub lookup did not complete, so no profile result is available.",
        ["identity.github"],
        "A failed lookup is not evidence that no profile exists.",
      ),
    );
  }

  const relationships: Relationship[] = [];
  if (githubCheck.status === "completed" && login) {
    relationships.push({
      id: "rel.github-profile",
      from: { kind: "username", label: username },
      to: {
        kind: "profile",
        label: `github.com/${login}`,
        ...(profileUrl ? { url: profileUrl } : {}),
      },
      type: "Source-reported account with this login",
      classification: "source_reported",
      evidenceIds: ["identity.github"],
      explanation: `The GitHub public API returned a profile whose login matches the investigated account name (case-insensitively).`,
      limitation:
        "This link records what GitHub returned for this login. It does not establish who operates the account or connect it to any person.",
    });
  }

  return {
    schemaVersion: CASE_SCHEMA_VERSION,
    id: createCaseId(),
    entityType: "username",
    target: validation.original,
    normalized: username,
    createdAt,
    completedAt: new Date().toISOString(),
    status: deriveCaseStatus(ordered),
    checks: ordered,
    findings,
    relationships,
    summary: buildSummary(username, ordered),
    notes: "",
    notesUpdatedAt: null,
    toolVersion: TOOL_VERSION,
  };
}
