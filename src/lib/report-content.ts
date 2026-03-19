import { type PatientCategory, type ReportKind } from "@/lib/report-templates";

export type StoredReportContent = {
  meta?: {
    kind?: ReportKind;
    category?: PatientCategory;
  };
  fields?: Record<string, string | boolean | undefined>;
};

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
      ) as Record<string, string | boolean | undefined>,
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
