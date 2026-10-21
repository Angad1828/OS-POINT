/**
 * Domain registration data via RDAP.
 *
 * RDAP is the structured successor to WHOIS. Registries may rate limit,
 * refuse or not implement a query, and each of those outcomes is reported as
 * itself rather than as "no registration data".
 */

const RDAP_BASE = "https://rdap.org/domain/";
const TIMEOUT_MS = 12000;

export type RdapStatus = "completed" | "no_record" | "failed";

export interface RdapSummary {
  handle: string | null;
  registrar: string | null;
  registered: string | null;
  expires: string | null;
  lastChanged: string | null;
  nameservers: string[];
  statuses: string[];
}

export interface RdapResult {
  status: RdapStatus;
  summary: RdapSummary | null;
  detail: string;
  httpStatus: number | null;
  error?: string;
  durationMs: number;
  requestUrl: string;
  finalUrl: string | null;
}

interface VcardEntry extends Array<unknown> {
  0?: string;
  3?: unknown;
}

interface RdapEntity {
  roles?: string[];
  handle?: string;
  vcardArray?: [string, VcardEntry[]];
}

interface RdapEvent {
  eventAction?: string;
  eventDate?: string;
}

interface RdapResponse {
  handle?: string;
  ldhName?: string;
  status?: string[];
  events?: RdapEvent[];
  entities?: RdapEntity[];
  nameservers?: { ldhName?: string; unicodeName?: string }[];
}

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

function entityName(entity: RdapEntity | undefined): string | null {
  if (!entity) return null;
  const entries = entity.vcardArray?.[1] ?? [];
  const fn = entries.find((entry) => entry?.[0] === "fn");
  const value = fn?.[3];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function lookupRdap(domain: string): Promise<RdapResult> {
  const requestUrl = `${RDAP_BASE}${encodeURIComponent(domain)}`;
  const started = performance.now();
  const timeout = withTimeout(TIMEOUT_MS);

  try {
    const response = await fetch(requestUrl, {
      headers: { Accept: "application/rdap+json, application/json" },
      signal: timeout.signal,
      cache: "no-store",
    });
    const durationMs = Math.round(performance.now() - started);

    if (response.status === 404) {
      return {
        status: "no_record",
        summary: null,
        detail: "The registry returned 404: no RDAP object exists for this domain name.",
        httpStatus: 404,
        durationMs,
        requestUrl,
        finalUrl: response.url || null,
      };
    }

    if (response.status === 429) {
      return {
        status: "failed",
        summary: null,
        detail: "The registry rate-limited this request (HTTP 429). Try again later.",
        httpStatus: 429,
        error: "Rate limited",
        durationMs,
        requestUrl,
        finalUrl: response.url || null,
      };
    }

    if (!response.ok) {
      return {
        status: "failed",
        summary: null,
        detail: `The RDAP endpoint returned HTTP ${response.status}.`,
        httpStatus: response.status,
        error: `HTTP ${response.status}`,
        durationMs,
        requestUrl,
        finalUrl: response.url || null,
      };
    }

    let body: RdapResponse;
    try {
      body = (await response.json()) as RdapResponse;
    } catch {
      return {
        status: "failed",
        summary: null,
        detail: "The RDAP response was not valid JSON.",
        httpStatus: response.status,
        error: "Invalid JSON",
        durationMs,
        requestUrl,
        finalUrl: response.url || null,
      };
    }

    const events = Array.isArray(body.events) ? body.events : [];
    const eventDate = (action: string) =>
      events.find((event) => event.eventAction === action)?.eventDate?.slice(0, 10) ?? null;

    const registrar = (body.entities ?? []).find(
      (entity) => Array.isArray(entity.roles) && entity.roles.includes("registrar"),
    );

    const nameservers = (body.nameservers ?? [])
      .map((server) => server.ldhName ?? server.unicodeName ?? null)
      .filter((value): value is string => Boolean(value))
      .map((value) => value.replace(/\.$/, ""));

    const summary: RdapSummary = {
      handle: body.handle ?? null,
      registrar: entityName(registrar) ?? registrar?.handle ?? null,
      registered: eventDate("registration"),
      expires: eventDate("expiration"),
      lastChanged: eventDate("last changed") ?? eventDate("last update of RDAP database"),
      nameservers,
      statuses: Array.isArray(body.status) ? body.status : [],
    };

    return {
      status: "completed",
      summary,
      detail: "The registry returned a registration object.",
      httpStatus: response.status,
      durationMs,
      requestUrl,
      finalUrl: response.url || null,
    };
  } catch (cause) {
    const durationMs = Math.round(performance.now() - started);
    const aborted = cause instanceof DOMException && cause.name === "AbortError";
    return {
      status: "failed",
      summary: null,
      detail: aborted
        ? `The RDAP endpoint did not answer within ${TIMEOUT_MS / 1000} seconds.`
        : "The RDAP endpoint could not be reached from this browser.",
      httpStatus: null,
      error: aborted ? "Timeout" : cause instanceof Error ? cause.message : "Network error",
      durationMs,
      requestUrl,
      finalUrl: null,
    };
  } finally {
    timeout.clear();
  }
}
