"use client";

import { useState } from "react";
import { Copy, MailPlus } from "lucide-react";
import { createInvitation } from "@/app/actions/auth";
import { useToast } from "@/components/ToastProvider";
import { getRoleLabel } from "@/lib/permissions";

type UserItem = {
  id: string;
  name: string;
  email: string;
  dni?: string | null;
  role: string;
  createdAt: string;
};

type InvitationItem = {
  id: string;
  email: string;
  role: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  invitedBy: string;
};

export function TeamInvitesClient({ users, invitations }: { users: UserItem[]; invitations: InvitationItem[] }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("PSYCHOLOGIST");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const res = await createInvitation({ email, role });
    if (res.success) {
      setEmail("");
      toast({
        type: res.emailSent ? "success" : "info",
        title: res.emailSent ? "Invitacion enviada." : "Invitacion creada.",
        description: res.emailSent
          ? "El correo se ha enviado al email indicado."
          : "No hay proveedor de correo configurado. Se ha copiado el enlace para enviarlo manualmente.",
      });
      if (res.invitationUrl) {
        await navigator.clipboard.writeText(res.invitationUrl);
      }
      window.location.reload();
    } else {
      toast({ type: "error", title: res.error || "No se pudo crear la invitacion." });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-lg font-extrabold text-secondary-text">Invitar psicologa por email</h2>
        <form onSubmit={handleCreate} className="mt-5 grid gap-4 md:grid-cols-[1fr_220px_auto]">
          <input className="inp" type="email" placeholder="email@centro.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <select className="inp" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="PSYCHOLOGIST">Psicologa</option>
            <option value="READONLY">Lectura</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button className="btn btn-primary" disabled={loading} type="submit">
            <MailPlus className="h-4 w-4" /> Enviar invitacion
          </button>
        </form>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-extrabold text-secondary-text">Invitaciones</h2>
          <div className="mt-4 space-y-3">
            {invitations.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">No hay invitaciones todavia.</div>
            ) : invitations.map((invitation) => {
              const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
              const url = `${baseUrl}/?mode=register&invite=${invitation.token}&email=${encodeURIComponent(invitation.email)}`;
              return (
                <div key={invitation.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-secondary-text">{invitation.email}</p>
                      <p className="text-sm text-slate-500">{getRoleLabel(invitation.role)} - invito {invitation.invitedBy}</p>
                    </div>
                    <button type="button" onClick={() => navigator.clipboard.writeText(url)} className="btn btn-ghost">
                      <Copy className="h-4 w-4" /> Copiar
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {invitation.acceptedAt ? `Aceptada: ${new Date(invitation.acceptedAt).toLocaleString("es-ES")}` : `Caduca: ${new Date(invitation.expiresAt).toLocaleString("es-ES")}`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-extrabold text-secondary-text">Usuarios del sistema</h2>
          <div className="mt-4 space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-secondary-text">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                    {user.dni && <p className="text-xs text-slate-400">DNI: {user.dni}</p>}
                  </div>
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-blue-700">
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">Alta: {new Date(user.createdAt).toLocaleDateString("es-ES")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
