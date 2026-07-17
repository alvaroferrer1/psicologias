import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  Phone,
  Plus,
  UserSquare2,
  Video,
} from "lucide-react";
import { PatientEditSheet } from "@/components/PatientEditSheet";
import { requireCurrentUser } from "@/lib/auth";
import {
  calculateAge,
  getBirthdayAlert,
  getPatientStatusClasses,
  getPatientStatusLabel,
  getPatientTypeLabel,
} from "@/lib/patient-utils";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n-server";

type TimelineItem = {
  id: string;
  type: "report" | "appointment";
  title: string;
  subtitle: string;
  date: Date;
  href?: string;
  badge: string;
};

export default async function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCurrentUser();
  const { t, lang } = await getServerT();
  const locale = lang === "en" ? "en-US" : "es-ES";
  const { id } = await params;

  if (!id) notFound();

  const patient = await prisma.patient.findFirst({
    where: {
      id,
      deletedAt: null,
      OR: [{ userId: user.id }, { userId: null }],
    },
    include: {
      reports: {
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
      },
      appointments: {
        where: { deletedAt: null },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!patient) return notFound();

  const upcomingAppointments = patient.appointments.filter((appointment) => appointment.date >= new Date());
  const completedReports = patient.reports.filter((report) => report.status === "Finalizado" || report.status === "Completado");
  const patientStatus = patient.status || (patient.active ? "activo" : "pasivo");
  const age = calculateAge(patient.birthDate);
  const birthdayAlert = getBirthdayAlert(patient.birthDate, patient.patientType);

  const timeline: TimelineItem[] = [
    ...patient.reports.map((report) => ({
      id: report.id,
      type: "report" as const,
      title: report.title,
      subtitle: report.status,
      date: report.updatedAt,
      href: `/dashboard/history/${report.id}`,
      badge: report.type,
    })),
    ...patient.appointments.map((appointment) => ({
      id: appointment.id,
      type: "appointment" as const,
      title: appointment.title,
      subtitle: appointment.type,
      date: appointment.date,
      href: appointment.type === "Videoconsulta" ? `/dashboard/video?appointment=${appointment.id}` : undefined,
      badge: appointment.status,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/patients" className="btn btn-ghost btn-icon rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-secondary-text md:text-3xl">{t("Ficha del paciente")}</h1>
          <p className="text-sm font-medium text-slate-500">{t("Información y seguimiento del paciente.")}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-[#f5f8ff] to-[#eaf1ff] p-6 shadow-sm">
            <div className={`absolute right-0 top-0 h-44 w-44 rounded-full opacity-15 blur-3xl ${patient.color}`} />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className={`flex h-20 w-20 items-center justify-center rounded-[24px] text-3xl font-black text-white shadow-lg ${patient.color}`}>
                  {patient.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-secondary-text">{patient.name}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{getPatientTypeLabel(patient.patientType)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-500 shadow-sm">
                      ID {patient.id.slice(0, 8)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${getPatientStatusClasses(patientStatus)}`}>
                      {getPatientStatusLabel(patientStatus)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link href={`/dashboard/new-report?patient=${patient.id}`} className="btn btn-primary">
                  <Plus className="h-4 w-4" /> {t("Nuevo informe")}
                </Link>
                <PatientEditSheet
                  patient={{
                    id: patient.id,
                    name: patient.name,
                    email: patient.email,
                    phone: patient.phone,
                    dni: patient.dni,
                    birthDate: patient.birthDate?.toISOString() || null,
                    address: patient.address,
                    patientType: patient.patientType,
                    status: patient.status,
                    guardianName: patient.guardianName,
                    guardianDni: patient.guardianDni,
                    guardianPhone: patient.guardianPhone,
                    guardianEmail: patient.guardianEmail,
                    clinicalAlerts: patient.clinicalAlerts,
                  }}
                />
              </div>
            </div>

            <div className="relative mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Informes</p>
                <p className="mt-2 text-3xl font-black text-secondary-text">{patient.reports.length}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t("Datos personales")}</p>
                <p className="mt-2 text-3xl font-black text-secondary-text">{completedReports.length}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t("Contacto")}</p>
                <p className="mt-2 text-3xl font-black text-secondary-text">{upcomingAppointments.length}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="card p-6">
              <h3 className="text-lg font-extrabold text-secondary-text">{t("Información básica")}</h3>
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t("Documento")}</p>
                    <p className="mt-2 text-sm font-semibold text-secondary-text">{patient.dni || t("Sin datos")}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t("DNI")}</p>
                    <p className="mt-2 text-sm font-semibold text-secondary-text">{age !== null ? `${age} {t("años")}` : t("Sin datos")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t("Teléfono")}</p>
                    <p className="text-sm font-semibold text-secondary-text">{patient.phone || t("Sin datos")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t("Email")}</p>
                    <p className="text-sm font-semibold text-secondary-text">{patient.email || t("Sin datos")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t("Fecha de nacimiento")}</p>
                    <p className="text-sm font-semibold text-secondary-text">
                      {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString(locale) : t("Sin datos")}
                    </p>
                  </div>
                </div>
                {birthdayAlert && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-amber-700">{t("Alertas clínicas")}</p>
                    <p className="mt-2 text-sm font-semibold text-amber-900">{birthdayAlert}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-extrabold text-secondary-text">{t("Apoderado / tutor")}</h3>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t("Nombre del apoderado")}</p>
                  <p className="mt-2 text-sm font-semibold text-secondary-text">{patient.guardianName || t("Sin datos")}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t("DNI del apoderado")}</p>
                    <p className="mt-2 text-sm font-semibold text-secondary-text">{patient.guardianDni || t("Sin datos")}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t("Teléfono")}</p>
                    <p className="mt-2 text-sm font-semibold text-secondary-text">{patient.guardianPhone || t("Sin datos")}</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t("Email")}</p>
                  <p className="mt-2 text-sm font-semibold text-secondary-text">{patient.guardianEmail || t("Sin datos")}</p>
                </div>
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-red-600">{t("Eliminar paciente")}</p>
                      <p className="mt-2 text-sm font-semibold text-red-900">
                         {patient.clinicalAlerts || t("Sin alertas registradas.")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-extrabold text-secondary-text">{t("Notas clínicas")}</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-500">
                {timeline.length} {t("notas")}
              </span>
            </div>

            {timeline.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
                Todavia no hay actividad clinica registrada para este paciente.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {timeline.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex gap-4 rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                    <div className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.type === "report" ? "bg-primary-light text-primary" : "bg-emerald-50 text-emerald-600"}`}>
                      {item.type === "report" ? <FileText className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-secondary-text">{item.title}</p>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                          {item.badge}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-500">{item.subtitle}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {item.date.toLocaleString(locale)}
                      </p>
                    </div>
                    {item.href && (
                      <Link href={item.href} className="btn btn-ghost self-center text-primary hover:bg-white">
                        {t("Ver")}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-secondary-text">{t("Documentos")}</h3>
              <Link href={`/dashboard/new-report?patient=${patient.id}`} className="text-sm font-bold text-primary hover:underline">
                {t("Sin documentos vinculados.")}
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {patient.reports.length === 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
                  {t("(privado)")}
                </div>
              ) : (
                patient.reports.slice(0, 5).map((report) => (
                  <Link key={report.id} href={`/dashboard/history/${report.id}`} className="block rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:border-primary/20 hover:bg-white">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-secondary-text">{report.title}</p>
                      {report.status === "Finalizado" || report.status === "Completado" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-600" />
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{new Date(report.updatedAt).toLocaleDateString(locale)}</p>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-secondary-text">{t("Consentimientos")}</h3>
              <Link href="/dashboard/calendar" className="text-sm font-bold text-primary hover:underline">
                {t("Sin consentimientos.")}
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {patient.appointments.length === 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
                  {t("Enviar a papelera")}
                </div>
              ) : (
                patient.appointments.slice(0, 6).map((appointment) => (
                  <div key={appointment.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-secondary-text">{appointment.title}</p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {appointment.type}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{new Date(appointment.date).toLocaleString(locale)}</p>
                    {appointment.type === "Videoconsulta" && (
                      <Link href={`/dashboard/video?appointment=${appointment.id}`} className="btn btn-ghost mt-3 text-primary hover:bg-white">
                        <Video className="h-4 w-4" /> {t("Unirse a videoconsulta")}
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-extrabold text-secondary-text">{t("Agenda")}</h3>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t("Próximas citas")}</p>
                <p className="mt-2 text-sm font-semibold text-secondary-text">{getPatientTypeLabel(patient.patientType)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t("Sin citas próximas.")}</p>
                <p className="mt-2 text-sm font-semibold text-secondary-text">{patient.address || t("Sin datos")}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <UserSquare2 className="h-4 w-4 text-primary" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t("Dirección")}</p>
                </div>
                <p className="mt-2 text-sm font-semibold text-secondary-text">{getPatientStatusLabel(patientStatus)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


