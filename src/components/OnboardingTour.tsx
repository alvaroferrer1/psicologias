"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from "lucide-react";
import { useT } from "@/lib/useT";

type Step = {
  title: string;
  description: string;
  icon: string;
};

const STORAGE_KEY = "emotiva_onboarding_done";

export function OnboardingTour() {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const STEPS: Step[] = [
    {
      title: "Bienvenido a PsyReport",
      description: "Gestiona tu clínica desde un panel claro.",
      icon: "🏠",
    },
    {
      title: "Pacientes",
      description: "Crea y organiza tus fichas de paciente.",
      icon: "👥",
    },
    {
      title: "Informes",
      description: "Genera informes clínicos profesionales.",
      icon: "📝",
    },
    {
      title: "Citas",
      description: "Agenda y videoconsultas en un lugar.",
      icon: "📅",
    },
    {
      title: "Configuración",
      description: "Ajusta tu cuenta, apariencia y seguridad.",
      icon: "⚙️",
    },
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = window.localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const timer = window.setTimeout(() => setOpen(true), 600);
      return () => window.clearTimeout(timer);
    }
  }, []);

  const finish = () => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-[24px] bg-white shadow-2xl"
          >
            <button
              onClick={finish}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label={"Cerrar"}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="h-2 w-full bg-slate-100">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary-dark"
                initial={false}
                animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-2xl">
                  {STEPS[step].icon}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                  <Sparkles className="h-4 w-4" />
                  {"Paso"} {step + 1} {"de"} {STEPS.length}
                </div>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-secondary-text">
                {STEPS[step].title}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-500">
                {STEPS[step].description}
              </p>

              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="btn btn-ghost disabled:opacity-40"
                  type="button"
                >
                   <ArrowLeft className="h-4 w-4" /> {"Atrás"}
                </button>

                {isLast ? (
                  <button onClick={finish} className="btn btn-primary" type="button">
                     <Check className="h-4 w-4" /> {"Empezar"}
                  </button>
                ) : (
                  <button
                    onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                    className="btn btn-primary"
                    type="button"
                  >
                     {"Siguiente"} <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
