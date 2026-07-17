"use client";

import { Database, ShieldAlert, Code2 } from "lucide-react";
import { useT } from "@/lib/useT";

export default function DbGuidePage() {
  const { t } = useT();
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-primary/30 shadow-lg text-white">
           <Database className="w-6 h-6"/>
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-secondary-text tracking-tight">{t("Guía de la base de datos")}</h1>
          <p className="text-slate-500 mt-1">{t("Estructura y relaciones de los datos.")}</p>
        </div>
      </div>

      <div className="card p-6 md:p-8 space-y-6 bg-slate-50">
         <div className="flex gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
           <ShieldAlert className="w-6 h-6 shrink-0"/>
           <div className="text-sm">
               <p className="font-bold mb-1">{t("Tablas principales")}</p>
               <p>{t("La base de datos guarda la información de la clínica.")}</p>
           </div>
         </div>

         <div className="space-y-3">
            <h3 className="font-bold text-lg flex items-center gap-2"><Code2 className="w-5 h-5 text-primary"/> {t("Entidades")}</h3>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-2 ml-2 font-medium">
               <li><strong className="text-secondary-text">clinics:</strong> {t("Datos de la clínica y configuración.")}</li>
               <li><strong className="text-secondary-text">users:</strong> {t("Usuarios y profesionales.")}</li>
               <li><strong className="text-secondary-text">patients:</strong> {t("Pacientes y sus fichas.")}</li>
               <li><strong className="text-secondary-text">reports:</strong> {t("Informes clínicos.")}</li>
            </ul>
         </div>
         
         <div className="pt-4 border-t border-slate-200">
            <p className="text-[13px] text-slate-500">
               {t("Consulta segura mediante la API del servidor.")}
            </p>
         </div>
      </div>
    </div>
  );
}
