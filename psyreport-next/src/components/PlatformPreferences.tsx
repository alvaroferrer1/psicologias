"use client";

import { useEffect, useSyncExternalStore, useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { Bell, Download, MonitorCog, Shield, Loader2, Volume2, Layers, Languages, Sun, Moon, Check } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { updatePlatformPreferences } from "@/app/actions/profile";
import { useUiPrefs, setUiPrefs, refreshUiPrefs, type UiPrefs, type Lang } from "@/lib/ui-store";
import { useT } from "@/lib/useT";

export type PlatformPreferenceState = {
  compactMode: boolean;
  remindersEnabled: boolean;
  exportJsonByDefault: boolean;
  privacyMode: boolean;
};

export function PlatformPreferences({ initial }: { initial: PlatformPreferenceState }) {
  const { toast } = useToast();
  const { t } = useT();
  const [preferences, setPreferences] = useState<PlatformPreferenceState>(initial);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  const ui = useUiPrefs();
  const { soundReminders, groupHistory } = ui;
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    const id = requestAnimationFrame(() => refreshUiPrefs());
    return () => cancelAnimationFrame(id);
  }, []);

  const updateLocal = (patch: Partial<UiPrefs>) => {
    setUiPrefs({ ...ui, ...patch });
  };

  const updatePreference = (key: keyof PlatformPreferenceState, opts?: { localOnly?: boolean; applyUiKey?: keyof UiPrefs }) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    if (opts?.applyUiKey) updateLocal({ [opts.applyUiKey]: next[key] } as Partial<UiPrefs>);
    startTransition(async () => {
      const result = await updatePlatformPreferences({ [key]: next[key] });
      if (!result.success) {
        setPreferences(preferences);
        toast({ type: "error", title: t("toast.prefsError") });
        return;
      }
      toast({ type: "success", title: t("toast.prefsUpdated") });
    });
  };

  const items = [
    {
      key: "compactMode" as const,
      applyUiKey: "compactMode" as keyof UiPrefs,
      title: t("pref.compact"),
      description: t("pref.compactDesc"),
      icon: MonitorCog,
    },
    {
      key: "remindersEnabled" as const,
      title: t("pref.reminders"),
      description: t("pref.remindersDesc"),
      icon: Bell,
    },
    {
      key: "exportJsonByDefault" as const,
      title: t("pref.exportJson"),
      description: t("pref.exportJsonDesc"),
      icon: Download,
    },
    {
      key: "privacyMode" as const,
      title: t("pref.privacy"),
      description: t("pref.privacyDesc"),
      icon: Shield,
    },
  ];

  const currentTheme = mounted ? theme : "light";

  return (
    <div className="card p-6">
      <h2 className="text-lg font-bold text-secondary-text">{t("pref.title")}</h2>
      <p className="mt-1 text-sm text-slate-500">{t("pref.subtitle")}</p>

      {/* Apariencia: tema claro/oscuro */}
      <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:bg-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm dark:bg-[var(--color-secondary-card)]">
            {currentTheme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </div>
          <div className="flex-1">
            <p className="font-bold text-secondary-text">{t("pref.appearance")}</p>
            <p className="mt-1 text-sm text-slate-500">{t("pref.appearanceDesc")}</p>
          </div>
          <div className="flex rounded-full border border-secondary-border bg-white p-1 dark:bg-[var(--color-secondary-card)]">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition-all ${currentTheme === "light" ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-primary"}`}
              aria-pressed={currentTheme === "light"}
            >
              <Sun className="h-4 w-4" /> {t("theme.light")}
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition-all ${currentTheme === "dark" ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-primary"}`}
              aria-pressed={currentTheme === "dark"}
            >
              <Moon className="h-4 w-4" /> {t("theme.dark")}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:bg-slate-800/40">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm dark:bg-[var(--color-secondary-card)]">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-secondary-text">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">{item.description}</p>
              </div>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => updatePreference(item.key, item.applyUiKey ? { applyUiKey: item.applyUiKey } : undefined)}
              aria-pressed={preferences[item.key]}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${preferences[item.key] ? "bg-primary" : "bg-slate-300"}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${preferences[item.key] ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        ))}

        {/* Toggles de interfaz local */}
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:bg-slate-800/40">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm dark:bg-[var(--color-secondary-card)]">
              <Volume2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-secondary-text">{t("pref.sound")}</p>
              <p className="mt-1 text-sm text-slate-500">{t("pref.soundDesc")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !soundReminders;
              updateLocal({ soundReminders: next });
            }}
            aria-pressed={soundReminders}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${soundReminders ? "bg-primary" : "bg-slate-300"}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${soundReminders ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:bg-slate-800/40">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm dark:bg-[var(--color-secondary-card)]">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-secondary-text">{t("pref.groupHistory")}</p>
              <p className="mt-1 text-sm text-slate-500">{t("pref.groupHistoryDesc")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !groupHistory;
              updateLocal({ groupHistory: next });
            }}
            aria-pressed={groupHistory}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${groupHistory ? "bg-primary" : "bg-slate-300"}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${groupHistory ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
