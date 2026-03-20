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

  const normalizeCssColor = (value: string, property: "color" | "backgroundColor" | "borderColor") => {
    if (!value || value === "transparent" || value === "rgba(0, 0, 0, 0)") {
      return value;
    }

    const probe = document.createElement("div");
    probe.style.position = "fixed";
    probe.style.pointerEvents = "none";
    probe.style.opacity = "0";
    probe.style[property] = value;
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe)[property];
    probe.remove();
    return resolved || value;
  };

  const createSafeExportNode = (target: HTMLElement) => {
    const clone = target.cloneNode(true) as HTMLElement;
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "-100000px";
    wrapper.style.top = "0";
    wrapper.style.pointerEvents = "none";
    wrapper.style.background = "#ffffff";
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    const originalNodes = [target, ...Array.from(target.querySelectorAll("*"))] as HTMLElement[];
    const cloneNodes = [clone, ...Array.from(clone.querySelectorAll("*"))] as HTMLElement[];

    originalNodes.forEach((originalNode, index) => {
      const cloneNode = cloneNodes[index];
      if (!cloneNode) return;

      const computed = window.getComputedStyle(originalNode);
      cloneNode.style.color = normalizeCssColor(computed.color, "color");
      cloneNode.style.backgroundColor = normalizeCssColor(computed.backgroundColor, "backgroundColor");
      cloneNode.style.borderTopColor = normalizeCssColor(computed.borderTopColor, "borderColor");
      cloneNode.style.borderRightColor = normalizeCssColor(computed.borderRightColor, "borderColor");
      cloneNode.style.borderBottomColor = normalizeCssColor(computed.borderBottomColor, "borderColor");
      cloneNode.style.borderLeftColor = normalizeCssColor(computed.borderLeftColor, "borderColor");
      cloneNode.style.backgroundImage = "none";
      cloneNode.style.boxShadow = "none";
      cloneNode.style.textShadow = "none";
    });

    clone.style.width = `${target.offsetWidth}px`;
    clone.style.maxWidth = `${target.offsetWidth}px`;
    clone.style.background = "#ffffff";

    return {
      node: clone,
      cleanup: () => wrapper.remove(),
    };
  };

  const handleExport = async () => {
    const target = document.getElementById(targetId);
    if (!target) {
      toast({ type: "error", title: "No se encontro el documento para exportar." });
      return;
    }

    setIsExporting(true);
    let cleanup = () => {};
    try {
      const html2pdfModule = await import("html2pdf.js/dist/html2pdf.bundle.min.js");
      const html2pdf = (html2pdfModule as { default?: unknown }).default || html2pdfModule;
      const safeExport = createSafeExportNode(target);
      cleanup = safeExport.cleanup;

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
        .from(safeExport.node)
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
      cleanup();
      setIsExporting(false);
    }
  };

  return (
    <button id={buttonId} type="button" onClick={handleExport} className="btn btn-primary" disabled={isExporting}>
      <Download className="h-4 w-4" /> {isExporting ? "Generando PDF..." : "Descargar PDF"}
    </button>
  );
}
