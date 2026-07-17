"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, MailPlus, ShieldAlert, X, Users, CalendarCheck, FileText, Briefcase, IdCard, BadgeCheck, Lock, Activity, Send, UserPlus, Sparkles, ArrowDownRight, CheckCircle2, Clock } from "lucide-react";
import { createInvitation } from "@/app/actions/auth";
import { useToast } from "@/components/ToastProvider";
import { getRoleLabel, isAdminRole } from "@/lib/permissions";
import { useT } from "@/lib/useT";

type UserItem = {
  id: string;
  name: string;
  email: string;
  dni?: string | null;
  role: string;
  colegiado?: string | null;
  specialization?: string | null;
  createdAt: string;
  lockedUntil?: string | null;
  counts?: { patients: number; appointments: number; reports: number };
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

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
  PSYCHOLOGIST: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
  READONLY: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300",
  USER: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
};

const GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-sky-600",
];

function initials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

function gradientFor(id: string) {
  let sum = 0;
  for (const ch of id) sum += ch.charCodeAt(0);
  return GRADIENTS[sum % GRADIENTS.length];
}

function isLocked(lockedUntil?: string | null) {
  return Boolean(lockedUntil && new Date(lockedUntil) > new Date());
}

function MiniBar({ value, max, bar }: { value: number; max: number; bar: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/50">
      <motion.div
        className={`h-full rounded-full ${bar}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

type TabKey = "members" | "invites" | "activity";

export function TeamInvitesClient({ users, invitations, currentUserId }: { users: UserItem[]; invitations: InvitationItem[]; currentUserId?: string }) {
  const { t, lang } = useT();
  const locale = lang === "en" ? "en-US" : "es-ES";
  const { toast } = useToast();
  const COUNT_META = [
    { key: "patients", label: "Pacientes", icon: Briefcase, bar: "bg-blue-500" },
    { key: "appointments", label: "Citas", icon: CalendarCheck, bar: "bg-emerald-500" },
    { key: "reports", label: "Informes", icon: FileText, bar: "bg-violet-500" },
  ] as const;
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("PSYCHOLOGIST");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<UserItem | null>(null);
  const [tab, setTab] = useState<TabKey>("members");

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const res = await createInvitation({ email, role });
    if (res.success) {
      setEmail("");
      toast({
        type: res.emailSent ? "success" : "info",
        title: res.emailSent ? "Invitación enviada por email." : "Invitación creada",
        description: res.emailSent ? "El enlace se copió al portapapeles." : "Comparte este enlace manualmente:",
      });
      if (res.invitationUrl) await navigator.clipboard.writeText(res.invitationUrl);
      window.location.reload();
    } else {
      toast({ type: "error", title: res.error || "No se pudo crear la invitación." });
    }
    setLoading(false);
  };

  const others = users.filter((u) => u.id !== currentUserId);
  const me = users.find((u) => u.id === currentUserId) || users[0];
  const ordered = me ? [me, ...others] : others;

  const totals = users.reduce(
    (acc, u) => {
      acc.patients += u.counts?.patients || 0;
      acc.appointments += u.counts?.appointments || 0;
      acc.reports += u.counts?.reports || 0;
      return acc;
    },
    { patients: 0, appointments: 0, reports: 0 }
  );

  const maxCounts = users.reduce(
    (acc, u) => {
      acc.patients = Math.max(acc.patients, u.counts?.patients || 0);
      acc.appointments = Math.max(acc.appointments, u.counts?.appointments || 0);
      acc.reports = Math.max(acc.reports, u.counts?.reports || 0);
      return acc;
    },
    { patients: 0, appointments: 0, reports: 0 }
  );

  const teamStats = [
    { label: "Equipo", value: users.length, icon: Users },
    { label: "Pacientes", value: totals.patients, icon: Briefcase },
    { label: "Citas", value: totals.appointments, icon: CalendarCheck },
    { label: "Informes", value: totals.reports, icon: FileText },
  ];

  const pendingCount = invitations.filter((i) => !i.acceptedAt).length;

  const tabs: { key: TabKey; label: string; icon: typeof Users; badge?: number }[] = [
    { key: "members", label: "Equipo", icon: Users, badge: users.length },
    { key: "invites", label: "Invitaciones", icon: UserPlus, badge: pendingCount || undefined },
    { key: "activity", label: "Actividad", icon: Activity },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {teamStats.map((stat) => (
          <div key={stat.label} className="card flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-secondary-text">{stat.value}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-light text-primary">
              <MailPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-secondary-text">{"Invitar al equipo"}</h2>
              <p className="text-sm text-slate-500">{"Envía una invitación por email con un rol."}</p>
            </div>
          </div>
          <form onSubmit={handleCreate} className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto">
            <input className="inp flex-1 md:w-64" type="email" placeholder={"Email del invitado"} value={email} onChange={(e) => setEmail(e.target.value)} required />
            <select className="inp md:w-44" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="PSYCHOLOGIST">{"Psicólogo"}</option>
              <option value="READONLY">{"Solo lectura"}</option>
              <option value="ADMIN">{"Administrador"}</option>
            </select>
            <button className="btn btn-primary" disabled={loading} type="submit">
              <MailPlus className="h-4 w-4" /> {"Enviar invitación"}
            </button>
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`btn btn-sm ${tab === t.key ? "btn-primary" : "btn-ghost"}`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.badge !== undefined && (
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-black ${tab === t.key ? "bg-white/20" : "bg-slate-200 text-slate-600 dark:bg-slate-700"}`}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "members" && (
          <motion.div
            key="members"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div>
              <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
                <Users className="h-4 w-4" /> {"Miembros"} · {users.length} {users.length === 1 ? "miembro" : "miembros"}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ordered.map((user) => {
                  const locked = isLocked(user.lockedUntil);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelected(user)}
                      className={`card group flex flex-col items-center gap-3 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg ${locked ? "ring-1 ring-amber-300/60" : ""}`}
                    >
                      <div className="relative">
                        {user.id === currentUserId ? (
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary-dark text-2xl font-bold text-white ring-4 ring-primary/15 transition-transform group-hover:scale-105">{"Tú"}</div>
                        ) : (
                          <div className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr ${gradientFor(user.id)} text-2xl font-bold text-white ring-4 ring-white/60 transition-transform group-hover:scale-105`}>{initials(user.name || "?")}</div>
                        )}
                        {locked && (
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white ring-2 ring-white">
                            <Lock className="h-3 w-3" /> {"Bloqueado"}
                          </span>
                        )}
                        {user.id === currentUserId && !locked && (
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white ring-2 ring-white">{"Tú"}</span>
                        )}
                      </div>
                      <div className="w-full">
                         <p className="font-bold text-secondary-text">{user.name} {user.id === currentUserId && <span className="text-slate-400">{"(tú)"}</span>}</p>
                        <p className="truncate text-sm text-slate-500">{user.email}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${ROLE_STYLES[user.role] || ROLE_STYLES.USER}`}>{getRoleLabel(user.role)}</span>
                      {user.counts && (
                        <div className="grid w-full grid-cols-3 gap-2 pt-1">
                          {COUNT_META.map((m) => (
                            <div key={m.key} className="flex flex-col items-center gap-1">
                              <p className="text-lg font-black text-secondary-text">{user.counts?.[m.key]}</p>
                              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400"><m.icon className="h-3 w-3" />{m.label}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-extrabold text-secondary-text">{"Actividad del equipo"}</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">{"Resumen de pacientes, citas e informes por profesional."}</p>
              <div className="mt-5 space-y-4">
                {COUNT_META.map((m) => (
                  <div key={m.key} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                      <m.icon className="h-4 w-4 text-primary" /> {m.label}
                    </div>
                    <div className="space-y-2">
                      {ordered.map((user) => (
                        <div key={user.id} className="flex items-center gap-3">
                          <span className="w-28 truncate text-xs font-semibold text-slate-500">{user.id === currentUserId ? "Tú" : user.name}</span>
                          <div className="flex-1">
                            <MiniBar value={user.counts?.[m.key] || 0} max={maxCounts[m.key]} bar={m.bar} />
                          </div>
                          <span className="w-8 text-right text-xs font-black text-secondary-text">{user.counts?.[m.key] || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {tab === "invites" && (
          <motion.div
            key="invites"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="card p-6"
          >
            <h2 className="text-lg font-extrabold text-secondary-text">{"Invitaciones pendientes"}</h2>
            <div className="mt-4 space-y-3">
              {invitations.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">
                  <UserPlus className="h-8 w-8 text-slate-300" />
                  {"Aún no hay invitaciones enviadas."}
                </div>
              ) : (
                invitations.map((invitation) => {
                  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
                  const url = `${baseUrl}/?mode=register&invite=${invitation.token}&email=${encodeURIComponent(invitation.email)}`;
                  const accepted = Boolean(invitation.acceptedAt);
                  return (
                    <div key={invitation.id} className="rounded-2xl border border-secondary-border bg-slate-50 p-4 dark:bg-[var(--color-secondary-card)]">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${accepted ? "bg-emerald-100 text-emerald-600" : "bg-primary-light text-primary"}`}>
                            {accepted ? <CheckCircle2 className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-secondary-text">{invitation.email}</p>
                            <p className="text-sm text-slate-500">{getRoleLabel(invitation.role)} · invito {invitation.invitedBy}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {accepted ? (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-700">{"Aceptada"}</span>
                          ) : (
                            <button type="button" onClick={() => navigator.clipboard.writeText(url)} className="btn btn-ghost btn-sm"><Copy className="h-4 w-4" /> {"Copiar enlace"}</button>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        {accepted ? `${t("Aceptada")}: ${new Date(invitation.acceptedAt!).toLocaleString(locale)}` : `${"Caduca"}: ${new Date(invitation.expiresAt).toLocaleString(locale)}`}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {tab === "activity" && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="card p-6"
          >
            <h2 className="text-lg font-extrabold text-secondary-text">{"Registro de actividad"}</h2>
            <p className="mt-1 text-sm text-slate-500">{"Historial de altas y cambios del equipo."}</p>
            <div className="mt-5 space-y-3">
              {ordered.map((user) => {
                const locked = isLocked(user.lockedUntil);
                return (
                  <div key={user.id} className="flex items-center gap-3 rounded-2xl border border-secondary-border bg-slate-50 p-3 dark:bg-[var(--color-secondary-card)]">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr ${gradientFor(user.id)} text-sm font-bold text-white`}>{user.id === currentUserId ? "Tú" : initials(user.name)}</div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-secondary-text">{user.name} {user.id === currentUserId && <span className="text-slate-400">{t("(tú)")}</span>}</p>
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        <ArrowDownRight className="h-3 w-3" /> {"Alta"} {new Date(user.createdAt).toLocaleDateString(locale)}
                        {isAdminRole(user.role) && <Sparkles className="ml-1 h-3 w-3 text-red-500" />}
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${ROLE_STYLES[user.role] || ROLE_STYLES.USER}`}>{getRoleLabel(user.role)}</span>
                    {locked && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-black uppercase tracking-wider text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                        <Lock className="h-3 w-3" /> bloqueado
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-[24px] bg-white p-6 shadow-2xl dark:bg-[var(--color-secondary-card)]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-secondary-text">{"Detalles de"} {selected.name}</h3>
                <button onClick={() => setSelected(null)} className="p-1 text-slate-400 hover:text-red-500"><X className="h-5 w-5" /></button>
              </div>

              <div className="mt-5 flex items-center gap-4">
                <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr ${gradientFor(selected.id)} text-xl font-bold text-white`}>{initials(selected.name || "?")}</div>
                <div>
                  <p className="font-bold text-secondary-text">{selected.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`inline-block rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${ROLE_STYLES[selected.role] || ROLE_STYLES.USER}`}>{getRoleLabel(selected.role)}</span>
                    {isLocked(selected.lockedUntil) && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-black uppercase tracking-wider text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                         <Lock className="h-3 w-3" /> {t("Administrador")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                {selected.specialization && (
                  <p className="flex items-center gap-2 text-slate-600"><Briefcase className="h-4 w-4 text-primary" /> {selected.specialization}</p>
                )}
                {selected.colegiado && (
                   <p className="flex items-center gap-2 text-slate-600"><IdCard className="h-4 w-4 text-primary" /> {"Colegiado:"} {selected.colegiado}</p>
                )}
                {selected.dni && <p className="flex items-center gap-2 text-slate-600"><BadgeCheck className="h-4 w-4 text-primary" /> {"DNI:"} {selected.dni}</p>}
                <p className="flex items-center gap-2 text-slate-600"><CalendarCheck className="h-4 w-4 text-primary" /> {"Alta"} {new Date(selected.createdAt).toLocaleDateString(locale)}</p>
                {selected.lockedUntil && isLocked(selected.lockedUntil) && (
                   <p className="flex items-center gap-2 text-amber-600"><ShieldAlert className="h-4 w-4" /> {"Cuenta bloqueada hasta"} {new Date(selected.lockedUntil).toLocaleString(locale)}</p>
                )}
              </div>

              {selected.counts && (
                <div className="mt-5 space-y-4">
                   <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("Rol")}</p>
                  {COUNT_META.map((m) => {
                    const max = Math.max(maxCounts[m.key], 1);
                    const val = selected.counts?.[m.key] || 0;
                    return (
                      <div key={m.key} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300"><m.icon className="h-4 w-4 text-primary" /> {m.label}</span>
                          <span className="font-black text-secondary-text">{val}</span>
                        </div>
                        <MiniBar value={val} max={max} bar={m.bar} />
                      </div>
                    );
                  })}
                </div>
              )}

              <a href={`mailto:${selected.email}`} className="btn btn-primary mt-6 w-full justify-center">
                <Send className="h-4 w-4" /> {"Enviar email"}
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
