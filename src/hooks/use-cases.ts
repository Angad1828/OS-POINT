import { useSyncExternalStore } from "react";

import { getCasesServerSnapshot, getCasesSnapshot, subscribeCases } from "@/lib/case-store";
import type { CaseRecord } from "@/lib/osint/types";

export function useCases(): CaseRecord[] {
  return useSyncExternalStore(subscribeCases, getCasesSnapshot, getCasesServerSnapshot);
}

export function useCase(id: string): CaseRecord | undefined {
  return useCases().find((record) => record.id === id);
}
