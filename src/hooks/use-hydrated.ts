import { useEffect, useState } from "react";

/**
 * True after the first client render. Browser-storage views use it to avoid
 * rendering "nothing stored" before the local store has been read.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
