import { CASE_SCHEMA_VERSION, LEGACY_CASE_SCHEMA_VERSION, type CaseRecord } from "./osint/types";

/**
 * Case persistence for the browser.
 *
 * Storage is deliberately simple and local: cases live in localStorage, are
 * not encrypted, and are not shared across devices or analysts. The schema is
 * versioned so a future store can migrate records instead of guessing.
 */

const STORAGE_KEY = "osp.cases.v2";
const MAX_CASES = 100;
const EMPTY: CaseRecord[] = [];

let cache: CaseRecord[] | null = null;
let storageWorking = true;
const listeners = new Set<() => void>();

/**
 * Validates a stored value and migrates older schema versions on read.
 * Stored data is untrusted, so the shape is checked field by field.
 */
function migrateCase(value: unknown): CaseRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<CaseRecord> & { schemaVersion?: number };
  const shapeOk =
    typeof record.id === "string" &&
    typeof record.target === "string" &&
    typeof record.normalized === "string" &&
    (record.entityType === "email" ||
      record.entityType === "domain" ||
      record.entityType === "username") &&
    typeof record.createdAt === "string" &&
    Array.isArray(record.checks) &&
    Array.isArray(record.findings);
  if (!shapeOk) return null;

  if (record.schemaVersion === CASE_SCHEMA_VERSION) {
    return Array.isArray(record.relationships) ? (record as CaseRecord) : null;
  }

  // v2 records predate the relationship field: migrate them on read instead of
  // dropping the analyst's saved cases. They carry no relationships, so an
  // empty list is the truthful migration.
  if (record.schemaVersion === LEGACY_CASE_SCHEMA_VERSION) {
    const legacy = record as unknown as CaseRecord;
    return { ...legacy, schemaVersion: CASE_SCHEMA_VERSION, relationships: [] };
  }
  return null;
}

function read(): CaseRecord[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return EMPTY;
    const records = parsed
      .map(migrateCase)
      .filter((record): record is CaseRecord => record !== null);
    return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    storageWorking = false;
    return EMPTY;
  }
}

function write(records: CaseRecord[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    storageWorking = true;
    return true;
  } catch {
    storageWorking = false;
    return false;
  }
}

function notify() {
  for (const listener of listeners) listener();
}

function snapshot(): CaseRecord[] {
  if (cache === null) cache = read();
  return cache;
}

export function subscribeCases(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCasesSnapshot(): CaseRecord[] {
  return snapshot();
}

export function getCasesServerSnapshot(): CaseRecord[] {
  return EMPTY;
}

export function isStorageAvailable(): boolean {
  snapshot();
  return storageWorking;
}

export function getCase(id: string): CaseRecord | undefined {
  return snapshot().find((record) => record.id === id);
}

export interface SaveResult {
  ok: boolean;
  error?: string;
}

export function saveCase(record: CaseRecord): SaveResult {
  const existing = snapshot();
  const next = [record, ...existing.filter((item) => item.id !== record.id)]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_CASES);
  cache = next;
  notify();
  if (!write(next)) {
    return {
      ok: false,
      error:
        "This case is visible for the current session but could not be written to browser storage. Export it before closing the tab.",
    };
  }
  return { ok: true };
}

export function updateCaseNotes(id: string, notes: string): SaveResult {
  const existing = snapshot();
  if (!existing.some((record) => record.id === id)) {
    return { ok: false, error: "Case not found in this browser." };
  }
  const next = existing.map((record) =>
    record.id === id ? { ...record, notes, notesUpdatedAt: new Date().toISOString() } : record,
  );
  cache = next;
  notify();
  if (!write(next)) {
    return { ok: false, error: "Notes could not be written to browser storage." };
  }
  return { ok: true };
}

export function deleteCase(id: string): SaveResult {
  const existing = snapshot();
  const next = existing.filter((record) => record.id !== id);
  cache = next;
  notify();
  if (!write(next)) {
    return { ok: false, error: "The case could not be removed from browser storage." };
  }
  return { ok: true };
}

/** Test seam: drop the in-memory cache so the next read hits storage again. */
export function resetCaseStoreForTests(): void {
  cache = null;
}
