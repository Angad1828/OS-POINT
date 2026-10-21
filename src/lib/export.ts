import type { CaseRecord } from "./osint/types";

/**
 * Exports are generated from the stored case model, never scraped from the
 * rendered interface. CSV cells are quoted and values that a spreadsheet could
 * interpret as a formula are prefixed with an apostrophe.
 */

function safeCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export function caseToJson(record: CaseRecord): string {
  return `${JSON.stringify(record, null, 2)}\n`;
}

const CSV_HEADER = [
  "section",
  "record_id",
  "label",
  "value",
  "status",
  "source",
  "retrieved_at",
  "detail",
  "limitation",
];

export function caseToCsv(record: CaseRecord): string {
  const rows: (string | number | null | undefined)[][] = [CSV_HEADER];

  const add = (
    section: string,
    recordId: string,
    label: string,
    value: string,
    status = "",
    source = "",
    retrievedAt = "",
    detail = "",
    limitation = "",
  ) => {
    rows.push([section, recordId, label, value, status, source, retrievedAt, detail, limitation]);
  };

  add("case", record.id, "target", record.target, record.status, "", record.createdAt);
  add("case", record.id, "normalised", record.normalized, "", "", record.createdAt);
  add("case", record.id, "entity_type", record.entityType, "", "", record.createdAt);
  add("case", record.id, "completed_at", "", "", "", record.completedAt);
  add("case", record.id, "summary", record.summary, "", "", record.completedAt);
  add(
    "case",
    record.id,
    "tool_version",
    record.toolVersion,
    "",
    "",
    record.completedAt,
    "",
    "Rule-based collection; no AI model was used.",
  );

  for (const check of record.checks) {
    const value = check.records?.length
      ? check.records.map((row) => `${row.type} ${row.data} (TTL ${row.ttl})`).join(" | ")
      : (check.observed ?? check.detail ?? "");
    rows.push([
      "check",
      check.id,
      check.label,
      value,
      check.status,
      check.source?.url ?? "",
      check.retrievedAt,
      check.detail ?? "",
      check.limitation ?? "",
    ]);
  }

  for (const finding of record.findings) {
    rows.push([
      "finding",
      finding.id,
      finding.classification,
      finding.statement,
      finding.classification,
      finding.checkIds.join(" "),
      record.completedAt,
      "",
      finding.limitation ?? "",
    ]);
  }

  for (const rel of record.relationships) {
    rows.push([
      "relationship",
      rel.id,
      `${rel.from.label} -> ${rel.to.label}`,
      `${rel.type}: ${rel.explanation}`,
      rel.classification,
      rel.evidenceIds.join(" "),
      record.completedAt,
      "",
      rel.limitation ?? "",
    ]);
  }

  if (record.notes.trim()) {
    rows.push([
      "notes",
      record.id,
      "analyst_notes",
      record.notes,
      "",
      "",
      record.notesUpdatedAt ?? record.completedAt,
      "",
      "",
    ]);
  }

  return `\uFEFF${rows.map((row) => row.map(safeCell).join(",")).join("\r\n")}\r\n`;
}

function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function exportCaseJson(record: CaseRecord): void {
  download(`${record.id}.json`, caseToJson(record), "application/json;charset=utf-8");
}

export function exportCaseCsv(record: CaseRecord): void {
  download(`${record.id}.csv`, caseToCsv(record), "text/csv;charset=utf-8");
}
