import { cookies } from "next/headers";
import { translate, type Lang } from "@/lib/i18n";

async function readLangFromCookies(): Promise<Lang> {
  try {
    const store = await cookies();
    const value = store.get("psyreport_ui_lang")?.value;
    return value === "en" ? "en" : "es";
  } catch {
    return "es";
  }
}

export async function getServerLang(): Promise<Lang> {
  return readLangFromCookies();
}

export async function getServerT(): Promise<{ t: (key: string) => string; lang: Lang }> {
  const lang = await readLangFromCookies();
  return { t: (key: string) => translate(lang, key), lang };
}
