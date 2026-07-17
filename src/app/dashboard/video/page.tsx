"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Copy, ExternalLink, ShieldCheck, FileSignature, Loader2 } from "lucide-react";
import { getOrCreateVideoMeeting } from "@/app/actions/appointments";
import { createVideoConsent } from "@/app/actions/consents";
import { useToast } from "@/components/ToastProvider";
import { useT } from "@/lib/useT";

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => {
      dispose: () => void;
      executeCommand: (command: string, ...args: unknown[]) => void;
    };
  }
}

function loadJitsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) return resolve();
    const existing = document.getElementById("jitsi-external-api");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.id = "jitsi-external-api";
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar el cliente de videoconsulta."));
    document.body.appendChild(script);
  });
}

export default function VideoSessionPage() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointment");
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  const [loadingMeeting, setLoadingMeeting] = useState(true);
  const [roomInfo, setRoomInfo] = useState<{
    domain: string;
    roomName: string;
    roomPassword: string;
    token: string | null;
    isSecure: boolean;
    meetingUrl: string;
    patientId: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consentSaved, setConsentSaved] = useState(false);
  const [savingConsent, setSavingConsent] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<{ dispose: () => void } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let active = true;

    const prepare = async () => {
      try {
        const res = await fetch("/api/video/jitsi-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId: appointmentId || "" }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "No se pudo preparar la sala.");
        }

        const data = await res.json();
        if (!active) return;

        setRoomInfo({
          domain: data.domain,
          roomName: data.roomName,
          roomPassword: data.roomPassword,
          token: data.token ?? null,
          isSecure: data.isSecure,
          meetingUrl: `https://${data.domain}/${data.roomName}`,
          patientId: data.patientId ?? null,
        });

        if (!appointmentId) {
          setLoadingMeeting(false);
        } else {
          const meeting = await getOrCreateVideoMeeting(appointmentId);
          if (!active) return;
          if (!meeting.success) {
            throw new Error(meeting.error || "No se pudo preparar la sala.");
          }
          setLoadingMeeting(false);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Error desconocido.");
        setLoadingMeeting(false);
      }
    };

    prepare();
    return () => {
      active = false;
    };
  }, [appointmentId, toast]);

  useEffect(() => {
    if (loadingMeeting || error || !roomInfo || !containerRef.current) return;

    let cancelled = false;

    loadJitsiScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.JitsiMeetExternalAPI) return;

        const api = new window.JitsiMeetExternalAPI(roomInfo.domain, {
          roomName: roomInfo.roomName,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          jwt: roomInfo.token ?? undefined,
          userInfo: {
            displayName: "Profesional Emotiva",
          },
          configOverwrite: {
            prejoinPageEnabled: false,
            startWithAudioMuted: false,
            disableDeepLinking: true,
            enableEmailInStats: false,
            toolbarButtons: [
              "microphone",
              "camera",
              "desktop",
              "fullscreen",
              "fodevlink",
              "hangup",
              "settings",
              "raisehand",
              "videoquality",
            ],
          },
          interfaceConfigOverwrite: {
            MOBILE_APP_PROMO: false,
            SHOW_JITSI_WATERMARK: false,
            HIDE_INVITE_MORE_HEADER: true,
            TOOLBAR_BUTTONS: [
              "microphone",
              "camera",
              "desktop",
              "fullscreen",
              "hangup",
              "settings",
              "raisehand",
            ],
          },
        });

        apiRef.current = api as unknown as { dispose: () => void };

        if (roomInfo.roomPassword) {
          api.executeCommand("password", roomInfo.roomPassword);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar la sala.");
        }
      });

    return () => {
      cancelled = true;
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, [loadingMeeting, error, roomInfo]);

  const saveVideoConsent = async () => {
    if (!roomInfo?.patientId) {
      toast({ type: "error", title: t("No se pudo iniciar la sala.") });
      return;
    }
    setSavingConsent(true);
    try {
      const result = await createVideoConsent({
        patientId: roomInfo.patientId as string,
        roomName: roomInfo.roomName,
      });
      if (result.success) {
        setConsentSaved(true);
        toast({ type: "success", title: t("Sala lista") });
      } else {
        toast({ type: "error", title: t("No se pudo unir"), description: result.error });
      }
    } catch {
      toast({ type: "error", title: t("Sala no disponible") });
    } finally {
      setSavingConsent(false);
    }
  };

  const copyLink = async () => {
    if (!roomInfo) return;
    const text = roomInfo.isSecure
      ? `${roomInfo.meetingUrl} (contraseÃ±a: ${roomInfo.roomPassword})`
      : roomInfo.meetingUrl;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ type: "success", title: t("Consentimiento registrado"), description: t("Se ha guardado el consentimiento de la sesión.") });
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
            <span className="text-sm font-bold md:text-base">{t("Sala de videoconsulta")}</span>
            <span className="hidden items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 sm:inline-flex">
              <ShieldCheck className="h-3 w-3" /> {t("Cifrado")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={copyLink} disabled={!roomInfo} className="btn btn-secondary border-slate-600 bg-slate-700 text-white hover:bg-slate-600" type="button">
            <Copy className="h-4 w-4" /> <span className="hidden sm:inline">{copied ? t("Copiado") : t("Copiar enlace")}</span>
          </button>
          {roomInfo?.patientId && (
            <button onClick={saveVideoConsent} disabled={savingConsent || consentSaved} className="btn btn-secondary border-slate-600 bg-slate-700 text-white hover:bg-slate-600" type="button">
              {savingConsent ? <Loader2 className="h-4 w-4 animate-spin" /> : consentSaved ? <ShieldCheck className="h-4 w-4" /> : <FileSignature className="h-4 w-4" />}
              <span className="hidden sm:inline">{consentSaved ? t("Consentimiento guardado") : t("Guardar consentimiento")}</span>
            </button>
          )}
          {roomInfo && (
            <a href={roomInfo.meetingUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
              <ExternalLink className="h-4 w-4" /> <span className="hidden sm:inline">{t("Compartir enlace")}</span>
            </a>
          )}
        </div>
      </div>

      <div className="border-b border-slate-700 bg-slate-850 px-4 py-3 text-slate-200">
        <div className="mx-auto flex max-w-5xl items-start gap-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p>
            {roomInfo?.isSecure ? (
              <>{t("Historial")}</>
            ) : (
              <>{t("Informes")}</>
            )}
          </p>
        </div>
      </div>

      <div className="relative w-full flex-1 bg-black">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm font-semibold text-slate-300">
            <AlertTriangle className="h-8 w-8 text-amber-400" />
            <p>{error}</p>
            {roomInfo && (
              <a href={roomInfo.meetingUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
                <ExternalLink className="h-4 w-4" /> {t("Compartir enlace")}
              </a>
            )}
          </div>
        ) : loadingMeeting ? (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-300">
            {t("Volver al calendario")}
          </div>
        ) : (
          <div ref={containerRef} className="h-full w-full" />
        )}
      </div>
    </div>
  );
}


