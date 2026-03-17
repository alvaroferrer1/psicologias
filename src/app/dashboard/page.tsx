import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, FileText, Plus, ShieldCheck, Users, Video } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const ownershipFilter = { OR: [{ userId: user.id }, { userId: null }], deletedAt: null as null };

  const totalPatients = await prisma.patient.count({ where: ownershipFilter });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const reportsThisMonth = await prisma.report.count({
    where: { ...ownershipFilter, createdAt: { gte: startOfMonth } },
  });

  const pendingReports = await prisma.report.count({
    where: { ...ownershipFilter, status: { in: ["Borrador", "En revisión", "En revisiÃ³n"] } },
  });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const sessionsToday = await prisma.appointment.count({
    where: { ...ownershipFilter, date: { gte: startOfDay, lte: endOfDay } },
  });

  const recentReports = await prisma.report.findMany({
    where: ownershipFilter,
    include: { patient: true },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  const upcomingAppointments = await prisma.appointment.findMany({
    where: { ...ownershipFilter, date: { gte: new Date() } },
    include: { patient: true },
    orderBy: { date: "asc" },
    take: 5,
  });

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 13 ? "Buenos dias" : greetingHour < 20 ? "Buenas tardes" : "Buenas noches";

  const focusItems = [
    {
      label: "Sesion mas cercana",
      value: upcomingAppointments[0]
        ? `${upcomingAppointments[0].patient?.name || "Paciente"} · ${new Date(upcomingAppointments[0].date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : "No hay citas cercanas",
    },
    {
      label: "Borradores pendientes",
      value: `${pendingReports} por revisar`,
    },
    {
      label: "Pacientes activos",
      value: `${totalPatients} en seguimiento`,
    },
  ];

  const stats = [
    { label: "Pacientes activos", value: String(totalPatients), icon: Users, tone: "bg-primary-light text-primary" },
    { label: "Informes del mes", value: String(reportsThisMonth), icon: FileText, tone: "bg-emerald-50 text-emerald-600" },
    { label: "Pendientes", value: String(pendingReports), icon: Clock, tone: "bg-amber-50 text-amber-600" },
    { label: "Sesiones hoy", value: String(sessionsToday), icon: CalendarDays, tone: "bg-teal-50 text-teal-600" },
  ];

  const quickActions = [
    { href: "/dashboard/new-report", label: "Nuevo informe", icon: Plus },
    { href: "/dashboard/patients", label: "Abrir pacientes", icon: Users },
    { href: "/dashboard/calendar", label: "Ver agenda", icon: CalendarDays },
    { href: "/dashboard/video", label: "Videoconsulta", icon: Video },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="rounded-[30px] border border-slate-200 bg-gradient-to-br from-white via-[#f8fcfb] to-[#ecf7f3] p-6 shadow-sm lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Panel clinico</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-secondary-text md:text-4xl">
              {greeting}, {user.name?.split(" ")[0] || "Especialista"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-600 md:text-base">
              Tienes {sessionsToday} sesiones hoy y {pendingReports} informes pendientes. Este panel te deja entrar rapido a lo
              importante sin ir saltando entre pantallas.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href} className="btn btn-secondary">
                  <action.icon className="h-4 w-4" /> {action.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[26px] border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Foco del dia</p>
            <div className="mt-4 space-y-3">
              {focusItems.map((item) => (
                <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                  <p className="mt-1 text-sm font-bold text-secondary-text">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.tone}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <p className="mt-5 text-3xl font-black text-secondary-text">{stat.value}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-extrabold text-secondary-text">Informes recientes</h3>
                <p className="text-sm text-slate-500">Tus ultimos informes y borradores activos.</p>
              </div>
              <Link href="/dashboard/history" className="text-sm font-bold text-primary hover:underline">
                Ver todos
              </Link>
            </div>

            {recentReports.length === 0 ? (
              <div className="p-10 text-center text-sm font-medium text-slate-500">
                No hay informes todavia. <Link href="/dashboard/new-report" className="font-bold text-primary hover:underline">Crear uno nuevo</Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentReports.map((report) => {
                  const isCompleted = report.status === "Completado" || report.status === "Finalizado";
                  return (
                    <Link key={report.id} href={`/dashboard/history/${report.id}`} className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-secondary-text">{report.title}</p>
                        <p className="truncate text-sm text-slate-500">{report.patient?.name || "Paciente sin asignar"}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {report.status}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-[26px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-secondary-text">Cumplimiento y actividad</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                  Tienes auditoria, sesiones persistentes y trazabilidad de informes. Puedes revisar toda la actividad desde el modulo de control.
                </p>
                <Link href="/dashboard/audit" className="btn btn-secondary mt-4">
                  Abrir auditoria
                </Link>
              </div>
            </div>
          </section>
        </div>

        <section className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-secondary-text">Proximas sesiones</h3>
              <p className="text-sm text-slate-500">Agenda inmediata y accesos directos.</p>
            </div>
            <Link href="/dashboard/calendar" className="text-sm font-bold text-primary hover:underline">
              Agenda completa
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {upcomingAppointments.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
                No hay sesiones programadas.
              </div>
            ) : (
              upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-secondary-text">{appointment.patient?.name || "Paciente"}</p>
                      <p className="truncate text-sm text-slate-500">{appointment.title}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {appointment.type}
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {new Date(appointment.date).toLocaleString("es-ES")}
                  </p>
                  {appointment.type === "Videoconsulta" && (
                    <Link href={`/dashboard/video?appointment=${appointment.id}`} className="btn btn-primary mt-3">
                      <Video className="h-4 w-4" /> Entrar ahora
                    </Link>
                  )}
                </div>
              ))
            )}

            <Link href="/dashboard/history" className="flex items-center justify-center gap-1 pt-2 text-sm font-bold text-primary hover:underline">
              Ir a informes <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
