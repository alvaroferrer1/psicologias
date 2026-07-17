import { type PatientCategory, type ReportKind } from "@/lib/report-templates";

export type ReportFieldValue = string | boolean | number | undefined | null;

export type StoredReportContent = {
  meta?: {
    kind?: ReportKind;
    category?: PatientCategory;
  };
  fields?: Record<string, ReportFieldValue>;
};

const REPORT_FIELD_ALIASES: Record<string, string[]> = {
  pac_birth_date: ["pac_dob"],
  pac_age: ["pac_edad"],
  signature_name: ["prof_nombre", "psychologist_name"],
  signature_image: ["firma_image", "firma"],
  institution_stamp_image: ["stamp_image", "sello_image", "sello"],
  prof_fecha: ["report_date", "doc_date", "fecha_informe"],
  consult_reason: ["consulta_motivo", "motivo_consulta"],
  results_summary: ["clinical_summary", "resumen_resultados"],
  clinical_impression: ["conclusion", "impresion_clinica"],
  behavioral_observation: ["observacion_conductual"],
  therapy_goals: ["objetivos_terapeuticos", "treatment_goals"],
  progress_summary: ["progreso_terapeutico", "therapeutic_progress"],
  background: ["antecedentes", "relevant_background"],
};

export function hasReportFieldValue(value: ReportFieldValue) {
  if (typeof value === "string") {
    return value.trim() !== "";
  }

  return value !== undefined && value !== null;
}

export function getReportFieldValue(
  fields: Record<string, ReportFieldValue> | null | undefined,
  key: string
): ReportFieldValue {
  if (!fields) return undefined;

  const candidates = [key, ...(REPORT_FIELD_ALIASES[key] || [])];
  for (const candidate of candidates) {
    const value = fields[candidate];
    if (hasReportFieldValue(value)) {
      return value;
    }
  }

  return undefined;
}

export function parseStoredReportContent(content: string | null | undefined): StoredReportContent {
  if (!content) {
    return { meta: {}, fields: {} };
  }

  try {
    const parsed = JSON.parse(content) as StoredReportContent | Record<string, unknown>;
    if ("fields" in parsed || "meta" in parsed) {
      return {
        meta: (parsed as StoredReportContent).meta || {},
        fields: (parsed as StoredReportContent).fields || {},
      };
    }

    return {
      meta: {},
      fields: Object.fromEntries(
        Object.entries(parsed).filter(([, value]) => ["string", "boolean", "number"].includes(typeof value))
      ) as Record<string, ReportFieldValue>,
    };
  } catch {
    return {
      meta: {},
      fields: { legacy_content: content },
    };
  }
}

export function serializeStoredReportContent(input: StoredReportContent) {
  return JSON.stringify(input);
}
