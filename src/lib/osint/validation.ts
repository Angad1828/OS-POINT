/**
 * Input validation and normalisation.
 *
 * These rules are deliberately conservative: they reject malformed input with
 * a specific reason, and they never imply that a syntactically valid address
 * exists or belongs to anyone.
 */

export interface ValidatedInput {
  ok: true;
  /** Original analyst input, trimmed but otherwise untouched. */
  original: string;
  /** Normalised value used for collection. */
  normalized: string;
  domain?: string;
  localPart?: string;
}

export interface ValidationFailure {
  ok: false;
  error: string;
}

export type ValidationResult = ValidatedInput | ValidationFailure;

const EMAIL_LOCAL = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
const DOMAIN_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function fail(error: string): ValidationFailure {
  return { ok: false, error };
}

export function normalizeDomain(input: string): ValidationResult {
  const original = input.trim();
  if (!original) return fail("Enter a domain name.");
  if (/\s/.test(original)) return fail("A domain name cannot contain spaces.");
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(original)) {
    return fail("Enter a bare domain, for example example.com — not a full URL.");
  }
  if (/[/?#@]/.test(original)) {
    return fail("Enter only the domain name, without a path, query or @ sign.");
  }

  const domain = original.replace(/\.$/, "").toLowerCase();
  if (domain.length > 253) return fail("The domain name is longer than 253 characters.");
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(domain)) {
    return fail("IP address lookups are not part of this build.");
  }

  const labels = domain.split(".");
  if (labels.length < 2)
    return fail("Enter a fully qualified domain name, for example example.com.");
  if (labels.some((label) => label.length === 0))
    return fail("The domain contains an empty label.");
  for (const label of labels) {
    if (!DOMAIN_LABEL.test(label)) {
      return fail(`The label "${label}" is not a valid domain label.`);
    }
  }
  const tld = labels[labels.length - 1];
  if (!/^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/.test(tld)) {
    return fail("The top-level domain is not valid.");
  }

  return { ok: true, original, normalized: domain, domain };
}

export function normalizeEmail(input: string): ValidationResult {
  const original = input.trim();
  if (!original) return fail("Enter an email address.");
  if (/\s/.test(original)) return fail("An email address cannot contain spaces.");
  if (original.length > 254) return fail("The address is longer than 254 characters.");

  const at = original.indexOf("@");
  if (at === -1 || original.indexOf("@", at + 1) !== -1) {
    return fail("An email address must contain exactly one @ sign.");
  }

  const localPart = original.slice(0, at);
  const domainPart = original.slice(at + 1);
  if (!localPart) return fail("The address is missing its local part.");
  if (localPart.length > 64) return fail("The local part is longer than 64 characters.");
  if (!EMAIL_LOCAL.test(localPart)) {
    return fail("The local part contains characters that are not valid in an email address.");
  }
  if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) {
    return fail("The local part cannot start or end with a dot, or contain two dots in a row.");
  }

  const domainResult = normalizeDomain(domainPart);
  if (!domainResult.ok) return fail(`Domain: ${domainResult.error}`);

  return {
    ok: true,
    original,
    normalized: `${localPart}@${domainResult.normalized}`,
    domain: domainResult.domain,
    localPart,
  };
}

/**
 * GitHub account names. Used by the username module when a provider is
 * connected; validation exists now so the rules are stated in one place.
 */
export function normalizeUsername(input: string): ValidationResult {
  const original = input.trim();
  if (!original) return fail("Enter a username.");
  const username = original.replace(/^@/, "");
  if (username.length > 39) return fail("GitHub account names are at most 39 characters.");
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9]))*$/.test(username)) {
    return fail("Use letters, digits or single hyphens, and do not start or end with a hyphen.");
  }
  if (username.includes("--"))
    return fail("GitHub account names cannot contain consecutive hyphens.");
  return { ok: true, original, normalized: username };
}
