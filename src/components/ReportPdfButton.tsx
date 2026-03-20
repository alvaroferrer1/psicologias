"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export function ReportPdfButton({
  targetId,
  filename,
  buttonId,
}: {
  targetId: string;
  filename: string;
  buttonId?: string;
}) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    const target = document.getElementById(targetId);
    if (!target) {
      toast({ type: "error", title: "No se encontro el documento para exportar." });
      return;
    }

    setIsExporting(true);
    try {
      const html2pdfModule = await import("html2pdf.js/dist/html2pdf.bundle.min.js");
      const html2pdf = (html2pdfModule as { default?: unknown }).default || html2pdfModule;

      const options = {
        margin: [0, 0, 0, 0],
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff", scrollY: 0 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      } as unknown;

      await (html2pdf() as {
        set: (input: unknown) => { from: (node: HTMLElement) => { save: () => Promise<void> } };
      })
        .set(options)
        .from(target)
        .save();

      toast({ type: "success", title: "PDF generado correctamente." });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "";
      toast({
        type: "error",
        title: "No se pudo exportar el PDF.",
        description:
          message ||
          "Comprueba que el documento este cargado por completo y que las imagenes subidas sean validas antes de descargar.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button id={buttonId} type="button" onClick={handleExport} className="btn btn-primary" disabled={isExporting}>
      <Download className="h-4 w-4" /> {isExporting ? "Generando PDF..." : "Descargar PDF"}
    </button>
  );
}
