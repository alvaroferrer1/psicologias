import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle2, Clock, FileText, Mail, Phone, Plus, Video } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

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
  const { id } = await params;

  if (!id) {
    notFound();
  }

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
          <h1 className="text-2xl font-extrabold tracking-tight text-secondary-text md:text-3xl">Ficha del paciente</h1>
          <p className="text-sm font-medium text-slate-500">Seguimiento clinico, informes y actividad reciente.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-[#f7fbfa] to-[#eef8f5] p-6 shadow-sm">
            <div className={`absolute right-0 top-0 h-44 w-44 rounded-full opacity-15 blur-3xl ${patient.color}`} />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className={`flex h-20 w-20 items-center justify-center rounded-[24px] text-3xl font-black text-white shadow-lg ${patient.color}`}>
                  {patient.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-secondary-text">{patient.name}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{patient.description || "Seguimiento clinico"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-500 shadow-sm">
                      ID {patient.id.slice(0, 8)}
                    </span>
                    <span className="rounded-full bg-primary-light px-3 py-1 text-[11px] font-black uppercase tracking-wider text-primary">
                      {patient.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link href={`/dashboard/new-report?patient=${patient.id}`} className="btn btn-primary">
                  <Plus className="h-4 w-4" /> Nuevo informe
                </Link>
                <Link href={`/dashboard/patients/${patient.id}/history`} className="btn btn-secondary">
                  <FileText className="h-4 w-4" /> Ver historial completo
                </Link>
              </div>
            </div>

            <div className="relative mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Informes</p>
                <p className="mt-2 text-3xl font-black text-secondary-text">{patient.reports.length}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Finalizados</p>
                <p className="mt-2 text-3xl font-black text-secondary-text">{completedReports.length}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Proximas citas</p>
                <p className="mt-2 text-3xl font-black text-secondary-text">{upcomingAppointments.length}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="card p-6">
              <h3 className="text-lg font-extrabold text-secondary-text">Datos de contacto</h3>
              <div className="mt-5 space-y-4">
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Telefono</p>
                    <p className="text-sm font-semibold text-secondary-text">{patient.phone || "No especificado"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Email</p>
                    <p className="text-sm font-semibold text-secondary-text">{patient.email || "No especificado"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Alta</p>
                    <p className="text-sm font-semibold text-secondary-text">{new Date(patient.createdAt).toLocaleDateString("es-ES")}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-extrabold text-secondary-text">Proxima accion recomendada</h3>
              <div className="mt-5 rounded-[24px] border border-primary/15 bg-primary-light/60 p-5">
                {upcomingAppointments.length > 0 ? (
                  <>
                    <p className="text-xs font-black uppercase tracking-widest text-primary">Siguiente cita</p>
                    <p className="mt-2 text-lg font-black text-secondary-text">{upcomingAppointments[0].title}</p>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      {new Date(upcomingAppointments[0].date).toLocaleString("es-ES")}
                    </p>
                    {upcomingAppointments[0].type === "Videoconsulta" && (
                      <Link href={`/dashboard/video?appointment=${upcomingAppointments[0].id}`} className="btn btn-primary mt-4">
                        <Video className="h-4 w-4" /> Entrar en sala
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-600">
                      No hay citas futuras programadas. Conviene dejar la siguiente sesion cerrada para mantener continuidad.
                    </p>
                    <Link href="/dashboard/calendar" className="btn btn-primary mt-4">
                      <Calendar className="h-4 w-4" /> Programar cita
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-extrabold text-secondary-text">Timeline clinica</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-500">
                {timeline.length} eventos
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
                        {item.date.toLocaleString("es-ES")}
                      </p>
                    </div>
                    {item.href && (
                      <Link href={item.href} className="btn btn-ghost self-center text-primary hover:bg-white">
                        Abrir
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
              <h3 className="text-lg font-extrabold text-secondary-text">Informes</h3>
              <Link href={`/dashboard/new-report?patient=${patient.id}`} className="text-sm font-bold text-primary hover:underline">
                Crear
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {patient.reports.length === 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
                  No hay informes vinculados todavia.
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
                    <p className="mt-2 text-sm text-slate-500">{new Date(report.updatedAt).toLocaleDateString("es-ES")}</p>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-secondary-text">Citas</h3>
              <Link href="/dashboard/calendar" className="text-sm font-bold text-primary hover:underline">
                Ver agenda
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {patient.appointments.length === 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
                  No hay citas registradas.
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
                    <p className="mt-2 text-sm text-slate-500">{new Date(appointment.date).toLocaleString("es-ES")}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
