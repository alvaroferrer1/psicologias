"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
};

type ToastContextValue = {
  toast: (input: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((input: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { ...input, id }]);
    window.setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toastItem) => {
          const icon =
            toastItem.type === "success" ? <CheckCircle2 className="h-5 w-5" /> :
            toastItem.type === "error" ? <AlertTriangle className="h-5 w-5" /> :
            <Info className="h-5 w-5" />;

          return (
            <div
              key={toastItem.id}
              className={cn(
                "pointer-events-auto rounded-2xl border p-4 shadow-xl backdrop-blur animate-in slide-in-from-top-2 duration-200",
                toastItem.type === "success" && "border-emerald-200 bg-white text-emerald-700",
                toastItem.type === "error" && "border-red-200 bg-white text-red-700",
                toastItem.type === "info" && "border-slate-200 bg-white text-slate-700"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{icon}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{toastItem.title}</p>
                  {toastItem.description && <p className="mt-1 text-sm text-slate-500">{toastItem.description}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toastItem.id)}
                  className="text-slate-400 transition-colors hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
