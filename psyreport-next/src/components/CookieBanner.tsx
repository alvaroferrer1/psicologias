"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { useT } from "@/lib/useT";

export function CookieBanner() {
  const { t } = useT();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("psyreport_cookies_accepted");
    if (accepted) return;

    const frame = window.requestAnimationFrame(() => setShow(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 text-white p-4 sm:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-center gap-4 animate-in slide-in-from-bottom-10 duration-500">
      <div className="flex items-start gap-3 max-w-3xl">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
           <Shield className="w-5 h-5 text-primary" />
        </div>
        <div className="text-sm text-slate-300 leading-relaxed">
            <p className="font-bold text-white text-base mb-1">{"Configuración de cookies"}</p>
            <p>
              {"Usamos cookies para"} <Link href="/cookies" className="text-primary hover:text-white font-bold underline underline-offset-2 transition-colors">{"política de cookies"}</Link> {"y la"} <Link href="/privacy" className="text-primary hover:text-white font-bold underline underline-offset-2 transition-colors">{"política de privacidad"}</Link>.
            </p>
        </div>
      </div>
      <div className="flex gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0">
        <button 
          onClick={() => { localStorage.setItem("psyreport_cookies_accepted", "true"); setShow(false); }} 
          className="btn btn-primary w-full md:w-auto shadow-lg shadow-primary/20"
        >
          {"Aceptar"}
        </button>
      </div>
    </div>
  );
}
