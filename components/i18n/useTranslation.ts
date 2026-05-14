"use client";

import { useContext } from "react";
import {
  LanguageContext,
  type LanguageContextValue,
} from "./LanguageProvider";

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useTranslation must be used inside <LanguageProvider>");
  }
  return ctx;
}
