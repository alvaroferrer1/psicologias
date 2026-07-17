"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneCall, Video, X, Clock3 } from "lucide-react";
import { onIncomingCall, type IncomingCallDetail } from "@/lib/incoming-call";
import { useT } from "@/lib/useT";

function playRingtone(times = 3) {
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

export function IncomingCallBanner() {
  const { t, lang } = useT();
  const locale = lang === "en" ? "en-US" : "es-ES";
  const [call, setCall] = useState<IncomingCallDetail | null>(null);
  const audioTimer = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = onIncomingCall((incoming) => {
      setCall(incoming);
      playRingtone(4);
      if (audioTimer.current) window.clearInterval(audioTimer.current);
      audioTimer.current = window.setInterval(() => playRingtone(2), 4000);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!call) {
      if (audioTimer.current) window.clearInterval(audioTimer.current);
      audioTimer.current = null;
    }
  }, [call]);

  const dismiss = () => {
    setCall(null);
    if (audioTimer.current) window.clearInterval(audioTimer.current);
    audioTimer.current = null;
  };

  return (
    <AnimatePresence>
      {call && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="fixed inset-x-3 top-3 z-[100] mx-auto max-w-md sm:inset-x-auto sm:right-4 sm:left-auto"
          role="alert"
        >
          <div className="overflow-hidden rounded-3xl border border-primary/30 bg-white shadow-2xl ring-1 ring-black/5 dark:bg-[var(--color-secondary-card)]">
            <div className="relative flex items-center gap-3 bg-gradient-to-r from-primary to-primary-dark px-5 py-3 text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Video className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                 <p className="text-[11px] font-black uppercase tracking-widest text-white/80">{t("Llamada entrante")}</p>
                <p className="truncate text-sm font-bold">{call.patientName}</p>
              </div>
              <button onClick={dismiss} className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white" aria-label="Descartar">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 p-5">
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
                  <PhoneCall className="h-7 w-7 animate-pulse" />
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white ring-2 ring-white dark:ring-[var(--color-secondary-card)]">
                  ●
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-secondary-text">{call.title}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  {new Date(call.date).toLocaleString(locale, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>

            <div className="flex gap-2 border-t border-secondary-border p-3">
              <button
                onClick={dismiss}
                className="btn btn-ghost flex-1 border-slate-200 text-slate-600 hover:bg-slate-100"
                type="button"
              >
                 {t("Tienes una videoconsulta lista para entrar.")}
              </button>
              <a
                href={call.roomUrl}
                target="_blank"
                rel="noreferrer"
                onClick={dismiss}
                className="btn btn-primary flex-1"
              >
                 <Video className="h-4 w-4" /> {t("Entrar a la sala")}
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
