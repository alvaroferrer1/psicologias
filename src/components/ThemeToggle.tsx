"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useT } from "@/lib/useT";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useT();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? t("Cambiar a tema claro") : t("Cambiar a tema oscuro")}
      title={isDark ? t("Tema claro") : t("Tema oscuro")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-secondary-border bg-white text-primary shadow-sm transition-colors hover:bg-primary-light dark:bg-[var(--color-secondary-card)] dark:text-primary dark:hover:bg-primary/10"
    >
      {mounted && isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
}
