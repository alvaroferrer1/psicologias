"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { useT } from "@/lib/useT";

type PdfField = {
  label: string;
  type: "text" | "textarea" | "date" | "number" | "image";
  value?: string | boolean;
};

type PdfSection = {
  title: string;
  description?: string;
  fields: PdfField[];
};

export function ReportPdfButton({
  filename,
  buttonId,
  title,
  reportTitle,
  patientName,
  documentType,
  groupLabel,
  legalNotice,
  updatedAt,
  sections,
  signatureName,
  signatureImage,
  stampImage,
}: {
  filename: string;
  buttonId?: string;
  title: string;
  reportTitle: string;
  patientName: string;
  documentType: string;
  groupLabel: string;
  legalNotice: string;
  updatedAt: string;
  sections: PdfSection[];
  signatureName: string;
  signatureImage?: string;
  stampImage?: string;
}) {
  const { toast } = useToast();
  const { t } = useT();
  const [isExporting, setIsExporting] = useState(false);

  const loadImageAsDataUrl = async (src?: string) => {
    if (!src) return null;
    if (src.startsWith("data:")) return src;
    const response = await fetch(src);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") resolve(reader.result);
       else reject(new Error(t("No se pudo generar el PDF.")));
      };
      reader.onerror = () => reject(new Error(t("No se pudo generar el PDF.")));
      reader.readAsDataURL(blob);
    });
  };

  const inferImageFormat = (dataUrl: string) => {
    if (dataUrl.startsWith("data:image/png")) return "PNG";
    if (dataUrl.startsWith("data:image/webp")) return "WEBP";
    return "JPEG";
  };

  const buildPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    const primaryBlue = "#1967D2";
    const darkBlue = "#0F52B5";
    const softBlue = "#EAF3FF";
    const paleBlue = "#F4F8FF";
    const textColor = "#0F172A";
    const muted = "#64748B";
    let y = 0;
    const coverBackground = await loadImageAsDataUrl("/pdf-cover-base.png").catch(() => null);
    const logoData = await loadImageAsDataUrl("/emotiva-logo.png").catch(() => null);

    const ensureSpace = (needed = 14) => {
      if (y + needed <= pageHeight - margin) return;
      pdf.addPage();
      drawPageHeader();
      y = 30;
    };

    const drawPageHeader = () => {
      pdf.setFillColor(primaryBlue);
      pdf.rect(0, 0, pageWidth, 12, "F");
      pdf.setFillColor(231, 240, 255);
      pdf.rect(0, 12, pageWidth, 4, "F");
    };

    const addWrappedText = (text: string, x: number, top: number, width: number, fontSize = 11, color = textColor) => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(fontSize);
      pdf.setTextColor(color);
      const lines = pdf.splitTextToSize(text, width);
      pdf.text(lines, x, top);
      return lines.length * (fontSize * 0.42);
    };

    const addField = (field: PdfField) => {
      if (field.value === undefined || field.value === null || field.value === "") return;
      ensureSpace(field.type === "image" ? 42 : 20);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(primaryBlue);
      pdf.text(field.label.toUpperCase(), margin, y);
      y += 4;

      if (field.type === "image" && typeof field.value === "string") {
        return loadImageAsDataUrl(field.value)
          .then((imageData) => {
            if (!imageData) return;
            const format = inferImageFormat(imageData);
            ensureSpace(45);
            pdf.setDrawColor(220, 228, 238);
            pdf.roundedRect(margin, y, 68, 34, 3, 3, "S");
            pdf.addImage(imageData, format, margin + 2, y + 2, 64, 30);
            y += 40;
          })
          .catch(() => {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            pdf.setTextColor(muted);
            pdf.text(t("Firma"), margin, y + 6);
            y += 12;
          });
      }

      pdf.setDrawColor(220, 228, 238);
      const text = String(field.value);
      const lines = pdf.splitTextToSize(text, contentWidth - 8);
      const boxHeight = Math.max(10, lines.length * 5 + 6);
      ensureSpace(boxHeight + 4);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(margin, y, contentWidth, boxHeight, 3, 3, "FD");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(textColor);
      pdf.text(lines, margin + 4, y + 6);
      y += boxHeight + 8;
      return Promise.resolve();
    };

    if (coverBackground) {
      pdf.addImage(coverBackground, inferImageFormat(coverBackground), 0, 0, pageWidth, pageHeight);
    } else {
      pdf.setFillColor(248, 251, 255);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      drawPageHeader();
    }

    if (logoData) {
      pdf.addImage(logoData, inferImageFormat(logoData), 26, 76, 58, 58);
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(darkBlue);
    pdf.text(t("Bloque de firma"), 24, 150);
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(11);
    pdf.setTextColor("#334155");
    addWrappedText(legalNotice, 24, 158, 162, 11, "#334155");

    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(198, 214, 235);
    pdf.roundedRect(24, 178, 162, 58, 6, 6, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.setTextColor(textColor);
    pdf.text(title.toUpperCase(), 32, 196);
    pdf.setFontSize(16);
    pdf.setTextColor(primaryBlue);
    pdf.text(patientName, 32, 208);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(textColor);
    pdf.text(`Documento: ${documentType}`, 32, 218);
    pdf.text(`Grupo: ${groupLabel}`, 32, 225);
    addWrappedText(`Titulo: ${reportTitle}`, 32, 232, 145, 10.5, textColor);

    pdf.setFillColor(25, 103, 210);
    pdf.roundedRect(24, 248, 74, 18, 5, 5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor("#FFFFFF");
    pdf.text(t("Sello"), 31, 255);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(updatedAt.split(",")[0] || updatedAt, 31, 261);

    pdf.addPage();
    drawPageHeader();
    y = 30;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(primaryBlue);
    pdf.text(title.toUpperCase(), margin, 22);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(muted);
    pdf.text(patientName, pageWidth - margin - pdf.getTextWidth(patientName), 22);

    for (const section of sections) {
      const visibleFields = section.fields.filter((field) => field.value !== undefined && field.value !== null && field.value !== "");
      if (visibleFields.length === 0) continue;
      ensureSpace(18);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.setTextColor(primaryBlue);
      pdf.text(section.title, margin, y);
      y += 7;
      if (section.description) {
        y += addWrappedText(section.description, margin, y, contentWidth, 10, muted) + 3;
      }
      pdf.setDrawColor(225, 232, 240);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 7;

      for (const field of visibleFields) {
        await addField(field);
      }
    }

    ensureSpace(52);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.setTextColor(primaryBlue);
    pdf.text(t("Firmado por"), margin, y);
    y += 9;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(textColor);
    pdf.text(signatureName || t("Profesional"), margin, y);
    y += 7;

    const signatureData = await loadImageAsDataUrl(signatureImage);
    const stampData = await loadImageAsDataUrl(stampImage);

    if (signatureData) {
      pdf.addImage(signatureData, inferImageFormat(signatureData), margin, y, 55, 24);
    } else {
      pdf.setDrawColor(220, 228, 238);
      pdf.roundedRect(margin, y, 55, 24, 3, 3, "S");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(muted);
      pdf.text(t("Firma"), margin + 4, y + 13);
    }

    if (stampData) {
      pdf.addImage(stampData, inferImageFormat(stampData), margin + 75, y, 40, 24);
    } else {
      pdf.setDrawColor(220, 228, 238);
      pdf.roundedRect(margin + 75, y, 40, 24, 3, 3, "S");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(muted);
      pdf.text(t("con sello"), margin + 88, y + 13);
    }

    pdf.save(filename);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await buildPdf();
      toast({ type: "success", title: t("PDF exportado.") });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "";
      toast({
        type: "error",
        title: t("Exportar PDF"),
        description:
          message ||
            t("Generando PDF..."),
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button id={buttonId} type="button" onClick={handleExport} className="btn btn-primary" disabled={isExporting}>
      <Download className="h-4 w-4" /> {isExporting ? t("Exportando...") : t("Exportar PDF")}
    </button>
  );
}
