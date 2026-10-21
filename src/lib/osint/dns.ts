import type { DnsRecordValue } from "./types";

/**
 * DNS-over-HTTPS client for Google Public DNS.
 *
 * Every query resolves to a status. A transport failure, an empty answer and
 * an NXDOMAIN response are deliberately kept distinct so the UI never renders
 * a failure as a negative finding.
 */

const DOH_ENDPOINT = "https://dns.google/resolve";
const TIMEOUT_MS = 8000;

const TYPE_NAMES: Record<number, string> = {
  1: "A",
  2: "NS",
  5: "CNAME",
  6: "SOA",
  12: "PTR",
  13: "HINFO",
  15: "MX",
  16: "TXT",
  17: "RP",
  28: "AAAA",
  35: "NAPTR",
  39: "DNAME",
  43: "DS",
  46: "RRSIG",
  48: "DNSKEY",
  64: "SVCB",
  65: "HTTPS",
  99: "SPF",
  257: "CAA",
};

const RCODE_NAMES: Record<number, string> = {
  0: "NOERROR",
  1: "FORMERR",
  2: "SERVFAIL",
  3: "NXDOMAIN",
  4: "NOTIMP",
  5: "REFUSED",
};

export type DnsLookupStatus = "completed" | "no_record" | "failed";

export interface DnsLookupResult {
  status: DnsLookupStatus;
  records: DnsRecordValue[];
  rcode: number | null;
  /** Human-readable account of what the resolver returned. */
  detail: string;
  error?: string;
  durationMs: number;
  requestUrl: string;
}

interface DohAnswer {
  name?: string;
  type?: number;
  TTL?: number;
  data?: string;
}

interface DohResponse {
  Status?: number;
  Answer?: DohAnswer[];
  Comment?: string;
}

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

export function dnsRequestUrl(name: string, type: string): string {
  return `${DOH_ENDPOINT}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
}

export async function lookupDns(name: string, type: string): Promise<DnsLookupResult> {
  const requestUrl = dnsRequestUrl(name, type);
  const started = performance.now();
  const timeout = withTimeout(TIMEOUT_MS);

  try {
    const response = await fetch(requestUrl, {
      headers: { Accept: "application/dns-json" },
      signal: timeout.signal,
      cache: "no-store",
    });
    const durationMs = Math.round(performance.now() - started);

    if (!response.ok) {
      return {
        status: "failed",
        records: [],
        rcode: null,
        detail: `The resolver returned HTTP ${response.status}.`,
        error: `HTTP ${response.status}`,
        durationMs,
        requestUrl,
      };
    }

    const body = (await response.json()) as DohResponse;
    const rcode = typeof body.Status === "number" ? body.Status : null;
    const answers = Array.isArray(body.Answer) ? body.Answer : [];
    const records: DnsRecordValue[] = answers
      .filter((answer) => typeof answer.data === "string")
      .map((answer) => {
        const raw = String(answer.data).trim();
        // A null MX is exactly "0 ." — the dot is the root target and carries meaning.
        const isNullMx = /^\d+\s+\.$/.test(raw);
        return {
          type:
            (answer.type !== undefined ? TYPE_NAMES[answer.type] : undefined) ?? type.toUpperCase(),
          data: isNullMx ? raw : raw.replace(/\.$/, ""),
          ttl: typeof answer.TTL === "number" ? answer.TTL : 0,
        };
      });

    if (rcode !== null && rcode !== 0 && rcode !== 3) {
      return {
        status: "failed",
        records,
        rcode,
        detail: `The resolver returned DNS status ${RCODE_NAMES[rcode] ?? rcode}.`,
        error: RCODE_NAMES[rcode] ?? `rcode ${rcode}`,
        durationMs,
        requestUrl,
      };
    }

    if (records.length > 0) {
      return {
        status: "completed",
        records,
        rcode,
        detail: `${records.length} ${type.toUpperCase()} record${records.length === 1 ? "" : "s"} returned.`,
        durationMs,
        requestUrl,
      };
    }

    if (rcode === 3) {
      return {
        status: "no_record",
        records,
        rcode,
        detail: "NXDOMAIN — the resolver reports that this name does not exist.",
        durationMs,
        requestUrl,
      };
    }

    return {
      status: "no_record",
      records,
      rcode,
      detail: `No ${type.toUpperCase()} records were returned for this name.`,
      durationMs,
      requestUrl,
    };
  } catch (cause) {
    const durationMs = Math.round(performance.now() - started);
    const aborted = cause instanceof DOMException && cause.name === "AbortError";
    return {
      status: "failed",
      records: [],
      rcode: null,
      detail: aborted
        ? `The resolver did not answer within ${TIMEOUT_MS / 1000} seconds.`
        : "The resolver could not be reached from this browser.",
      error: aborted ? "Timeout" : cause instanceof Error ? cause.message : "Network error",
      durationMs,
      requestUrl,
    };
  } finally {
    timeout.clear();
  }
}

/** DNS record data is quoted for TXT answers; strip the presentation quotes. */
export function unquoteTxt(value: string): string {
  return value.replace(/^"|"$/g, "").replace(/"\s+"/g, "");
}

export function formatRecords(records: DnsRecordValue[]): string {
  if (records.length === 0) return "—";
  return records.map((record) => record.data).join(" · ");
}
