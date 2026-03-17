"use client";

import { useEffect, useState } from "react";
import type { Patient } from "@prisma/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Baby, User, Users, GraduationCap, FileHeart, FilePlus2, Sparkles } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { getPatients } from "@/app/actions/patients";
import { useToast } from "@/components/ToastProvider";

export default function NewReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("adulto");

  useEffect(() => {
    getPatients().then((data) => {
      setPatients(data);
      if (data.length > 0) setSelectedPatient(data[0].id);
    });
  }, []);

  const handleManualDraft = () => {
    if (!selectedPatient) {
      toast({ type: "info", title: "Selecciona un paciente antes de continuar." });
      return;
    }

    router.push(`/dashboard/new-report/editor?patient=${selectedPatient}&template=${selectedTemplate}`);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/dashboard");
  };

  const templates = [
    { id: "infantil", label: "Infantil", desc: "Hasta los 12 años", icon: Baby, color: "text-sky-500", bg: "bg-sky-50", border: "border-sky-100", hover: "hover:border-sky-500 hover:shadow-sky-500/20" },
    { id: "adolescente", label: "Adolescente", desc: "De 13 a 17 años", icon: User, color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100", hover: "hover:border-indigo-500 hover:shadow-indigo-500/20" },
    { id: "adulto", label: "Adulto", desc: "A partir de 18 años", icon: User, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100", hover: "hover:border-emerald-500 hover:shadow-emerald-500/20" },
    { id: "pareja", label: "Pareja", desc: "Terapia conjunta", icon: FileHeart, color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100", hover: "hover:border-rose-500 hover:shadow-rose-500/20" },
    { id: "familia", label: "Familia", desc: "Núcleo familiar", icon: Users, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100", hover: "hover:border-amber-500 hover:shadow-amber-500/20" },
    { id: "escolar", label: "Escolar", desc: "Informe psicopedagógico", icon: GraduationCap, color: "text-teal-500", bg: "bg-teal-50", border: "border-teal-100", hover: "hover:border-teal-500 hover:shadow-teal-500/20" },
  ];

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div className="relative mx-auto max-w-5xl space-y-6">
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={handleBack} className="btn btn-ghost btn-icon rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-secondary-text md:text-3xl">Nuevo Informe</h1>
          <p className="mt-1 text-slate-500">Selecciona la plantilla clínica para empezar a redactar.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-secondary-border bg-white p-6 shadow-sm">
        <div className="card mb-6 flex flex-col gap-4 border-emerald-100 bg-emerald-50/50 p-5 sm:flex-row sm:items-center">
          <h4 className="min-w-[200px] text-sm font-bold text-slate-700">1. Asignar paciente:</h4>
          <select
            className="w-full flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            disabled={patients.length === 0}
          >
            {patients.length === 0 && <option value="">Sin pacientes registrados</option>}
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name} ({patient.description})
              </option>
            ))}
          </select>
        </div>

        <h3 className="mb-6 flex items-center gap-2 text-lg font-bold">
          <FilePlus2 className="h-5 w-5 text-primary" />
          2. Seleccionar plantilla
        </h3>

        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <motion.div
              variants={item}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedTemplate(tpl.id)}
              key={tpl.id}
              className={`group relative cursor-pointer rounded-2xl border-2 bg-white p-5 transition-all duration-300 hover:shadow-xl ${
                selectedTemplate === tpl.id ? "border-primary ring-4 ring-primary/10" : tpl.border
              } ${tpl.hover}`}
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${tpl.bg}`}>
                <tpl.icon className={`h-6 w-6 ${tpl.color}`} />
              </div>
              <h4 className="text-lg font-bold text-secondary-text transition-colors group-hover:text-primary">{tpl.label}</h4>
              <p className="mt-1 text-sm font-medium text-slate-500">{tpl.desc}</p>

              <div
                className={`absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                  selectedTemplate === tpl.id ? "border-primary bg-primary" : "border-slate-100 group-hover:border-primary group-hover:bg-primary"
                }`}
              >
                <div className={`h-2.5 w-2.5 rounded-full transition-colors ${selectedTemplate === tpl.id ? "bg-white" : "bg-slate-200 group-hover:bg-white"}`} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-8 flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
          <button
            onClick={handleManualDraft}
            disabled={patients.length === 0}
            className="btn btn-primary flex w-full justify-center px-8 py-3 text-[15px] shadow-lg shadow-primary/20 sm:w-auto"
            type="button"
          >
            Comenzar edición manual <Sparkles className="ml-1 h-4 w-4 opacity-70" />
          </button>
        </div>
      </div>
    </div>
  );
}
