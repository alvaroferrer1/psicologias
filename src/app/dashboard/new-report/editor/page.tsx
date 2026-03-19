"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  Save,
} from "lucide-react";
import { getReportById } from "@/app/actions/reports";
import { useToast } from "@/components/ToastProvider";
import { parseStoredReportContent, serializeStoredReportContent } from "@/lib/report-content";
import { calculateAge } from "@/lib/patient-utils";
import {
  getDefaultReportTitle,
  getPatientCategoryLabel,
  getReportKindLabel,
  getReportSections,
  getRequiredFieldLabels,
  type PatientCategory,
  type ReportFieldDefinition,
  type ReportKind,
} from "@/lib/report-templates";

type EditorFields = Record<string, string | boolean | undefined>;

function normalizeCategory(value?: string | null): PatientCategory {
  if (value === "infantil" || value === "adolescente" || value === "pareja" || value === "familia") return value;
  return "adulto";
}

function normalizeKind(value?: string | null): ReportKind {
  if (value === "historia_clinica" || value === "registro") return value;
  return "informe";
}

export default function ReportEditorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const reportId = searchParams.get("id");
  const patientId = searchParams.get("patient");
  const kindParam = normalizeKind(searchParams.get("kind"));
  const categoryParam = normalizeCategory(searchParams.get("category"));

  const [title, setTitle] = useState(getDefaultReportTitle(kindParam, categoryParam));
  const [fields, setFields] = useState<EditorFields>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(Boolean(reportId));
  const [loadError, setLoadError] = useState("");
  const [resolvedPatientId, setResolvedPatientId] = useState(patientId || "");
  const [reportKind, setReportKind] = useState<ReportKind>(kindParam);
  const [patientCategory, setPatientCategory] = useState<PatientCategory>(categoryParam);

  const sections = useMemo(() => getReportSections(reportKind, patientCategory), [reportKind, patientCategory]);
  const requiredFields = useMemo(() => getRequiredFieldLabels(reportKind, patientCategory), [reportKind, patientCategory]);

  useEffect(() => {
    if (!reportId) {
      setTitle(getDefaultReportTitle(kindParam, categoryParam));
      setFields((prev) => ({
        ...prev,
        prof_fecha: new Date().toISOString().slice(0, 10),
      }));
      return;
    }

    let mounted = true;
    const loadReport = async () => {
      setIsLoadingReport(true);
      const res = await getReportById(reportId);
      if (!mounted) return;

      if (!res.success || !res.report) {
        setLoadError(res.error || "No se pudo cargar el informe.");
        setIsLoadingReport(false);
        return;
      }

      const parsed = parseStoredReportContent(res.report.content);
      setTitle(res.report.title || getDefaultReportTitle(kindParam, categoryParam));
      setFields({
        ...(parsed.fields || {}),
        prof_fecha: String(parsed.fields?.prof_fecha || new Date().toISOString().slice(0, 10)),
      });
      setResolvedPatientId(res.report.patientId);
      setReportKind(normalizeKind((res.report as { reportKind?: string }).reportKind || parsed.meta?.kind || "informe"));
      setPatientCategory(normalizeCategory((res.report as { patientCategory?: string }).patientCategory || parsed.meta?.category || res.report.type || "adulto"));
      setIsLoadingReport(false);
    };

    loadReport();
    return () => {
      mounted = false;
    };
  }, [reportId, kindParam, categoryParam]);

  useEffect(() => {
    const birthDate = String(fields.pac_birth_date || fields.pac_dob || "");
    if (!birthDate) return;
    const age = calculateAge(birthDate);
    if (age !== null) {
      setFields((prev) => ({ ...prev, pac_age: String(age), pac_edad: String(age) }));
    }
  }, [fields.pac_birth_date, fields.pac_dob]);

  const handleFieldChange = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageChange = (key: string, file?: File | null) => {
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSizeBytes = 4 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      toast({ type: "error", title: "Formato de imagen no permitido.", description: "Usa JPG, PNG o WEBP." });
      return;
    }

    if (file.size > maxSizeBytes) {
      toast({ type: "error", title: "La imagen es demasiado grande.", description: "El tamano maximo permitido es 4 MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const result = reader.result;
        setFields((prev) => ({ ...prev, [key]: result }));
      }
    };
    reader.readAsDataURL(file);
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
      toast({ type: "error", title: "El documento no tiene paciente enlazado." });
      return;
    }

    if (status === "Finalizado") {
      const missing = requiredFields.filter((field) => {
        const value = fields[field.key];
        return typeof value !== "string" || value.trim() === "";
      });

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
      const body = serializeStoredReportContent({
        meta: { kind: reportKind, category: patientCategory },
        fields,
      });

      const res = await fetch("/api/reports/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          patientId: resolvedPatientId,
          title,
          body,
          type: patientCategory,
          reportKind,
          patientCategory,
          status,
        }),
      });

      if (res.ok) {
        router.push("/dashboard/history");
        router.refresh();
        toast({ type: "success", title: status === "Finalizado" ? "Documento finalizado." : "Borrador guardado." });
      } else {
        toast({ type: "error", title: "No se pudo guardar el documento." });
      }
    } catch {
      toast({ type: "error", title: "Fallo de red al guardar el documento." });
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (field: ReportFieldDefinition) => {
    const value = fields[field.key];

    if (field.type === "textarea") {
      return (
        <textarea
          rows={field.rows || 4}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          className="inp min-h-[120px] w-full resize-y"
          placeholder={field.placeholder}
        />
      );
    }

    if (field.type === "image") {
      return (
        <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-4">
          <label className="btn btn-secondary cursor-pointer">
            <ImagePlus className="h-4 w-4" /> Subir imagen
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(field.key, e.target.files?.[0])} />
          </label>
          {typeof value === "string" && value && (
            <div className="mt-4 rounded-2xl border border-white bg-white p-3">
              <img src={value} alt={field.label} className="max-h-48 w-auto rounded-xl object-contain" />
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={field.type === "date" || field.type === "number" ? field.type : "text"}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => handleFieldChange(field.key, e.target.value)}
        className="inp w-full"
        placeholder={field.placeholder}
      />
    );
  };

  if (isLoadingReport) {
    return <div className="flex h-[calc(100vh-6rem)] items-center justify-center"><div className="card p-6 text-center"><p className="text-sm font-semibold text-slate-500">Cargando documento...</p></div></div>;
  }

  if (loadError) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <div className="card max-w-lg p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600"><AlertCircle className="h-6 w-6" /></div>
          <h2 className="text-lg font-bold text-secondary-text">No se pudo abrir el documento</h2>
          <p className="mt-2 text-sm text-slate-500">{loadError}</p>
          <button type="button" onClick={handleBack} className="btn btn-primary mt-5"><ArrowLeft className="h-4 w-4" /> Volver</button>
        </div>
      </div>
    );
  }

  const currentSection = sections[currentStep - 1];

  return (
    <div className="relative -m-4 flex h-[calc(100vh-6rem)] flex-col bg-slate-50 md:-m-6">
      <div className="z-10 flex shrink-0 items-center justify-between border-b border-secondary-border bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleBack} className="btn btn-ghost btn-icon rounded-full"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded bg-transparent px-2 py-1 text-sm font-bold text-slate-800 outline-none hover:bg-slate-50 md:text-base" />
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {getReportKindLabel(reportKind)} · {getPatientCategoryLabel(patientCategory)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button disabled={isSaving} onClick={() => handleSave("Borrador")} className="btn btn-secondary border-slate-200 bg-white text-slate-600 hover:bg-slate-50" type="button"><Save className="h-4 w-4" /> <span className="hidden sm:inline">Guardar borrador</span></button>
          <button disabled={isSaving} onClick={() => handleSave("Finalizado")} className="btn btn-primary" type="button"><CheckCircle2 className="h-4 w-4" /> <span className="hidden sm:inline">Finalizar</span></button>
        </div>
      </div>

      <div className="z-10 shrink-0 overflow-x-auto border-b border-secondary-border bg-white px-4 py-2 shadow-sm">
        <div className="mx-auto flex min-w-max max-w-6xl items-center gap-2">
          {sections.map((section, idx) => {
            const num = idx + 1;
            const isDone = num < currentStep;
            const isActive = num === currentStep;
            return (
              <button
                key={section.id}
                onClick={() => setCurrentStep(num)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${isActive ? "scale-105 border-primary bg-primary text-white shadow-md shadow-primary/20" : isDone ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10" : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"}`}
                type="button"
              >
                {section.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
          <div className="mb-8 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-extrabold text-slate-800">{currentSection.title}</h2>
            {currentSection.description && <p className="mt-1 text-sm font-medium text-slate-500">{currentSection.description}</p>}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {currentSection.fields.map((field) => (
              <div key={field.key} className={field.type === "textarea" || field.type === "image" ? "md:col-span-2" : ""}>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  {field.label} {field.required && <span className="text-primary">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="z-10 flex shrink-0 justify-center border-t border-secondary-border bg-white px-4 py-4 shadow-nav md:px-8">
        <div className="flex w-full max-w-4xl items-center justify-between">
          <button onClick={() => currentStep > 1 && setCurrentStep((prev) => prev - 1)} disabled={currentStep === 1} className="btn btn-secondary border-slate-200 bg-white disabled:opacity-50" type="button"><ArrowLeft className="h-4 w-4" /> Anterior</button>
          <button onClick={() => { if (currentStep < sections.length) setCurrentStep((prev) => prev + 1); else handleSave("Finalizado"); }} className="btn btn-primary" type="button">
            {currentStep === sections.length ? "Finalizar documento" : "Siguiente"}
            {currentStep !== sections.length && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
