"use client";

import { Activity, Database, ShieldCheck, Trash2 } from "lucide-react";
import { useT } from "@/lib/useT";

export function SettingsInfoCards() {
  const { t } = useT();
  const cards = [
    {
      title: "Papelera",
      description: "Recupera o elimina definitivamente pacientes y documentos.",
      icon: Trash2,
    },
    {
      title: "Seguridad",
      description: "Revisa contraseñas, sesiones y accesos.",
      icon: ShieldCheck,
    },
    {
      title: "Actividad",
      description: "Consulta el registro de auditoría.",
      icon: Activity,
    },
    {
      title: "Base de datos",
      description: "Estado y mantenimiento de la información.",
      icon: Database,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((card) => (
        <div key={card.title} className="card p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-light text-primary">
            <card.icon className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-extrabold text-secondary-text">{card.title}</h3>
          <p className="mt-2 text-sm text-slate-500">{card.description}</p>
        </div>
      ))}
    </div>
  );
}
