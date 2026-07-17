"use client";
import Image from "next/image";
import { useT } from "@/lib/useT";

export function LockScreen() {
  const { t } = useT();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center dark:bg-slate-950">
      <div className="relative mb-8 h-24 w-24 overflow-hidden rounded-2xl shadow-xl grayscale-100 opacity-50">
           <Image
           src="/emotiva-logo.png"
            alt={t("Candado de seguridad")}
           fill
           className="object-contain p-2"
         />
      </div>
      
      <div className="max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-11a4 4 0 11-8 0 4 4 0 018 0zM7 10V7a5 5 0 0110 0v3m2 0H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2z"
            />
          </svg>
        </div>
        
         <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
           {t("Sesión bloqueada")}
         </h1>
        
         <p className="text-slate-600 dark:text-slate-400 lg:text-lg">
           {t("Introduce tu contraseña para continuar.")}
         </p>

         <div className="mt-6 rounded-xl bg-slate-50 p-6 font-semibold text-slate-900 dark:bg-slate-800/50 dark:text-slate-100 border border-slate-100 dark:border-slate-700 shadow-sm">
           {t("Desbloquear")}
         </div>
        
        <div className="pt-4 text-xs font-mono uppercase tracking-widest text-slate-400">
          PsyReport v0.1.0 &bull; System Locked
        </div>
      </div>
      
      <footer className="mt-12 text-sm text-slate-500">
        &copy; {new Date().getFullYear()} PsyReport. Todos los derechos reservados.
      </footer>
    </div>
  );
}
