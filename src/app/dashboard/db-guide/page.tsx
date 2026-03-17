"use client";

import { Database, ShieldAlert, Code2 } from "lucide-react";

export default function DbGuidePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-primary/30 shadow-lg text-white">
           <Database className="w-6 h-6"/>
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-secondary-text tracking-tight">Estructura Supabase</h1>
          <p className="text-slate-500 mt-1">Documentación del esquema SQL PostgreSQL para desarrolladores.</p>
        </div>
      </div>

      <div className="card p-6 md:p-8 space-y-6 bg-slate-50">
         <div className="flex gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
           <ShieldAlert className="w-6 h-6 shrink-0"/>
           <div className="text-sm">
              <p className="font-bold mb-1">Row Level Security (RLS) Activado</p>
              <p>Por diseño, todas las arquitecturas de clínicas están segregadas lógicamente. Un token JWT válido con `clinic_id` es mandatorio en los headers para que la DB retorne datos.</p>
           </div>
         </div>

         <div className="space-y-3">
            <h3 className="font-bold text-lg flex items-center gap-2"><Code2 className="w-5 h-5 text-primary"/> Tablas Principales</h3>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-2 ml-2 font-medium">
               <li><strong className="text-secondary-text">clinics:</strong> Centros registrados.</li>
               <li><strong className="text-secondary-text">users:</strong> Psicólogos y admins, foreign key a auth.users.</li>
               <li><strong className="text-secondary-text">patients:</strong> Fichas clínicas con soft-delete.</li>
               <li><strong className="text-secondary-text">reports:</strong> Cabecera de informe y bloqueo transaccional si status es `final`.</li>
            </ul>
         </div>
         
         <div className="pt-4 border-t border-slate-200">
            <p className="text-[13px] text-slate-500">
              Para aplicar estos cambios reales en entorno en la nube, ejecuta <code className="bg-slate-200 px-1 rounded text-slate-700">supabase db push</code> utilizando la carpeta supabase/migrations del proyecto local.
            </p>
         </div>
      </div>
    </div>
  );
}
