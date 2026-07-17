"use client";

import { Download } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { useT } from "@/lib/useT";

type ExportValue = string | number | boolean | null | undefined;
type ExportRow = Record<string, ExportValue>;

export function ExportButton({
  data,
  filename = "export.csv",
  label = "Exportar",
  className = "",
  icon = true,
  title = "",
}: {
  data?: ExportRow[];
  filename?: string;
  label?: string;
  className?: string;
  icon?: boolean;
  title?: string;
}) {
  const { t } = useT();
  const { toast } = useToast();

  const handleExport = () => {
    if (!data || data.length === 0) {
      toast({ type: "info", title: "No hay datos para exportar." });
      return;
    }
    try {
      const headers = Object.keys(data[0]).join(",");
      const rows = data.map((obj) =>
        Object.values(obj).map((val) =>
          typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : (val ?? "")
        ).join(",")
      );
      
      const csvStr = [headers, ...rows].join("\n");
      const blob = new Blob([`\uFEFF${csvStr}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ type: "success", title: "Exportación completada." });
    } catch {
      toast({ type: "error", title: "Error al exportar." });
    }
  };

  return (
    <button className={className} onClick={handleExport} title={title}>
      {icon && <Download className="w-4 h-4" />}
      {label && <span>{label}</span>}
    </button>
  );
}
