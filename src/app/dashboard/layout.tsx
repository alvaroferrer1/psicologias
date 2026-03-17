import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { requireCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCurrentUser();

  return (
    <div className="flex h-screen overflow-hidden bg-secondary-bg">
      <Sidebar user={user} />

      <div className="flex-[1] flex min-w-0 flex-col overflow-hidden">
        <Topbar user={user} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
