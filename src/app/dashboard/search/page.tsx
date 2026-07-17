import Link from "next/link";
import { CalendarDays, FileText, Search, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { getServerT } from "@/lib/i18n-server";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { t, lang } = await getServerT();
  const user = await requireCurrentUser();
  const locale = lang === "en" ? "en-US" : "es-ES";
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q?.trim() || "";
  const ownershipFilter = [{ userId: user.id }, { userId: null }];

  const [patients, reports, appointments] = query
    ? await Promise.all([
        prisma.patient.findMany({
          where: {
            deletedAt: null,
            OR: ownershipFilter,
            AND: [
              {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { email: { contains: query, mode: "insensitive" } },
                  { phone: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                ],
              },
            ],
          },
          take: 8,
          orderBy: { updatedAt: "desc" },
        }),
        prisma.report.findMany({
          where: {
            deletedAt: null,
            OR: ownershipFilter,
            AND: [
              {
                OR: [
                  { title: { contains: query, mode: "insensitive" } },
                  { patient: { name: { contains: query, mode: "insensitive" } } },
                ],
              },
            ],
          },
          include: { patient: true },
          take: 8,
          orderBy: { updatedAt: "desc" },
        }),
        prisma.appointment.findMany({
          where: {
            deletedAt: null,
            OR: ownershipFilter,
            AND: [
              {
                OR: [
                  { title: { contains: query, mode: "insensitive" } },
                  { patient: { name: { contains: query, mode: "insensitive" } } },
                  { type: { contains: query, mode: "insensitive" } },
                ],
              },
            ],
          },
          include: { patient: true },
          take: 8,
          orderBy: { date: "desc" },
        }),
      ])
    : [[], [], []];

  const totalResults = patients.length + reports.length + appointments.length;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-[#f7fbfa] to-[#eef8f5] p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
            <Search className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-secondary-text md:text-3xl">{t("Resultados de búsqueda")}</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {query ? `${t("Resultados para")} "${query}"` : t("Sin resultados")}
            </p>
          </div>
        </div>
      </div>

      {query && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t("Pacientes")}</p>
            <p className="mt-2 text-3xl font-black text-secondary-text">{patients.length}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t("Informes")}</p>
            <p className="mt-2 text-3xl font-black text-secondary-text">{reports.length}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t("Citas")}</p>
            <p className="mt-2 text-3xl font-black text-secondary-text">{appointments.length}</p>
          </div>
        </div>
      )}

      {query && totalResults === 0 && (
        <div className="card p-10 text-center">
          <p className="text-lg font-bold text-secondary-text">{t("Sin coincidencias")}</p>
          <p className="mt-2 text-sm text-slate-500">{t("No encontramos resultados para tu búsqueda.")}</p>
        </div>
      )}

      {patients.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-extrabold text-secondary-text">{t("Pacientes")}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {patients.map((patient) => (
              <Link key={patient.id} href={`/dashboard/patients/${patient.id}`} className="card group p-5 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black text-white ${patient.color}`}>
                    {patient.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-secondary-text">{patient.name}</p>
                    <p className="truncate text-sm text-slate-500">{patient.description || t("Sin descripción")}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {reports.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-extrabold text-secondary-text">{t("Informes")}</h2>
          </div>
          <div className="card overflow-hidden">
            <div className="divide-y divide-slate-100">
              {reports.map((report) => (
                <Link key={report.id} href={`/dashboard/history/${report.id}`} className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-secondary-text">{report.title}</p>
                    <p className="truncate text-sm text-slate-500">{report.patient?.name || t("Paciente sin asignar")}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-500">
                    {report.status}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {appointments.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-extrabold text-secondary-text">{t("Citas")}</h2>
          </div>
          <div className="card overflow-hidden">
            <div className="divide-y divide-slate-100">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-secondary-text">{appointment.title}</p>
                    <p className="truncate text-sm text-slate-500">
                      {appointment.patient?.name || t("Sin descripción")} Â· {new Date(appointment.date).toLocaleString(locale)}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">
                    {appointment.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
