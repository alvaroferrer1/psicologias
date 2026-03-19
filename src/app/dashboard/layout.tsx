import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
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
    const items: Array<{ id: string; title: string; description: string; href: string }> = [];
    const birthday = getBirthdayAlert(patient.birthDate, patient.patientType);
    if (birthday) {
      items.push({
        id: `birthday-${patient.id}`,
        title: `${patient.name}: ${birthday}`,
        description: "Revisar si hay que avisar o reprogramar la cita.",
        href: `/dashboard/patients/${patient.id}`,
      });
    }
    if (patient.clinicalAlerts) {
      items.push({
        id: `clinical-${patient.id}`,
        title: `${patient.name}: alerta clínica`,
        description: patient.clinicalAlerts.slice(0, 80),
        href: `/dashboard/patients/${patient.id}`,
      });
    }
    return items;
  }).slice(0, 8);

  return (
    <div className="flex h-screen overflow-hidden bg-secondary-bg">
      <Sidebar user={user} />

      <div className="flex-[1] flex min-w-0 flex-col overflow-hidden">
        <Topbar user={user} notifications={notifications} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
