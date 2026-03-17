import { Activity, Database, ShieldCheck, Trash2 } from "lucide-react";

export function SettingsInfoCards() {
  const cards = [
    {
      title: "Papelera clinica",
      description: "Archiva pacientes sin borrar su expediente y restauralos despues desde la papelera.",
      icon: Trash2,
    },
    {
      title: "Seguridad activa",
      description: "Las sesiones son persistentes y puedes cerrarlas desde este panel cuando necesites.",
      icon: ShieldCheck,
    },
    {
      title: "Estado del sistema",
      description: "La app dispone de endpoint de salud y trazabilidad de actividad en base de datos.",
      icon: Activity,
    },
    {
      title: "Datos estructurados",
      description: "Informes versionados, consentimientos, notas y documentos ya forman parte del expediente.",
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
