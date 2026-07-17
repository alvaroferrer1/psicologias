"use client";

import { useEffect, useSyncExternalStore, useState, useTransition } from "react";
import { Bell, BellRing, MonitorCog, Loader2, Volume2 } from "lucide-react";
import { updatePlatformPreferences } from "@/app/actions/profile";
import { getAppointments } from "@/app/actions/appointments";
import { useToast } from "@/components/ToastProvider";
import { useUiPrefs, setUiPrefs } from "@/lib/ui-store";
import { emitIncomingCall } from "@/lib/incoming-call";
import { useT } from "@/lib/useT";

const REMIND_BEFORE_MIN = 15;

function subscribePermission(callback: () => void) {
  if (typeof window === "undefined" || !("Notification" in window)) return () => {};
  window.addEventListener("permissionchange", callback);
  return () => window.removeEventListener("permissionchange", callback);
}

function getPermissionSnapshot(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "default";
  return Notification.permission;
}

export function NotificationSettings({ initialReminders }: { initialReminders: boolean }) {
  const { t, lang } = useT();
  const locale = lang === "en" ? "en-US" : "es-ES";
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(initialReminders);
  const [isPending, startTransition] = useTransition();
  const browserPermissionLive = useSyncExternalStore(subscribePermission, getPermissionSnapshot, getPermissionSnapshot);
  const ui = useUiPrefs();
  const requestBrowser = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast({ type: "error", title: t("Este navegador no soporta notificaciones.") });
      return;
    }
    const result = await Notification.requestPermission();
    if (result !== "granted") {
      toast({ type: "error", title: t("Permiso de notificaciones denegado.") });
    } else {
      toast({ type: "success", title: t("Notificaciones activadas en el navegador.") });
    }
  };

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    startTransition(async () => {
      const res = await updatePlatformPreferences({ remindersEnabled: next });
      if (!res.success) {
        setEnabled(!next);
        toast({ type: "error", title: t("No se pudo guardar la preferencia.") });
      } else {
        toast({ type: "success", title: next ? t("Recordatorios activados.") : t("Recordatorios desactivados.") });
      }
    });
  };

  const [preview, setPreview] = useState<{ id: string; title: string; patient: string; remindAt: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const apps = await getAppointments();
        const now = Date.now();
        const upcoming = apps
          .filter((a) => new Date(a.date).getTime() > now)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 4)
          .map((a) => ({
            id: a.id,
            title: a.title,
            patient: a.patient?.name || t("Paciente"),
            remindAt: new Date(new Date(a.date).getTime() - REMIND_BEFORE_MIN * 60000).toLocaleString(locale, {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "short",
            }),
          }));
        if (!cancelled) setPreview(upcoming);
      } catch {
        /* silencioso */
      }
    };
    const handle = () => {
      void load();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("online", handle);
      void Promise.resolve().then(handle);
      return () => {
        cancelled = true;
        window.removeEventListener("online", handle);
      };
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="card flex items-center justify-between gap-4 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
            {enabled ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          </div>
          <div>
            <p className="font-bold text-secondary-text">{t("Recordatorios de sesiones")}</p>
            <p className="mt-1 text-sm text-slate-500">
              {t("Te avisamos 15 minutos antes de cada cita, aunque estés en otro programa.")}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={toggle}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${enabled ? "bg-primary" : "bg-slate-300"}`}
          aria-pressed={enabled}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>

      <div className="card flex items-center justify-between gap-4 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
            <MonitorCog className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-secondary-text">{t("Notificaciones del navegador")}</p>
            <p className="mt-1 text-sm text-slate-500">
              {t("Estado del permiso del navegador:")} {browserPermissionLive === "granted" ? t("Permitidas") : browserPermissionLive === "denied" ? t("Bloqueadas") : t("Sin decidir")}
            </p>
          </div>
        </div>
        {browserPermissionLive !== "granted" && (
          <button type="button" onClick={requestBrowser} className="btn btn-secondary">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("notif.allow")}
          </button>
        )}
      </div>

      <div className="card flex items-center justify-between gap-4 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
            <Volume2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-secondary-text">{t("Sonido en recordatorios")}</p>
            <p className="mt-1 text-sm text-slate-500">
              {t("Reproduce un tono al avisar de citas próximas.")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setUiPrefs({ soundReminders: !ui.soundReminders })}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${ui.soundReminders ? "bg-primary" : "bg-slate-300"}`}
          aria-pressed={ui.soundReminders}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${ui.soundReminders ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>

      <div className="card border-primary/20 bg-primary-light p-4 dark:bg-primary/10">
        <p className="text-sm font-medium text-primary">
          <strong>{t("Videoconsultas:")}</strong> {t("cuando una cita de vídeo está a punto de empezar, salta una \"llamada entrante\" tipo reunión (como Teams): te avisa en el ordenador incluso si estás en Word o en otra pestaña, suena un timbre y puedes entrar directamente a la sala con un clic.")}
        </p>
      </div>

      <p className="px-1 text-xs text-slate-400">
        Los avisos usan el reloj de este equipo. {t("Para recibirlos, la plataforma debe estar abierta en una pestaña del navegador.")}
      </p>

      <div className="card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
            <BellRing className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-secondary-text">{t("Próximos avisos")}</p>
            <p className="mt-1 text-sm text-slate-500">{t("Así sonará el recordatorio antes de cada cita.")}</p>
          </div>
        </div>
        {preview.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">{t("No hay citas próximas programadas.")}</p>
        ) : (
          <ul className="space-y-2">
            {preview.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-secondary-text">{item.title}</p>
                  <p className="truncate text-xs text-slate-500">{item.patient}</p>
                </div>
                <span className="shrink-0 rounded-full bg-primary-light px-3 py-1 text-[11px] font-black uppercase tracking-wider text-primary">
                  {item.remindAt}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ReminderWatcher enabled={enabled} sound={ui.soundReminders} browserGranted={browserPermissionLive === "granted"} />
    </div>
  );
}

function ReminderWatcher({ enabled, sound, browserGranted }: { enabled: boolean; sound: boolean; browserGranted: boolean }) {
  const { t } = useT();
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const notifyVideoCall = (app: { id: string; title: string; patient?: { name: string | null } | null; date: Date | string }) => {
      const patientName = app.patient?.name || t("Paciente");
      const roomUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/video?appointment=${app.id}`;
      const body = `${t("Videollamada con")} ${patientName} ${t("está lista. Pulsa para entrar a la sala.")}`;

      if (browserGranted) {
        try {
          const n = new Notification(t("Llamada entrante · PsyReport"), {
            body,
            tag: `call-${app.id}`,
          });
          n.onclick = () => {
            window.open(roomUrl, "_blank");
            n.close();
          };
        } catch {
          /* notificacion no disponible */
        }
      }

      emitIncomingCall({
        id: `incoming-${app.id}`,
        appointmentId: app.id,
        patientName,
        title: app.title,
        roomUrl,
        date: new Date(app.date).toISOString(),
      });

      if (sound) playRingtone(3);
    };

    const check = async () => {
      if (cancelled) return;
      try {
        const now = Date.now();
        const apps = await getAppointments();
        for (const app of apps) {
          const diffMin = (new Date(app.date).getTime() - now) / 60000;
          const isVideo = app.type === "Videoconsulta";

          if (isVideo) {
            if (diffMin <= 3 && diffMin > -10) {
              const flag = `called_${app.id}`;
              if (!localStorage.getItem(flag)) {
                localStorage.setItem(flag, "1");
                notifyVideoCall(app);
              }
              continue;
            }
          }

          if (diffMin > 0 && diffMin <= REMIND_BEFORE_MIN) {
            const flag = `reminded_${app.id}`;
            if (!localStorage.getItem(flag)) {
              localStorage.setItem(flag, "1");
              const body = `${app.title} · Recordatorio: ${app.patient?.name || "Paciente"} en ${Math.ceil(diffMin)} min`;
              if (browserGranted) {
                try {
                  new Notification("PsyReport: sesión próxima", { body, tag: `remind-${app.id}` });
                } catch {
                  /* notificacion no disponible */
                }
              }
              if (sound) playRingtone(2);
            }
          }
        }
      } catch {
        /* silencioso */
      }
    };

    check();
    const interval = window.setInterval(check, 30 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [enabled, sound, browserGranted]);

  return null;
}

function playRingtone(times = 2) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const ring = (offset: number) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(440, ctx.currentTime + offset);
      oscillator.frequency.setValueAtTime(660, ctx.currentTime + offset + 0.15);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.35);
      oscillator.start(ctx.currentTime + offset);
      oscillator.stop(ctx.currentTime + offset + 0.4);
    };
    for (let i = 0; i < times; i++) ring(i * 0.5);
    window.setTimeout(() => ctx.close(), times * 500 + 600);
  } catch {
    /* silencioso */
  }
}
