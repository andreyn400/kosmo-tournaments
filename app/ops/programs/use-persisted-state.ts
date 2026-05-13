"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useState that mirrors its value into window.localStorage under `key`.
 *
 * SSR-safe: initial render uses `initial`; localStorage is read in an effect
 * after mount and the state is replaced if a stored value exists. There's a
 * brief visual flicker possible if the stored value differs from `initial`,
 * which is acceptable for view preferences.
 */
export function usePersistedState<T>(
  key: string,
  initial: T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        // SSR-safe localStorage rehydration — setState in effect is the
        // canonical pattern; can't read window during render.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      // ignore
    }
    // Read once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(v));
        } catch {
          // ignore quota / privacy errors
        }
        return v;
      });
    },
    [key],
  );

  return [value, set];
}
