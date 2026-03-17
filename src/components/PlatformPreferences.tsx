"use client";

import { useState } from "react";
import { Bell, Download, MonitorCog, Shield } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

type PreferencesState = {
  compactMode: boolean;
  remindersEnabled: boolean;
  exportJsonByDefault: boolean;
  privacyMode: boolean;
};

const STORAGE_KEY = "psyreport_preferences";

export function PlatformPreferences() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<PreferencesState>(() => {
    if (typeof window === "undefined") {
      return {
        compactMode: false,
        remindersEnabled: true,
        exportJsonByDefault: true,
        privacyMode: false,
      };
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        compactMode: false,
        remindersEnabled: true,
        exportJsonByDefault: true,
        privacyMode: false,
      };
    }

    try {
      return JSON.parse(raw) as PreferencesState;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return {
        compactMode: false,
        remindersEnabled: true,
        exportJsonByDefault: true,
        privacyMode: false,
      };
    }
  });

  const updatePreference = (key: keyof PreferencesState) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    toast({ type: "success", title: "Preferencias actualizadas." });
  };

  const items = [
    {
      key: "compactMode" as const,
      title: "Modo compacto",
      description: "Reduce espacios en listados y paneles para ver mas informacion.",
      icon: MonitorCog,
    },
    {
      key: "remindersEnabled" as const,
      title: "Recordatorios internos",
      description: "Mantiene activas las alertas visuales de borradores y citas proximas.",
      icon: Bell,
    },
    {
      key: "exportJsonByDefault" as const,
      title: "Exportacion estructurada",
      description: "Prioriza formatos completos para expediente y copias de seguridad.",
      icon: Download,
    },
    {
      key: "privacyMode" as const,
      title: "Modo privacidad",
      description: "Piensado para entornos compartidos y minimiza datos visibles en pantalla.",
      icon: Shield,
    },
  ];

  return (
    <div className="card p-6">
      <h2 className="text-lg font-bold text-secondary-text">Preferencias de plataforma</h2>
      <p className="mt-1 text-sm text-slate-500">Ajustes rapidos de visualizacion, avisos y privacidad del puesto de trabajo.</p>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-secondary-text">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">{item.description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => updatePreference(item.key)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${preferences[item.key] ? "bg-primary" : "bg-slate-300"}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${preferences[item.key] ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
