"use client";

import { Download } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export function ReportPdfButton({
  targetId,
  filename,
}: {
  targetId: string;
  filename: string;
}) {
  const { toast } = useToast();

  const handleExport = async () => {
    const target = document.getElementById(targetId);
    if (!target) {
      toast({ type: "error", title: "No se encontró el informe para exportar." });
      return;
    }

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: 10,
          filename,
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(target)
        .save();

      toast({ type: "success", title: "PDF generado correctamente." });
    } catch (error) {
      console.error(error);
      toast({ type: "error", title: "No se pudo exportar el PDF." });
    }
  };

  return (
    <button type="button" onClick={handleExport} className="btn btn-primary">
      <Download className="h-4 w-4" /> Exportar PDF
    </button>
  );
}
