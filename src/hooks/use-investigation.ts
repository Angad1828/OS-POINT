import { useCallback, useEffect, useRef, useState } from "react";

import { saveCase } from "@/lib/case-store";
import { runDomainInvestigation } from "@/lib/osint/domain";
import { runEmailInvestigation } from "@/lib/osint/email";
import type { CaseRecord, CheckResult } from "@/lib/osint/types";
import { runUsernameInvestigation } from "@/lib/osint/username";
import { normalizeDomain, normalizeEmail, normalizeUsername } from "@/lib/osint/validation";

export type InvestigationPhase = "idle" | "running" | "done" | "error";

export interface InvestigationState {
  phase: InvestigationPhase;
  checks: CheckResult[];
  total: number;
  record: CaseRecord | null;
  error: string | null;
}

export type InvestigationEntity = "email" | "domain" | "username";

export interface InvestigationOptions {
  /** Email only: also run the optional GitHub search for the local part. */
  usernameDiscovery?: boolean;
}

/** The known, defined task set behind the progress display. Never invented. */
const CHECK_COUNTS = {
  email: 13,
  domain: 12,
  username: 2,
} as const;

export function useInvestigation(
  entity: InvestigationEntity,
  initialTarget?: string,
  options: InvestigationOptions = {},
) {
  const usernameDiscovery = entity === "email" && options.usernameDiscovery === true;
  const total = CHECK_COUNTS[entity] + (usernameDiscovery ? 1 : 0);
  const [input, setInput] = useState(initialTarget ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [state, setState] = useState<InvestigationState>({
    phase: "idle",
    checks: [],
    total,
    record: null,
    error: null,
  });
  const running = useRef(false);

  useEffect(() => {
    if (initialTarget) setInput(initialTarget);
  }, [initialTarget]);

  const run = useCallback(
    async (raw?: string) => {
      if (running.current) return;
      const value = (raw ?? input).trim();
      const validation =
        entity === "email"
          ? normalizeEmail(value)
          : entity === "domain"
            ? normalizeDomain(value)
            : normalizeUsername(value);
      if (!validation.ok) {
        setFormError(validation.error);
        return;
      }

      setFormError(null);
      setSaveNotice(null);
      setInput(value);
      running.current = true;
      setState({ phase: "running", checks: [], total, record: null, error: null });

      const onCheck = (check: CheckResult) => {
        setState((previous) => ({
          ...previous,
          checks: [...previous.checks, check],
        }));
      };

      try {
        const record =
          entity === "email"
            ? await runEmailInvestigation(value, onCheck, { usernameDiscovery })
            : entity === "domain"
              ? await runDomainInvestigation(value, onCheck)
              : await runUsernameInvestigation(value, onCheck);

        setState({
          phase: "done",
          checks: record.checks,
          total,
          record,
          error: null,
        });

        const saved = saveCase(record);
        if (!saved.ok) setSaveNotice(saved.error ?? "The case could not be stored.");
      } catch (cause) {
        setState((previous) => ({
          ...previous,
          phase: "error",
          error:
            cause instanceof Error
              ? cause.message
              : "The investigation stopped before any checks could be recorded.",
        }));
      } finally {
        running.current = false;
      }
    },
    [entity, input, total, usernameDiscovery],
  );

  const reset = useCallback(() => {
    setState({ phase: "idle", checks: [], total, record: null, error: null });
    setFormError(null);
    setSaveNotice(null);
  }, [total]);
  return { input, setInput, formError, setFormError, state, run, reset, saveNotice, total };
}
