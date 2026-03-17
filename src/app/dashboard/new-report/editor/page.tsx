"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import { getReportById } from "@/app/actions/reports";
import { useToast } from "@/components/ToastProvider";

type EditorFields = Record<string, string | undefined>;

const STEPS = [
  { id: "prof", title: "Profesional" },
  { id: "patient", title: "Paciente" },
  { id: "consult", title: "Consulta" },
  { id: "eval", title: "Evaluación" },
  { id: "obs", title: "Observaciones" },
  { id: "findings", title: "Hallazgos" },
  { id: "end", title: "Conclusiones" },
];

export default function ReportEditorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const reportId = searchParams.get("id");
  const patientId = searchParams.get("patient");
  const templateId = searchParams.get("template") || "General";

  const [title, setTitle] = useState("Evaluación Clínica Inicial");
  const [fields, setFields] = useState<EditorFields>({});
  const [consentGranted, setConsentGranted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(Boolean(reportId));
  const [loadError, setLoadError] = useState("");
  const [resolvedPatientId, setResolvedPatientId] = useState(patientId || "");
  const [resolvedTemplateId, setResolvedTemplateId] = useState(templateId);

  useEffect(() => {
    setFields((prev) => ({
      ...prev,
      prof_fecha: new Date().toISOString().slice(0, 10),
    }));
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadReport = async () => {
      if (!reportId) {
        setResolvedPatientId(patientId || "");
        setResolvedTemplateId(templateId);
        setIsLoadingReport(false);
        return;
      }

      setIsLoadingReport(true);
      setLoadError("");

      const res = await getReportById(reportId);
      if (!isMounted) return;

      if (!res.success || !res.report) {
        setLoadError(res.error || "No se pudo cargar el informe.");
        setIsLoadingReport(false);
        return;
      }

      let parsedFields: Record<string, unknown> = {};
      if (res.report.content) {
        try {
          parsedFields = JSON.parse(res.report.content);
        } catch {
          parsedFields = {};
        }
      }

      const textFields = Object.fromEntries(
        Object.entries(parsedFields).filter(([, value]) => typeof value === "string")
      ) as EditorFields;

      setTitle(res.report.title || "Evaluación Clínica Inicial");
      setFields((prev) => ({
        ...prev,
        ...textFields,
        prof_fecha: textFields.prof_fecha || prev.prof_fecha || new Date().toISOString().slice(0, 10),
      }));
      setConsentGranted(parsedFields.consentimiento === true);
      setResolvedPatientId(res.report.patientId);
      setResolvedTemplateId(res.report.type || templateId);
      setIsLoadingReport(false);
    };

    loadReport();

    return () => {
      isMounted = false;
    };
  }, [patientId, reportId, templateId]);

  const handleFieldChange = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/dashboard/history");
  };

  const handleSave = async (status: string) => {
    if (!resolvedPatientId) {
      toast({ type: "error", title: "El informe no tiene paciente enlazado." });
      return;
    }

    if (status === "Finalizado") {
      const required = [
        { key: "prof_nombre", name: "Nombre Profesional (Paso 1)" },
        { key: "prof_colegiado", name: "Nº Colegiado (Paso 1)" },
        { key: "prof_centro", name: "Centro (Paso 1)" },
        { key: "prof_fecha", name: "Fecha (Paso 1)" },
        { key: "pac_nombre", name: "Nombre Paciente (Paso 2)" },
        { key: "pac_dob", name: "Fecha Nacimiento (Paso 2)" },
        { key: "consult_motivo", name: "Motivo Consulta (Paso 3)" },
        { key: "eval_resumen", name: "Resumen Evaluación (Paso 4)" },
        { key: "hall_hallazgos", name: "Hallazgos (Paso 6)" },
        { key: "hall_plan", name: "Plan Intervención (Paso 6)" },
        { key: "concl_conclusiones", name: "Conclusiones (Paso 7)" },
        { key: "concl_recomendaciones", name: "Recomendaciones (Paso 7)" },
      ];

      const missing = required.filter((field) => {
        const value = fields[field.key];
        return typeof value !== "string" || value.trim() === "";
      });
      if (!consentGranted) {
        missing.push({ key: "consentimiento", name: "Casilla Consentimiento (Paso 7)" });
      }

      if (missing.length > 0) {
        toast({
          type: "error",
          title: "Faltan campos obligatorios.",
          description: missing.map((field) => field.name).join(" · "),
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/reports/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          patientId: resolvedPatientId,
          title,
          body: JSON.stringify({ ...fields, consentimiento: consentGranted }),
          type: resolvedTemplateId,
          status,
        }),
      });

      if (res.ok) {
        router.push("/dashboard/history");
        router.refresh();
        toast({ type: "success", title: status === "Finalizado" ? "Informe finalizado." : "Borrador guardado." });
      } else {
        toast({ type: "error", title: "No se pudo guardar el informe." });
      }
    } catch {
      toast({ type: "error", title: "Fallo de red al guardar el informe." });
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Nombre del/la psicólogo/a <span className="text-primary">*</span></label>
              <input type="text" value={fields.prof_nombre || ""} onChange={(e) => handleFieldChange("prof_nombre", e.target.value)} className="inp w-full" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Nº de colegiado <span className="text-primary">*</span></label>
              <input type="text" value={fields.prof_colegiado || ""} onChange={(e) => handleFieldChange("prof_colegiado", e.target.value)} className="inp w-full" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Especialidad</label>
              <input type="text" value={fields.prof_especialidad || ""} onChange={(e) => handleFieldChange("prof_especialidad", e.target.value)} className="inp w-full" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Centro / Clínica <span className="text-primary">*</span></label>
              <input type="text" value={fields.prof_centro || ""} onChange={(e) => handleFieldChange("prof_centro", e.target.value)} className="inp w-full" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Fecha del informe <span className="text-primary">*</span></label>
              <input type="date" value={fields.prof_fecha || ""} onChange={(e) => handleFieldChange("prof_fecha", e.target.value)} className="inp w-full" />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Nombre completo del paciente <span className="text-primary">*</span></label>
              <input type="text" value={fields.pac_nombre || ""} onChange={(e) => handleFieldChange("pac_nombre", e.target.value)} className="inp w-full" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Fecha de nacimiento <span className="text-primary">*</span></label>
              <input type="date" value={fields.pac_dob || ""} onChange={(e) => handleFieldChange("pac_dob", e.target.value)} className="inp w-full" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">DNI / NIE</label>
              <input type="text" value={fields.pac_dni || ""} onChange={(e) => handleFieldChange("pac_dni", e.target.value)} className="inp w-full" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Dirección</label>
              <input type="text" value={fields.pac_direccion || ""} onChange={(e) => handleFieldChange("pac_direccion", e.target.value)} className="inp w-full" />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Motivo de consulta <span className="text-primary">*</span></label>
              <textarea rows={4} value={fields.consult_motivo || ""} onChange={(e) => handleFieldChange("consult_motivo", e.target.value)} className="inp w-full resize-y" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Antecedentes personales relevantes</label>
              <textarea rows={3} value={fields.consult_pers || ""} onChange={(e) => handleFieldChange("consult_pers", e.target.value)} className="inp w-full resize-y" />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Resumen general de la evaluación <span className="text-primary">*</span></label>
              <textarea rows={5} value={fields.eval_resumen || ""} onChange={(e) => handleFieldChange("eval_resumen", e.target.value)} className="inp w-full resize-y" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Pruebas y técnicas utilizadas</label>
              <textarea rows={3} value={fields.eval_pruebas || ""} onChange={(e) => handleFieldChange("eval_pruebas", e.target.value)} className="inp w-full resize-y" />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Observaciones durante las sesiones</label>
              <textarea rows={4} value={fields.obs_sesiones || ""} onChange={(e) => handleFieldChange("obs_sesiones", e.target.value)} className="inp w-full resize-y" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Estado mental general</label>
              <textarea rows={3} value={fields.obs_mental || ""} onChange={(e) => handleFieldChange("obs_mental", e.target.value)} className="inp w-full resize-y" />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Principales hallazgos <span className="text-primary">*</span></label>
              <textarea rows={5} value={fields.hall_hallazgos || ""} onChange={(e) => handleFieldChange("hall_hallazgos", e.target.value)} className="inp w-full resize-y" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Plan de intervención <span className="text-primary">*</span></label>
              <textarea rows={4} value={fields.hall_plan || ""} onChange={(e) => handleFieldChange("hall_plan", e.target.value)} className="inp w-full resize-y" />
            </div>
          </div>
        );
      case 7:
        return (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Conclusiones <span className="text-primary">*</span></label>
              <textarea rows={5} value={fields.concl_conclusiones || ""} onChange={(e) => handleFieldChange("concl_conclusiones", e.target.value)} className="inp w-full resize-y" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Recomendaciones para el paciente <span className="text-primary">*</span></label>
              <textarea rows={4} value={fields.concl_recomendaciones || ""} onChange={(e) => handleFieldChange("concl_recomendaciones", e.target.value)} className="inp w-full resize-y" />
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-3 text-sm font-bold text-slate-800">Consentimiento</h3>
              <label className="mb-4 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={consentGranted}
                  onChange={(e) => setConsentGranted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-600">
                  He obtenido el <strong>consentimiento informado</strong> del paciente o representante legal para elaborar y compartir este informe.
                </span>
              </label>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoadingReport) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <div className="card p-6 text-center">
          <p className="text-sm font-semibold text-slate-500">Cargando informe...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <div className="card max-w-lg p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-secondary-text">No se pudo abrir el informe</h2>
          <p className="mt-2 text-sm text-slate-500">{loadError}</p>
          <button type="button" onClick={handleBack} className="btn btn-primary mt-5">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative -m-4 flex h-[calc(100vh-6rem)] flex-col bg-slate-50 md:-m-6">
      <div className="z-10 flex shrink-0 items-center justify-between border-b border-secondary-border bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleBack} className="btn btn-ghost btn-icon rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded bg-transparent px-2 py-1 text-sm font-bold text-slate-800 outline-none hover:bg-slate-50 md:text-base"
            />
            <span className="hidden rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 sm:inline-flex">
              Borrador
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={isSaving}
            onClick={() => handleSave("Borrador")}
            className="btn btn-secondary border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            type="button"
          >
            <Save className="h-4 w-4" /> <span className="hidden sm:inline">Guardar Borrador</span>
          </button>
          <button disabled={isSaving} onClick={() => handleSave("Finalizado")} className="btn btn-primary" type="button">
            <CheckCircle2 className="h-4 w-4" /> <span className="hidden sm:inline">Finalizar</span>
          </button>
        </div>
      </div>

      <div className="z-10 shrink-0 overflow-x-auto border-b border-secondary-border bg-white px-4 py-2 shadow-sm">
        <div className="mx-auto flex min-w-max max-w-4xl items-center gap-2">
          {STEPS.map((step, idx) => {
            const num = idx + 1;
            const isDone = num < currentStep;
            const isActive = num === currentStep;
            return (
              <div key={step.id} className="flex items-center">
                {idx > 0 && <div className={`mx-1 h-px w-3 sm:mx-2 sm:w-8 ${isDone || isActive ? "bg-primary" : "bg-slate-200"}`} />}
                <button
                  onClick={() => setCurrentStep(num)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? "scale-105 border-primary bg-primary text-white shadow-md shadow-primary/20"
                      : isDone
                        ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                        : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                  }`}
                  type="button"
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    isActive ? "bg-white/20" : isDone ? "bg-primary text-white" : "bg-slate-100"
                  }`}>
                    {isDone ? <CheckCircle2 className="h-3 w-3" /> : num}
                  </span>
                  <span className="hidden sm:inline">{step.title}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
          <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">{STEPS[currentStep - 1].title}</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Paso {currentStep} de {STEPS.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-xl font-black text-primary">
              {currentStep}
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">{renderStepContent()}</div>
        </div>
      </div>

      <div className="z-10 flex shrink-0 justify-center border-t border-secondary-border bg-white px-4 py-4 shadow-nav md:px-8">
        <div className="flex w-full max-w-2xl items-center justify-between">
          <button
            onClick={() => currentStep > 1 && setCurrentStep((prev) => prev - 1)}
            disabled={currentStep === 1}
            className="btn btn-secondary border-slate-200 bg-white disabled:opacity-50"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" /> Anterior
          </button>
          <button
            onClick={() => {
              if (currentStep < STEPS.length) {
                setCurrentStep((prev) => prev + 1);
              } else {
                handleSave("Finalizado");
              }
            }}
            className="btn btn-primary"
            type="button"
          >
            {currentStep === STEPS.length ? "Finalizar Informe" : "Siguiente"}
            {currentStep !== STEPS.length && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
