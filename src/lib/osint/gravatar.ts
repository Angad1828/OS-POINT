import { md5 } from "./md5";

/**
 * Gravatar avatar lookup.
 *
 * Gravatar maps an address to an avatar by the MD5 hash of the lower-cased,
 * trimmed address. `d=404` makes an unknown address return 404 instead of a
 * generic placeholder, which lets us distinguish "no avatar" from "found".
 *
 * An avatar is a source-reported artefact of the address, not evidence that
 * the address belongs to the person shown.
 */

const ENDPOINT = "https://gravatar.com/avatar/";
const TIMEOUT_MS = 8000;

export type AvatarStatus = "completed" | "no_record" | "failed";

export interface AvatarResult {
  status: AvatarStatus;
  /** MD5 hash used for the lookup — displayed for reproducibility. */
  hash: string;
  /** Direct avatar URL, only when an avatar exists. */
  url: string | null;
  requestUrl: string;
  detail: string;
  error?: string;
  durationMs: number;
}

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

export async function lookupGravatar(email: string): Promise<AvatarResult> {
  const hash = md5(email.trim().toLowerCase());
  const requestUrl = `${ENDPOINT}${hash}?s=200&d=404`;
  const started = performance.now();
  const timeout = withTimeout(TIMEOUT_MS);

  try {
    const response = await fetch(requestUrl, {
      signal: timeout.signal,
      cache: "no-store",
    });
    const durationMs = Math.round(performance.now() - started);

    if (response.status === 404) {
      return {
        status: "no_record",
        hash,
        url: null,
        requestUrl,
        detail:
          "Gravatar returned 404 for the MD5 hash of this address, so no public avatar is associated with it.",
        durationMs,
      };
    }

    if (response.status === 429) {
      return {
        status: "failed",
        hash,
        url: null,
        requestUrl,
        detail: "Gravatar rate-limited this request (HTTP 429).",
        error: "Rate limited",
        durationMs,
      };
    }

    if (!response.ok) {
      return {
        status: "failed",
        hash,
        url: null,
        requestUrl,
        detail: `Gravatar returned HTTP ${response.status}.`,
        error: `HTTP ${response.status}`,
        durationMs,
      };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      return {
        status: "failed",
        hash,
        url: null,
        requestUrl,
        detail: `Gravatar returned an unexpected content type (${contentType || "none"}).`,
        error: "Unexpected content type",
        durationMs,
      };
    }

    return {
      status: "completed",
      hash,
      url: requestUrl,
      requestUrl,
      detail: "Gravatar returned an avatar image for this address hash.",
      durationMs,
    };
  } catch (cause) {
    const durationMs = Math.round(performance.now() - started);
    const aborted = cause instanceof DOMException && cause.name === "AbortError";
    return {
      status: "failed",
      hash,
      url: null,
      requestUrl,
      detail: aborted
        ? `Gravatar did not answer within ${TIMEOUT_MS / 1000} seconds.`
        : "Gravatar could not be reached from this browser.",
      error: aborted ? "Timeout" : cause instanceof Error ? cause.message : "Network error",
      durationMs,
    };
  } finally {
    timeout.clear();
  }
}
