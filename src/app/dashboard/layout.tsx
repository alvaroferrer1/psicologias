import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { OnboardingTour } from "@/components/OnboardingTour";
import { SessionRefresher } from "@/components/SessionRefresher";
import { IncomingCallBanner } from "@/components/IncomingCallBanner";
import { DashboardDensity } from "@/components/DashboardDensity";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBirthdayAlert } from "@/lib/patient-utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCurrentUser();
  const ownershipFilter = { OR: [{ userId: user.id }, { userId: null }], deletedAt: null as null };
  const patients = await prisma.patient.findMany({
    where: ownershipFilter,
    select: {
      id: true,
      name: true,
      birthDate: true,
      patientType: true,
      clinicalAlerts: true,
    },
    take: 20,
    orderBy: { updatedAt: "desc" },
  });

  const notifications = patients.flatMap((patient) => {
    const items: Array<{ id: string; title: string; description: string; href: string; kind?: "appointment" | "birthday" | "clinical" }> = [];
    const birthday = getBirthdayAlert(patient.birthDate, patient.patientType);
    if (birthday) {
      items.push({
        id: `birthday-${patient.id}`,
        title: `${patient.name}: ${birthday}`,
        description: "Revisar si hay que avisar o reprogramar la cita.",
        href: `/dashboard/patients/${patient.id}`,
        kind: "birthday",
      });
    }
    if (patient.clinicalAlerts) {
      items.push({
        id: `clinical-${patient.id}`,
        title: `${patient.name}: alerta clínica`,
        description: patient.clinicalAlerts.slice(0, 80),
        href: `/dashboard/patients/${patient.id}`,
        kind: "clinical",
      });
    }
    return items;
  });

  const now = new Date();
  const upcomingAppointments = await prisma.appointment.findMany({
    where: { date: { gte: now }, deletedAt: null },
    include: { patient: true },
    orderBy: { date: "asc" },
    take: 4,
  });

  for (const appointment of upcomingAppointments) {
    notifications.push({
      id: `appointment-${appointment.id}`,
      title: `Cita: ${appointment.patient?.name || "Paciente"}`,
      description: `${appointment.title} · ${new Date(appointment.date).toLocaleString("es-ES", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`,
      href: `/dashboard/calendar`,
      kind: "appointment",
    });
  }

  const topNotifications = notifications.slice(0, 8);

  return (
    <div className={`flex h-screen overflow-hidden bg-secondary-bg ${user.privacyMode ? "privacy-sensitive" : ""}`}>
      <Sidebar user={user} />

      <div className="flex-[1] flex min-w-0 flex-col overflow-hidden">
        <Topbar user={user} notifications={topNotifications} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <DashboardDensity>
            <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              {children}
            </div>
          </DashboardDensity>
        </main>
        <SessionRefresher />
        <OnboardingTour />
        <IncomingCallBanner />
      </div>
    </div>
  );
}
