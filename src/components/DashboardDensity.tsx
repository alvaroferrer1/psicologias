"use client";

import { ReactNode } from "react";
import { useUiPrefs } from "@/lib/ui-store";

export function DashboardDensity({ children }: { children: ReactNode }) {
  const { compactMode } = useUiPrefs();
  return <div className={compactMode ? "compact-mode" : undefined}>{children}</div>;
}
