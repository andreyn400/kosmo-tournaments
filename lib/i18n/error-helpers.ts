import type { TranslationKey } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/ru";

export type FieldError = {
  key: TranslationKey;
  vars?: Record<string, string | number>;
};

export const fieldErr = (
  key: TranslationKey,
  vars?: Record<string, string | number>,
): FieldError => ({ key, vars });

/** Resolve a FieldError to a localized string using a preloaded dictionary. */
export function resolveErrorWithDict(
  err: FieldError,
  dict: Dictionary,
): string {
  let template: string = dict[err.key];
  if (err.vars) {
    for (const [k, v] of Object.entries(err.vars)) {
      template = template.replace(`{${k}}`, String(v));
    }
  }
  return template;
}
