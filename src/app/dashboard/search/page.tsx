import Link from "next/link";
import { CalendarDays, FileText, Search, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireCurrentUser();
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
            <h1 className="text-2xl font-extrabold tracking-tight text-secondary-text md:text-3xl">Busqueda global</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {query ? `Resultados para "${query}"` : "Usa la barra superior para buscar pacientes, informes y citas."}
            </p>
          </div>
        </div>
      </div>

      {query && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Pacientes</p>
            <p className="mt-2 text-3xl font-black text-secondary-text">{patients.length}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Informes</p>
            <p className="mt-2 text-3xl font-black text-secondary-text">{reports.length}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Citas</p>
            <p className="mt-2 text-3xl font-black text-secondary-text">{appointments.length}</p>
          </div>
        </div>
      )}

      {query && totalResults === 0 && (
        <div className="card p-10 text-center">
          <p className="text-lg font-bold text-secondary-text">No se encontraron resultados</p>
          <p className="mt-2 text-sm text-slate-500">Prueba con otro nombre, tipo de informe, email, telefono o modalidad.</p>
        </div>
      )}

      {patients.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-extrabold text-secondary-text">Pacientes</h2>
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
                    <p className="truncate text-sm text-slate-500">{patient.description || "Paciente"}</p>
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
            <h2 className="text-lg font-extrabold text-secondary-text">Informes</h2>
          </div>
          <div className="card overflow-hidden">
            <div className="divide-y divide-slate-100">
              {reports.map((report) => (
                <Link key={report.id} href={`/dashboard/history/${report.id}`} className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-secondary-text">{report.title}</p>
                    <p className="truncate text-sm text-slate-500">{report.patient?.name || "Paciente sin asignar"}</p>
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
            <h2 className="text-lg font-extrabold text-secondary-text">Citas</h2>
          </div>
          <div className="card overflow-hidden">
            <div className="divide-y divide-slate-100">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-secondary-text">{appointment.title}</p>
                    <p className="truncate text-sm text-slate-500">
                      {appointment.patient?.name || "Paciente"} · {new Date(appointment.date).toLocaleString("es-ES")}
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
