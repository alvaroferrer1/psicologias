"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Copy, ExternalLink } from "lucide-react";
import { getOrCreateVideoMeeting } from "@/app/actions/appointments";
import { useToast } from "@/components/ToastProvider";

export default function VideoSessionPage() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointment");
  const [copied, setCopied] = useState(false);
  const [roomName] = useState(() => `PsyReport-Sala-${Math.floor(Math.random() * 1000000)}`);
  const [roomUrl, setRoomUrl] = useState(() => `https://meet.jit.si/${roomName}`);
  const [loadingMeeting, setLoadingMeeting] = useState(Boolean(appointmentId));
  const { toast } = useToast();

  useEffect(() => {
    let active = true;

    const loadMeeting = async () => {
      if (!appointmentId) {
        setLoadingMeeting(false);
        return;
      }

      const res = await getOrCreateVideoMeeting(appointmentId);
      if (!active) return;

      if (!res.success || !res.appointment?.meetingUrl || !res.appointment.roomName) {
        toast({ type: "error", title: "No se pudo preparar la sala de videoconsulta." });
        setLoadingMeeting(false);
        return;
      }

      setRoomUrl(res.appointment.meetingUrl);
      setLoadingMeeting(false);
    };

    loadMeeting();

    return () => {
      active = false;
    };
  }, [appointmentId, toast]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    toast({ type: "success", title: "Enlace copiado.", description: "Ya puedes enviarlo al paciente." });
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="relative -m-4 flex h-[calc(100vh-6rem)] flex-col bg-slate-900 md:-m-6">
      <div className="z-10 flex shrink-0 items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-3 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="btn btn-ghost btn-icon rounded-full text-slate-300 hover:bg-slate-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold md:text-base">Telepsicologia activa</span>
            <span className="hidden rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 sm:inline-flex">
              Sala segura conectada
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={copyLink} className="btn btn-secondary border-slate-600 bg-slate-700 text-white hover:bg-slate-600" type="button">
            <Copy className="h-4 w-4" /> <span className="hidden sm:inline">{copied ? "Copiado" : "Copiar enlace"}</span>
          </button>
          <a href={roomUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
            <ExternalLink className="h-4 w-4" /> <span className="hidden sm:inline">Abrir fuera</span>
          </a>
        </div>
      </div>

      <div className="border-b border-slate-700 bg-slate-850 px-4 py-3 text-slate-200">
        <div className="mx-auto flex max-w-5xl items-start gap-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p>
            Esta videoconsulta funciona con integracion basica de Jitsi. Si el iframe se queda en blanco o carga mal,
            usa <strong> Abrir fuera</strong>. La sala queda asociada a la cita cuando accedes desde calendario o dashboard.
          </p>
        </div>
      </div>

      <div className="relative w-full flex-1 bg-black">
        {loadingMeeting ? (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-300">
            Preparando sala segura...
          </div>
        ) : (
          <iframe
            src={roomUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="h-full w-full border-none"
          />
        )}
      </div>
    </div>
  );
}
