import type { CheckResult } from "./types";

/**
 * GitHub public API lookup for one account name.
 *
 * Access method: a single unauthenticated GET against the documented
 * `/users/{username}` endpoint. No scraping, no authentication probing, no
 * guessed profile URLs. Unauthenticated requests are limited to 60 per hour
 * per IP; the limit is read from the response headers and reported honestly
 * when it is exhausted.
 *
 * Everything in the response body is untrusted source content. Only a URL that
 * matches the expected github.com profile pattern is ever surfaced.
 */

const API_BASE = "https://api.github.com/users/";
const TIMEOUT_MS = 8000;
const API_VERSION = "2022-11-28";
const PROFILE_URL_PATTERN = /^https:\/\/github\.com\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/?$/;

export interface GithubProfileCheck {
  check: CheckResult;
  /** Validated profile URL, null when absent or not matching the safe pattern. */
  profileUrl: string | null;
  /** Login exactly as GitHub returned it (canonical casing). */
  login: string | null;
}

function baseCheck(username: string) {
  return {
    id: "identity.github",
    label: "GitHub public profile",
    group: "identity" as const,
    retrievedAt: new Date().toISOString(),
    limitation:
      "GitHub is a single platform. A match here is a discovery lead with platform, URL and retrieval time recorded — it does not establish identity, common ownership or account activity. Absence here says nothing about other platforms.",
    source: { name: "GitHub public API", url: `${API_BASE}${encodeURIComponent(username)}` },
  };
}

export async function lookupGithubProfile(username: string): Promise<GithubProfileCheck> {
  const base = baseCheck(username);
  const requestUrl = base.source.url;
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(requestUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": API_VERSION,
      },
      signal: controller.signal,
    });
  } catch (cause) {
    clearTimeout(timer);
    const aborted = controller.signal.aborted;
    return {
      profileUrl: null,
      login: null,
      check: {
        ...base,
        status: "failed",
        observed: null,
        detail: aborted
          ? `The GitHub request did not answer within ${TIMEOUT_MS / 1000} seconds.`
          : "The GitHub request could not be completed.",
        durationMs: Math.round(performance.now() - started),
        error: cause instanceof Error ? cause.message : String(cause),
      },
    };
  }
  clearTimeout(timer);
  const durationMs = Math.round(performance.now() - started);
  const rateRemaining = response.headers.get("x-ratelimit-remaining");
  const rateReset = response.headers.get("x-ratelimit-reset");

  if (response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return {
        profileUrl: null,
        login: null,
        check: {
          ...base,
          status: "failed",
          observed: null,
          detail: "GitHub returned a response that could not be parsed.",
          durationMs,
          error: `HTTP ${response.status}`,
        },
      };
    }

    const data = (body ?? {}) as Record<string, unknown>;
    const login = typeof data.login === "string" ? data.login : null;
    const type = typeof data.type === "string" ? data.type : null;
    const created = typeof data.created_at === "string" ? data.created_at : null;
    const htmlUrl =
      typeof data.html_url === "string" && PROFILE_URL_PATTERN.test(data.html_url)
        ? data.html_url
        : login
          ? `https://github.com/${login}`
          : null;

    if (!login) {
      return {
        profileUrl: null,
        login: null,
        check: {
          ...base,
          status: "failed",
          observed: null,
          detail: "GitHub returned HTTP 200 without an account login in the response.",
          durationMs,
        },
      };
    }

    const fields: CheckResult["fields"] = [{ label: "Login", value: login }];
    if (type) fields.push({ label: "Account type", value: type });
    if (created) fields.push({ label: "Profile created (source-reported)", value: created });

    return {
      profileUrl: htmlUrl,
      login,
      check: {
        ...base,
        status: "completed",
        observed: `github.com/${login}`,
        fields,
        detail: `GitHub reports a public ${type ? type.toLowerCase() : "account"} with the login “${login}”.`,
        durationMs,
      },
    };
  }

  if (response.status === 404) {
    return {
      profileUrl: null,
      login: null,
      check: {
        ...base,
        status: "no_record",
        observed: null,
        detail: `GitHub returned 404: no public account with the login “${username}”.`,
        durationMs,
      },
    };
  }

  if (response.status === 403 || response.status === 429) {
    const exhausted = rateRemaining === "0";
    const resetText =
      exhausted && rateReset && !Number.isNaN(Number(rateReset))
        ? ` It resets at ${new Date(Number(rateReset) * 1000).toISOString().replace(".000Z", "Z")}.`
        : "";
    return {
      profileUrl: null,
      login: null,
      check: {
        ...base,
        status: "failed",
        observed: null,
        detail: exhausted
          ? `GitHub's unauthenticated rate limit (60 requests per hour per IP) is exhausted.${resetText}`
          : `GitHub refused the request (HTTP ${response.status}).`,
        durationMs,
        error: `HTTP ${response.status}`,
      },
    };
  }

  return {
    profileUrl: null,
    login: null,
    check: {
      ...base,
      status: "failed",
      observed: null,
      detail: `GitHub answered with HTTP ${response.status}, so this check produced no result.`,
      durationMs,
      error: `HTTP ${response.status}`,
    },
  };
}
