"use client";

import { useEffect, useMemo, useState } from "react";
import type { Patient } from "@prisma/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileHeart, FilePlus2, NotebookTabs, ScrollText, Sparkles } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { getPatients } from "@/app/actions/patients";
import { useToast } from "@/components/ToastProvider";
import { getPatientCategoryLabel, type PatientCategory, type ReportKind } from "@/lib/report-templates";

const KIND_OPTIONS: Array<{
  id: ReportKind;
  label: string;
  desc: string;
  icon: typeof NotebookTabs;
  color: string;
  bg: string;
  border: string;
}> = [
  { id: "historia_clinica", label: "Historia clinica", desc: "Anamnesis y recogida clinica inicial", icon: NotebookTabs, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  { id: "informe", label: "Informe", desc: "Informe psicologico con resultados y areas", icon: FileHeart, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
  { id: "registro", label: "Reporte", desc: "Seguimiento breve del proceso terapeutico", icon: ScrollText, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100" },
];

const CATEGORY_OPTIONS: PatientCategory[] = ["infantil", "adolescente", "adulto", "pareja", "familia"];

export default function NewReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedKind, setSelectedKind] = useState<ReportKind>("informe");
  const [selectedCategory, setSelectedCategory] = useState<PatientCategory>("adulto");

  useEffect(() => {
    getPatients().then((data) => {
      setPatients(data);
      if (data.length > 0) {
        setSelectedPatient(data[0].id);
        setSelectedCategory((data[0].patientType as PatientCategory) || "adulto");
      }
    });
  }, []);

  const selectedPatientRecord = useMemo(
    () => patients.find((patient) => patient.id === selectedPatient),
    [patients, selectedPatient]
  );

  const handlePatientChange = (patientId: string) => {
    setSelectedPatient(patientId);
    const patient = patients.find((item) => item.id === patientId);
    if (patient?.patientType) {
      setSelectedCategory(patient.patientType as PatientCategory);
    }
  };

  const handleManualDraft = () => {
    if (!selectedPatient) {
      toast({ type: "info", title: "Selecciona un paciente antes de continuar." });
      return;
    }

    router.push(
      `/dashboard/new-report/editor?patient=${selectedPatient}&kind=${selectedKind}&category=${selectedCategory}`
    );
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/dashboard");
  };

  const container: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item: Variants = { hidden: { opacity: 0, scale: 0.95, y: 10 }, show: { opacity: 1, scale: 1, y: 0 } };

  return (
    <div className="relative mx-auto max-w-6xl space-y-6">
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={handleBack} className="btn btn-ghost btn-icon rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-secondary-text md:text-3xl">Nuevo documento</h1>
          <p className="mt-1 text-slate-500">Selecciona paciente, formato y plantilla clinica.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-secondary-border bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="card p-5">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-400">1. Paciente</h4>
            <select
              className="inp mt-4 w-full"
              value={selectedPatient}
              onChange={(e) => handlePatientChange(e.target.value)}
              disabled={patients.length === 0}
            >
              {patients.length === 0 && <option value="">Sin pacientes registrados</option>}
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} ({getPatientCategoryLabel(patient.patientType)})
                </option>
              ))}
            </select>
            {selectedPatientRecord && (
              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                <p><strong>Tipo actual:</strong> {getPatientCategoryLabel(selectedPatientRecord.patientType)}</p>
                {selectedPatientRecord.dni && <p className="mt-1"><strong>DNI:</strong> {selectedPatientRecord.dni}</p>}
              </div>
            )}
          </div>

          <div className="card p-5">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-400">2. Categoria</h4>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {CATEGORY_OPTIONS.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${selectedCategory === category ? "border-primary bg-primary-light text-primary" : "border-slate-200 bg-white text-slate-600 hover:border-primary/30"}`}
                >
                  {getPatientCategoryLabel(category)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <h3 className="mb-6 mt-8 flex items-center gap-2 text-lg font-bold">
          <FilePlus2 className="h-5 w-5 text-primary" />
          3. Seleccionar formato
        </h3>

        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {KIND_OPTIONS.map((tpl) => (
            <motion.button
              type="button"
              variants={item}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedKind(tpl.id)}
              key={tpl.id}
              className={`group relative rounded-2xl border-2 bg-white p-5 text-left transition-all duration-300 hover:shadow-xl ${selectedKind === tpl.id ? "border-primary ring-4 ring-primary/10" : tpl.border}`}
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${tpl.bg}`}>
                <tpl.icon className={`h-6 w-6 ${tpl.color}`} />
              </div>
              <h4 className="text-lg font-bold text-secondary-text transition-colors group-hover:text-primary">{tpl.label}</h4>
              <p className="mt-1 text-sm font-medium text-slate-500">{tpl.desc}</p>
            </motion.button>
          ))}
        </motion.div>

        <div className="mt-8 flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
          <button onClick={handleManualDraft} disabled={patients.length === 0} className="btn btn-primary flex w-full justify-center px-8 py-3 text-[15px] shadow-lg shadow-primary/20 sm:w-auto" type="button">
            Abrir editor <Sparkles className="ml-1 h-4 w-4 opacity-70" />
          </button>
        </div>
      </div>
    </div>
  );
}
