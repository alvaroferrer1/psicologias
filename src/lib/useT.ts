"use client";

import { useCallback } from "react";
import { useUiPrefs, type Lang } from "@/lib/ui-store";
import { translate } from "@/lib/i18n";

export type TFunc = (key: string) => string;

export function useT(): { t: TFunc; lang: Lang } {
  const lang: Lang = "es";
  const t = useCallback((key: string) => translate(lang, key), [lang]);
  return { t, lang };
}
