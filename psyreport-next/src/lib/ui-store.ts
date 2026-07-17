"use client";

import { useSyncExternalStore } from "react";

export type Lang = "es" | "en";

export const LANGS: { value: Lang; label: string }[] = [
  { value: "es", label: "Español" },
];

const LOCAL_KEY = "psyreport.ui";
const VERSION_KEY = "psyreport.ui.v";
const UI_VERSION = "5";
const DEFAULT_UI = { soundReminders: false, groupHistory: false, language: "es" as Lang, compactMode: false };

export type UiPrefs = typeof DEFAULT_UI;

let cachedUi: UiPrefs = DEFAULT_UI;
const listeners = new Set<() => void>();

function migrate() {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(VERSION_KEY) !== UI_VERSION) {
      localStorage.removeItem(LOCAL_KEY);
      localStorage.setItem(VERSION_KEY, UI_VERSION);
    }
  } catch {
    /* ignore */
  }
}

function readUi(): UiPrefs {
  if (typeof window === "undefined") return DEFAULT_UI;
  migrate();
  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}");
    const lang: Lang = stored.language === "en" ? "en" : "es";
    return {
      soundReminders: Boolean(stored.soundReminders),
      groupHistory: Boolean(stored.groupHistory),
      language: lang,
      compactMode: Boolean(stored.compactMode),
    };
  } catch {
    return DEFAULT_UI;
  }
}

function emit() {
  cachedUi = readUi();
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  listeners.add(callback);
  window.addEventListener("storage", emit);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", emit);
  };
}

export function useUiPrefs(): UiPrefs {
  return useSyncExternalStore(subscribe, () => cachedUi, () => cached_UI_SSR);
}

const cached_UI_SSR = DEFAULT_UI;

export function setUiPrefs(patch: Partial<UiPrefs>) {
  if (typeof window === "undefined") return;
  const next = { ...readUi(), ...patch };
  localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  if (typeof next.language === "string") {
    const safe = ALLOWED_LANGS.has(next.language) ? next.language : "es";
    applyDocumentLang(safe);
    try {
      document.cookie = `psyreport_ui_lang=${safe}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      /* ignore */
    }
  }
  emit();
}

const ALLOWED_LANGS = new Set(["es"]);

function applyDocumentLang(lang: string) {
  if (typeof document === "undefined") return;
  const safe = ALLOWED_LANGS.has(lang) ? lang : "es";
  document.documentElement.setAttribute("lang", safe);
}

export function refreshUiPrefs() {
  emit();
}

export function getLang(): Lang {
  if (typeof window === "undefined") return "es";
  return readUi().language;
}

export function getServerLang(cookieHeader?: string | null): Lang {
  const match = cookieHeader?.match(/(?:^|;\s*)psyreport_ui_lang=([^;]+)/);
  const value = match?.[1];
  return value === "en" ? "en" : "es";
}
