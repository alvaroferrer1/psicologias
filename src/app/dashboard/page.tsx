import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, FileText, Plus, ShieldCheck, Users, Video } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { getBirthdayAlert } from "@/lib/patient-utils";
import { parseStoredReportContent } from "@/lib/report-content";
import { getReportKindLabel } from "@/lib/report-templates";
import { getServerT } from "@/lib/i18n-server";

type DonutSegment = { label: string; value: number; color: string };

function PatientStatusDonut({ distribution, total, t }: { distribution: DonutSegment[]; total: number; t: (k: string) => string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  const arcs = distribution.map((segment, index) => {
    const fraction = total > 0 ? segment.value / total : 0;
    const previous = distribution
      .slice(0, index)
      .reduce((acc, prev) => acc + (total > 0 ? prev.value / total : 0) * circumference, 0);
    return {
      key: segment.label,
      color: segment.color,
      dash: fraction * circumference,
      gap: circumference - fraction * circumference,
      strokeOffset: -previous,
    };
  });

  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--color-secondary-border)" strokeWidth="14" />
        {arcs.map((arc) => (
          <circle
            key={arc.key}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth="14"
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={arc.strokeOffset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-secondary-text">{total}</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("nav.patients")}</span>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const { t, lang } = await getServerT();
  const locale = lang === "en" ? "en-US" : "es-ES";
  const user = await requireCurrentUser();
  const ownershipFilter = { OR: [{ userId: user.id }, { userId: null }], deletedAt: null as null };

  const activePatients = await prisma.patient.count({ where: { ...ownershipFilter, status: "activo" } });
  const pausedPatients = await prisma.patient.count({ where: { ...ownershipFilter, status: "pausa" } });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const reportsThisMonth = await prisma.report.count({
    where: { ...ownershipFilter, createdAt: { gte: startOfMonth } },
  });

  const pendingReports = await prisma.report.count({
    where: { ...ownershipFilter, status: { in: ["Borrador", "En revision", "En revisión"] } },
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

  const patientsForBirthdays = await prisma.patient.findMany({
    where: { ...ownershipFilter, patientType: { in: ["infantil", "adolescente"] } },
    orderBy: { updatedAt: "desc" },
    take: 12,
  });

  const birthdayAlerts = patientsForBirthdays
    .map((patient) => ({
      id: patient.id,
      name: patient.name,
      alert: getBirthdayAlert(patient.birthDate, patient.patientType),
    }))
    .filter((item): item is { id: string; name: string; alert: string } => Boolean(item.alert))
    .slice(0, 3);

  const [totalPatients, pausedCount, passiveCount, auditCount, completedReports, consentCount] = await Promise.all([
    prisma.patient.count({ where: ownershipFilter }),
    prisma.patient.count({ where: { ...ownershipFilter, status: "pausa" } }),
    prisma.patient.count({ where: { ...ownershipFilter, status: "pasivo" } }),
    prisma.auditLog.count({ where: { userId: user.id } }),
    prisma.report.count({ where: { ...ownershipFilter, status: { in: ["Completado", "Finalizado"] } } }),
    prisma.consentRecord.count({ where: { userId: user.id, status: { not: "revocado" } } }),
  ]);

  const statusDistribution = [
    { label: t("patients.status.activo"), value: activePatients, color: "#1967d2" },
    { label: t("patients.status.pausa"), value: pausedCount, color: "#f59e0b" },
    { label: t("patients.status.pasivo"), value: passiveCount, color: "#94a3b8" },
  ];
  const distributionTotal = Math.max(totalPatients, 1);

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 13 ? t("dash.greeting.morning") : greetingHour < 20 ? t("dash.greeting.afternoon") : t("dash.greeting.evening");

  const focusItems = [
    {
      label: t("dash.focus.nextSession"),
      value: upcomingAppointments[0]
        ? `${upcomingAppointments[0].patient?.name || t("patients.title")} - ${new Date(upcomingAppointments[0].date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : t("dash.focus.noSession"),
    },
    {
      label: t("dash.focus.pendingDrafts"),
      value: `${pendingReports} ${t("dash.focus.toReview")}`,
    },
    {
      label: t("dash.focus.activePatients"),
      value: `${activePatients} ${t("dash.focus.inFollowUp")}`,
    },
    {
      label: t("dash.focus.pausedPatients"),
      value: `${pausedPatients} ${t("dash.focus.paused")}`,
    },
  ];

  const stats = [
    { label: t("dash.patientsActive"), value: String(activePatients), icon: Users, tone: "bg-primary-light text-primary" },
    { label: t("dash.patientsPaused"), value: String(pausedPatients), icon: Clock, tone: "bg-amber-50 text-amber-600" },
    { label: t("dash.reportsMonth"), value: String(reportsThisMonth), icon: FileText, tone: "bg-emerald-50 text-emerald-600" },
    { label: t("dash.pending"), value: String(pendingReports), icon: FileText, tone: "bg-blue-50 text-blue-600" },
    { label: t("dash.sessionsToday"), value: String(sessionsToday), icon: CalendarDays, tone: "bg-teal-50 text-teal-600" },
  ];

  const quickActions = [
    { href: "/dashboard/new-report", label: t("dash.newReport"), icon: Plus },
    { href: "/dashboard/patients", label: t("nav.patients"), icon: Users },
    { href: "/dashboard/calendar", label: t("nav.calendar"), icon: CalendarDays },
    { href: "/dashboard/video", label: t("nav.video"), icon: Video },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="animate-in fade-in slide-in-from-top-4 rounded-[30px] border border-slate-200 bg-gradient-to-br from-white via-[#f8fcfb] to-[#ecf7f3] p-6 shadow-sm duration-700 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">{t("dash.panelLabel")}</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-secondary-text md:text-4xl">
              {greeting}, <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">{user.name?.split(" ")[0] || t("dash.specialist")}</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-600 md:text-base">
              {t("dash.intro1")} <span className="font-bold text-primary">{sessionsToday}</span> {t("dash.intro2")} <span className="font-bold text-primary">{pendingReports}</span> {t("dash.intro3")}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {quickActions.map((action, i) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="btn btn-secondary animate-in fade-in slide-in-from-bottom-3 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ animationDelay: `${120 + i * 70}ms` }}
                >
                  <action.icon className="h-4 w-4" /> {action.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[26px] border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t("dash.dayFocus")}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {focusItems.map((item, i) => (
                <div key={item.label} className="animate-in fade-in slide-in-from-bottom-3 rounded-2xl bg-slate-50 p-4" style={{ animationDelay: `${200 + i * 60}ms` }}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                  <p className="mt-1 text-sm font-bold leading-tight text-secondary-text">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t("dash.completedReports")}</p>
                <p className="text-xs font-bold text-secondary-text">{completedReports}/{distributionTotal}</p>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.round((completedReports / distributionTotal) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((stat, index) => (
          <div key={stat.label} className="card animate-in fade-in slide-in-from-bottom-3 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg" style={{ animationDelay: `${index * 60}ms` }}>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.tone}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <p className="mt-5 text-3xl font-black text-secondary-text">{stat.value}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { href: "/dashboard/patients", label: t("nav.patients"), desc: t("dash.dirDesc"), icon: Users, delay: 0 },
          { href: "/dashboard/new-report", label: t("dash.newReport"), desc: t("dash.tplDesc"), icon: Plus, delay: 60 },
          { href: "/dashboard/calendar", label: t("nav.calendar"), desc: t("dash.agendaDesc"), icon: CalendarDays, delay: 120 },
          { href: "/dashboard/consents", label: t("patients.consents"), desc: t("dash.consentDesc"), icon: FileText, delay: 180 },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="card animate-in fade-in slide-in-from-bottom-3 flex items-center gap-4 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg"
            style={{ animationDelay: `${item.delay}ms` }}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary">
              <item.icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-secondary-text">{item.label}</p>
              <p className="truncate text-xs text-slate-500">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-extrabold text-secondary-text">{t("dash.recentReports")}</h3>
                <p className="text-sm text-slate-500">{t("dash.recentReportsDesc")}</p>
              </div>
              <Link href="/dashboard/history" className="text-sm font-bold text-primary hover:underline">
                {t("dash.viewAll")}
              </Link>
            </div>

            {recentReports.length === 0 ? (
              <div className="p-10 text-center text-sm font-medium text-slate-500">
                {t("dash.noReportsYet")} <Link href="/dashboard/new-report" className="font-bold text-primary hover:underline">{t("dash.createOne")}</Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentReports.map((report) => {
                  const isCompleted = report.status === "Completado" || report.status === "Finalizado";
                  const parsed = parseStoredReportContent(report.content);
                  return (
                    <Link key={report.id} href={`/dashboard/history/${report.id}`} className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-sm ${isCompleted ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-blue-100 bg-blue-50 text-primary"}`}>
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-secondary-text">{report.title}</p>
                           <p className="truncate text-sm text-slate-500">{report.patient?.name || t("patients.unassigned")} - {getReportKindLabel(parsed.meta?.kind || "informe")}</p>
                        </div>
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
              <div className="min-w-0">
                <h3 className="text-lg font-extrabold text-secondary-text">{t("dash.compliance")}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                  {t("dash.compliance1")} <span className="font-bold text-secondary-text">{auditCount}</span> {t("dash.compliance2")},{" "}
                  <span className="font-bold text-secondary-text">{consentCount}</span> {t("dash.compliance3")}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/dashboard/audit" className="btn btn-secondary">
                    {t("dash.openAudit")}
                  </Link>
                  <Link href="/dashboard/consents" className="btn btn-ghost">
                    {t("dash.viewConsents")}
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-secondary-text">{t("dash.patientPortfolio")}</h3>
                <p className="text-sm text-slate-500">{t("dash.patientPortfolioDesc")}</p>
              </div>
              <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">
                {totalPatients} total
              </span>
            </div>

            <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              <PatientStatusDonut distribution={statusDistribution} total={distributionTotal} t={t} />
              <ul className="flex-1 space-y-3">
                {statusDistribution.map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-bold text-secondary-text">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-secondary-text">{item.value}</span>
                      <span className="w-12 text-right text-xs font-semibold text-slate-400">
                        {Math.round((item.value / distributionTotal) * 100)}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <section className="card p-6">
          <div className="flex items-center justify-between">
            <div>
                <h3 className="text-lg font-extrabold text-secondary-text">{t("dash.upcomingSessions")}</h3>
                <p className="text-sm text-slate-500">{t("dash.upcomingDesc")}</p>
              </div>
              <Link href="/dashboard/calendar" className="text-sm font-bold text-primary hover:underline">
                {t("dash.fullAgenda")}
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {birthdayAlerts.length > 0 && (
                <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-amber-700">{t("dash.birthdayAlerts")}</p>
                  <div className="mt-3 space-y-2">
                    {birthdayAlerts.map((item) => (
                      <p key={item.id} className="text-sm font-semibold text-amber-900">{item.name}: {item.alert}</p>
                    ))}
                  </div>
                </div>
              )}
              {upcomingAppointments.length === 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
                   {t("dash.noScheduledSessions")}
                </div>
              ) : (
                <ol className="relative space-y-4 border-l-2 border-slate-100 pl-5">
                  {upcomingAppointments.map((appointment) => {
                    const isVideo = appointment.type === "Videoconsulta";
                    return (
                      <li key={appointment.id} className="relative">
                        <span className={`absolute -left-[26px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${isVideo ? "bg-purple-500" : "bg-emerald-500"}`} />
                        <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-bold text-secondary-text">{appointment.patient?.name || t("patients.unassigned")}</p>
                              <p className="truncate text-sm text-slate-500">{appointment.title}</p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                              {appointment.type}
                            </span>
                          </div>
                          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            {new Date(appointment.date).toLocaleString(t("locale.date"))}
                          </p>
                          {isVideo && (
                            <Link href={`/dashboard/video?appointment=${appointment.id}`} className="btn btn-primary mt-3">
                              <Video className="h-4 w-4" /> {t("dash.joinNow")}
                            </Link>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}

              <Link href="/dashboard/history" className="flex items-center justify-center gap-1 pt-2 text-sm font-bold text-primary hover:underline">
                {t("dash.goToReports")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
        </section>
      </div>
    </div>
  );
}
