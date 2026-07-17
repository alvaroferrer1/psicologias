"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Appointment, Patient } from "@prisma/client";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock3, Loader2, Plus, User, Video, X, LayoutGrid, Stethoscope, CalendarDays, Trash2, Filter, Activity, Flame, CheckCircle2, TrendingUp, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createAppointment, getAppointments, deleteAppointment } from "@/app/actions/appointments";
import { getPatients } from "@/app/actions/patients";
import { useToast } from "@/components/ToastProvider";
import { useT } from "@/lib/useT";

type AppointmentWithPatient = Appointment & {
  patient: Patient | null;
};

type CalendarForm = {
  patientId: string;
  title: string;
  type: string;
  hour: string;
  minute: string;
  duration: number;
};

const HOURS = Array.from({ length: 12 }, (_, index) => index + 8);
const MINUTES = ["00", "15", "30", "45"];
const WEEK_DAYS = ["L", "M", "X", "J", "V", "S", "D"];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const dayIndex = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dayIndex);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonthGrid(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const dayIndex = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - dayIndex);
  return gridStart;
}

export default function CalendarPage() {
  const { t, lang } = useT();
  const locale = lang === "en" ? "en-US" : "es-ES";
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [view, setView] = useState<"month" | "week">("month");
  const [typeFilter, setTypeFilter] = useState<"all" | "Presencial" | "Videoconsulta">("all");
  const [formData, setFormData] = useState<CalendarForm>({
    patientId: "",
    title: t("Asunto / motivo"),
    type: "Presencial",
    hour: "10",
    minute: "00",
    duration: 60,
  });

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      const [appsData, patsData] = await Promise.all([getAppointments(), getPatients()]);
      if (!active) return;

      setAppointments(appsData);
      setPatients(patsData);
      setFormData((prev) => ({
        ...prev,
        patientId: prev.patientId || patsData[0]?.id || "",
      }));
      setLoading(false);
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const refreshData = async () => {
    setLoading(true);
    const [appsData, patsData] = await Promise.all([getAppointments(), getPatients()]);
    setAppointments(appsData);
    setPatients(patsData);
    setLoading(false);
  };

  const handleAddAppointment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.patientId) {
      toast({ type: "info", title: t("Cita en videoconsulta"), description: t("Se abrirá la sala cuando llegue la hora.") });
      return;
    }

    setIsSubmitting(true);

    const date = new Date(selectedDate);
    date.setHours(Number.parseInt(formData.hour, 10), Number.parseInt(formData.minute, 10), 0, 0);

    const res = await createAppointment({ ...formData, date });
    if (res.success) {
      setIsModalOpen(false);
      await refreshData();
      toast({ type: "success", title: t("Cita creada") });
    } else {
      toast({ type: "error", title: t("No se pudo crear la cita.") });
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const res = await deleteAppointment(id);
    if (res.success) {
      await refreshData();
      toast({ type: "success", title: t("Cita actualizada") });
    } else {
      toast({ type: "error", title: t("No se pudo actualizar la cita.") });
    }
  };

  const filteredAppointments = useMemo(
    () => (typeFilter === "all" ? appointments : appointments.filter((a) => a.type === typeFilter)),
    [appointments, typeFilter]
  );

  const monthGrid = useMemo(() => {
    const start = startOfMonthGrid(visibleMonth);
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [visibleMonth]);

  const visibleWeekStart = useMemo(() => startOfWeek(visibleMonth), [visibleMonth]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => {
      const day = new Date(visibleWeekStart);
      day.setDate(visibleWeekStart.getDate() + index);
      return day;
    }),
    [visibleWeekStart]
  );

  const selectedDayAppointments = useMemo(() => {
    const base = typeFilter === "all" ? appointments : appointments.filter((a) => a.type === typeFilter);
    return base
      .filter((appointment) => sameDay(new Date(appointment.date), selectedDate))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments, selectedDate, typeFilter]);

  const appointmentCountByDay = useMemo(() => {
    const map = new Map<string, number>();
    filteredAppointments.forEach((appointment) => {
      const date = new Date(appointment.date);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [filteredAppointments]);

  const upcomingAppointments = useMemo(() => {
    const base = typeFilter === "all" ? appointments : appointments.filter((a) => a.type === typeFilter);
    return base
      .filter((appointment) => new Date(appointment.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments, typeFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const inMonth = appointments.filter((a) => new Date(a.date) >= monthStart);
    const video = inMonth.filter((a) => a.type === "Videoconsulta").length;
    const presencial = inMonth.length - video;

    const weekEnd = new Date(weekDays[6]);
    weekEnd.setHours(23, 59, 59, 999);
    const inWeek = appointments.filter((a) => {
      const d = new Date(a.date);
      return d >= weekDays[0] && d <= weekEnd;
    });
    const weekVideo = inWeek.filter((a) => a.type === "Videoconsulta").length;

    return { total: inMonth.length, video, presencial, weekTotal: inWeek.length, weekVideo };
  }, [appointments, weekDays]);

  const weekAppointmentsByDay = useMemo(
    () =>
      weekDays.map((day) =>
        (typeFilter === "all" ? appointments : appointments.filter((a) => a.type === typeFilter))
          .filter((a) => sameDay(new Date(a.date), day))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      ),
    [weekDays, appointments, typeFilter]
  );

  const modalityStats = useMemo(() => {
    const inMonth = appointments.filter((a) => new Date(a.date) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const video = inMonth.filter((a) => a.type === "Videoconsulta").length;
    const presencial = inMonth.length - video;
    const total = inMonth.length || 1;
    return {
      presencial,
      video,
      presencialPct: Math.round((presencial / total) * 100),
      videoPct: Math.round((video / total) * 100),
      total: inMonth.length,
    };
  }, [appointments]);

  const busiestDays = useMemo(() => {
    const now = new Date();
    const horizon = new Date();
    horizon.setDate(now.getDate() + 30);
    const base = typeFilter === "all" ? appointments : appointments.filter((a) => a.type === typeFilter);
    const counts = new Map<number, { date: Date; count: number }>();
    base.forEach((a) => {
      const d = new Date(a.date);
      if (d < now || d > horizon) return;
      const key = d.getDay();
      const entry = counts.get(key) || { date: d, count: 0 };
      entry.count += 1;
      counts.set(key, entry);
    });
    const DAY_LABELS = [t("Lun"), t("Mar"), t("Mié"), t("Jue"), t("Vie"), t("Sáb"), t("Dom")];
    const rows = Array.from(counts.entries())
      .map(([day, v]) => ({ day, label: DAY_LABELS[day], count: v.count }))
      .sort((a, b) => b.count - a.count);
    const max = rows.length ? rows[0].count : 1;
    return { rows, max };
  }, [appointments, typeFilter, t]);

  const agendaTimeline = useMemo(() => {
    const now = new Date();
    const horizon = new Date();
    horizon.setDate(now.getDate() + 7);
    const base = typeFilter === "all" ? appointments : appointments.filter((a) => a.type === typeFilter);
    return base
      .filter((a) => {
        const d = new Date(a.date);
        return d >= now && d <= horizon;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 8);
  }, [appointments, typeFilter]);

  const completedCount = useMemo(
    () => appointments.filter((a) => a.status === "Completada" || a.status === "Realizada").length,
    [appointments]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-secondary-text md:text-3xl">
            <CalendarIcon className="h-8 w-8 text-primary" /> {t("Calendario")}
          </h1>
          <p className="mt-1 text-slate-500">{t("Gestiona tus citas y videoconsultas.")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-secondary-border bg-white p-1 dark:bg-[var(--color-secondary-card)]">
              <button type="button" onClick={() => setView("month")} className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${view === "month" ? "bg-primary text-white" : "text-slate-500 hover:text-primary"}`}>
                {t("Vista de agenda")}
              </button>
              <button type="button" onClick={() => setView("week")} className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${view === "week" ? "bg-primary text-white" : "text-slate-500 hover:text-primary"}`}>
                {t("Vista de lista")}
              </button>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} type="button">
            <Plus className="h-5 w-5" /> {t("Agendar cita")}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary"><CalendarIcon className="h-6 w-6" /></div>
          <div>
            <p className="text-2xl font-black text-secondary-text">{stats.total}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("Filtros")}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600"><Video className="h-6 w-6" /></div>
          <div>
            <p className="text-2xl font-black text-secondary-text">{stats.video}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("Modalidad")}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Stethoscope className="h-6 w-6" /></div>
          <div>
            <p className="text-2xl font-black text-secondary-text">{stats.presencial}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("Estado")}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600"><CalendarDays className="h-6 w-6" /></div>
          <div>
            <p className="text-2xl font-black text-secondary-text">{stats.weekTotal}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("Día")}</p>
          </div>
        </div>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-3 p-3">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-secondary-text"><Filter className="h-4 w-4 text-primary" /> {t("Filtrar")}</span>
        <div className="inline-flex gap-2">
          {([
            { key: "all", label: t("Todos"), icon: LayoutGrid },
            { key: "Presencial", label: t("Presencial"), icon: User },
            { key: "Videoconsulta", label: t("Videoconsulta"), icon: Video },
          ] as const).map((opt) => {
            const Icon = opt.icon;
            const active = typeFilter === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setTypeFilter(opt.key as typeof typeFilter)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${active ? "bg-primary text-white shadow-md" : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"}`}
              >
                <Icon className="h-3.5 w-3.5" /> {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card flex min-h-[540px] flex-col shadow-sm md:flex-row">
        <div className="w-full border-b border-secondary-border bg-slate-50 p-5 md:w-80 md:border-b-0 md:border-r dark:bg-[var(--color-secondary-card)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-secondary-text">
              {visibleMonth.toLocaleDateString(locale, { month: "long", year: "numeric" })}
            </h3>
            <div className="flex gap-1">
                <button className="rounded-md px-2 py-1 text-xs font-bold text-primary hover:bg-primary-light" type="button" onClick={() => { setVisibleMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); setSelectedDate(new Date()); }}>
                  {t("Ninguna cita este día.")}
                </button>
              <button className="rounded-md p-1 hover:bg-slate-200 dark:hover:bg-slate-700" type="button" onClick={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="rounded-md p-1 hover:bg-slate-200 dark:hover:bg-slate-700" type="button" onClick={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400">
            {WEEK_DAYS.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium">
            {monthGrid.map((day) => {
              const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
              const isSelected = sameDay(day, selectedDate);
              const isToday = sameDay(day, new Date());
              const count = appointmentCountByDay.get(`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`) || 0;

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => { setSelectedDate(day); setVisibleMonth(new Date(day.getFullYear(), day.getMonth(), 1)); }}
                  className={`relative rounded-full py-2 transition-colors ${
                    isSelected
                      ? "bg-primary font-extrabold text-white shadow-md"
                      : isToday
                        ? "bg-primary-light font-bold text-primary"
                        : isCurrentMonth
                          ? "text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700"
                          : "text-slate-300 dark:text-slate-600"
                  }`}
                >
                  {day.getDate()}
                  {count > 0 && (
                    <span className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${isSelected ? "bg-white" : "bg-emerald-500"}`} />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl border border-secondary-border bg-white p-4 dark:bg-[var(--color-bg-base)]">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("Citas")}</p>
            <p className="mt-2 text-sm font-bold text-secondary-text">
              {selectedDate.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {selectedDayAppointments.length} {t("citas")}{selectedDayAppointments.length !== 1 ? t("cita") : ""}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> {t("Presencial")}</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> {t("Videoconsulta")}</span>
          </div>
        </div>

        <div className="grid flex-1 gap-0 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="border-b border-secondary-border p-5 lg:border-b-0 lg:border-r">
            {view === "month" ? (
              <>
                <h3 className="mb-6 text-lg font-bold text-secondary-text">{t("Resumen de la semana")}</h3>
                {renderDayList(selectedDayAppointments, handleDelete, loading, true, t)}
              </>
            ) : (
              <>
                  <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-secondary-text">
                  <CalendarDays className="h-5 w-5 text-primary" /> {t("Semana del")} {weekDays[0].toLocaleDateString(locale, { day: "numeric", month: "short" })} {t("al")} {weekDays[6].toLocaleDateString(locale, { day: "numeric", month: "short" })}
                </h3>
                <div className="space-y-5">
                  {weekDays.map((day, idx) => (
                    <div key={day.toISOString()}>
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`text-sm font-bold ${sameDay(day, new Date()) ? "text-primary" : "text-secondary-text"}`}>{day.toLocaleDateString(locale, { month: "short" })} {day.getDate()}</span>
                        <span className="text-xs text-slate-400">{day.toLocaleDateString(locale, { weekday: "long" })}</span>
                      </div>
                       {weekAppointmentsByDay[idx].length === 0 ? (
                        <p className="text-xs text-slate-400">{t("Sin citas esta semana.")}</p>
                      ) : (
                        <div className="space-y-2 pl-2">
                          {renderDayList(weekAppointmentsByDay[idx], handleDelete, loading, false, t)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="p-5">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-secondary-text">
              <LayoutGrid className="h-5 w-5 text-primary" /> {t("Estadísticas")}
            </h3>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm font-medium text-slate-500 dark:bg-slate-800/40">
                {t("Distribución por modalidad")}
              </div>
            ) : (
               <div className="space-y-3">
                {upcomingAppointments.map((appointment, idx) => {
                  const date = new Date(appointment.date);
                  const isVideo = appointment.type === "Videoconsulta";
                  return (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rounded-2xl border border-secondary-border bg-white p-4 transition-colors hover:border-primary/20 hover:bg-slate-50 dark:bg-[var(--color-secondary-card)] dark:hover:bg-slate-800/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-secondary-text">{appointment.patient?.name || t("patients.unassigned")}</p>
                          <p className="mt-1 text-xs font-medium text-slate-500">{appointment.title}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${isVideo ? "bg-primary-light text-primary" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"}`}>
                          {appointment.type}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span>{date.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                        <span>Â·</span>
                        <span>{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      {isVideo && (
                        <div className="mt-3">
                          <Link href={`/dashboard/video?appointment=${appointment.id}`} className="inline-flex rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-dark">
                            {t("por modalidad")}
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-secondary-text">
              <Sparkles className="h-5 w-5 text-primary" /> {t("Citas por día")}
            </h3>
            <span className="rounded-full bg-primary-light px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-primary">{agendaTimeline.length} citas</span>
          </div>
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : agendaTimeline.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm font-medium text-slate-500 dark:bg-slate-800/40">
              No hay citas programadas en los proximos 7 dias.
            </div>
          ) : (
            <ol className="relative ml-3 border-l-2 border-slate-200 dark:border-slate-700">
              {agendaTimeline.map((appointment, idx) => {
                const date = new Date(appointment.date);
                const isVideo = appointment.type === "Videoconsulta";
                const done = appointment.status === "Completada" || appointment.status === "Realizada";
                const isToday = sameDay(date, new Date());
                return (
                  <motion.li
                    key={appointment.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="mb-5 ml-6 last:mb-0"
                  >
                    <span className={`absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white dark:ring-[var(--color-secondary-card)] ${isVideo ? "bg-purple-500" : "bg-emerald-500"}`}>
                      {isVideo ? <Video className="h-2.5 w-2.5 text-white" /> : <User className="h-2.5 w-2.5 text-white" />}
                    </span>
                    <div className="flex items-start justify-between gap-3 rounded-2xl border border-secondary-border bg-white p-4 transition-colors hover:border-primary/20 dark:bg-[var(--color-secondary-card)]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-secondary-text">{appointment.patient?.name || t("patients.unassigned")}</p>
                          {isToday && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">Hoy</span>}
                          {done && <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700 dark:bg-blue-500/20 dark:text-blue-200"><CheckCircle2 className="h-3 w-3" /> Hecha</span>}
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-500">{appointment.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                          <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{date.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "short" })} Â· {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${isVideo ? "bg-primary-light text-primary" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"}`}>{appointment.type}</span>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-secondary-text">
              <Activity className="h-5 w-5 text-primary" /> {t("Racha de citas")}
            </h3>
            {modalityStats.total === 0 ? (
              <p className="text-sm font-medium text-slate-400">{t("Días seguidos con actividad.")}</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-emerald-500" /> Presencial</span>
                    <span>{modalityStats.presencial} Â· {modalityStats.presencialPct}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${modalityStats.presencialPct}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full bg-emerald-500" />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1.5"><Video className="h-3.5 w-3.5 text-purple-500" /> Videoconsulta</span>
                    <span>{modalityStats.video} Â· {modalityStats.videoPct}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${modalityStats.videoPct}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full bg-purple-500" />
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 text-center text-xs font-semibold text-slate-500 dark:bg-slate-800/40">
                   {modalityStats.total} {t("sesiones")}
                </div>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-secondary-text">
              <Flame className="h-5 w-5 text-amber-500" /> {t("Esta semana")}
            </h3>
            {busiestDays.rows.length === 0 ? (
              <p className="text-sm font-medium text-slate-400">{t("Citas registradas en los últimos 7 días.")}</p>
            ) : (
              <div className="space-y-3">
                {busiestDays.rows.map((row) => (
                  <div key={row.day}>
                    <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>{row.label}</span>
                      <span>{row.count} {row.count === 1 ? t("cita") : t("citas")}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(row.count / busiestDays.max) * 100}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><TrendingUp className="h-6 w-6" /></div>
          <div>
            <p className="text-lg font-black text-secondary-text">{completedCount} {t("completadas")}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("Total del mes")}</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} type="button">
          <Plus className="h-5 w-5" /> {t("Nueva cita")}
        </button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-2xl dark:bg-[var(--color-secondary-card)]">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-6 dark:bg-slate-800/40">
                <h3 className="text-lg font-bold text-secondary-text">{t("Detalles de la cita")}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 transition-colors hover:text-red-500" type="button">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddAppointment} className="space-y-4 p-6">
                {patients.length === 0 && (
                   <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600">
                    {t("Completar cita")}
                  </div>
                )}
                <div className="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary-light/40 p-3 text-sm font-semibold text-primary">
                  <CalendarIcon className="h-4 w-4" />
                  {t("Citas")}: {selectedDate.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-bold text-slate-700 dark:text-slate-200">{t("Fecha *")} *</label>
                  <select
                    required
                    className="inp"
                    value={formData.patientId}
                    onChange={(event) => setFormData({ ...formData, patientId: event.target.value })}
                    disabled={patients.length === 0}
                  >
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>{patient.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700 dark:text-slate-200">Hora</label>
                    <select
                      className="inp"
                      value={formData.hour}
                      onChange={(event) => setFormData({ ...formData, hour: event.target.value })}
                    >
                      {HOURS.map((hour) => <option key={hour} value={hour}>{String(hour).padStart(2, "0")}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700 dark:text-slate-200">{t("Paciente *")}</label>
                    <select
                      className="inp"
                      value={formData.minute}
                      onChange={(event) => setFormData({ ...formData, minute: event.target.value })}
                    >
                      {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700 dark:text-slate-200">{t("Asunto *")}</label>
                    <select
                      className="inp"
                      value={formData.duration}
                      onChange={(event) => setFormData({ ...formData, duration: Number.parseInt(event.target.value, 10) })}
                    >
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>60 min</option>
                      <option value={90}>90 min</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700 dark:text-slate-200">{t("Fecha y hora *")}</label>
                    <select
                      className="inp"
                      value={formData.type}
                      onChange={(event) => setFormData({ ...formData, type: event.target.value })}
                    >
                      <option value="Presencial">Presencial</option>
                      <option value="Videoconsulta">Videoconsulta</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700 dark:text-slate-200">{t("Modalidad")}</label>
                    <input
                      type="text"
                      className="inp"
                      placeholder={t("Asunto / motivo")}
                      value={formData.title}
                      onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost flex-1 font-bold">
                      {t("Guardar cita")}
                    </button>
                  <button type="submit" disabled={isSubmitting || patients.length === 0} className="btn btn-primary flex flex-1 items-center justify-center">
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : t("Agendar")}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function renderDayList(
  list: AppointmentWithPatient[],
  onDelete: (id: string) => void,
  loading: boolean,
  withVideoLink = true,
  t: (k: string) => string = () => ""
) {
  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }
  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm font-medium text-slate-500 dark:bg-slate-800/40">
        {t("calendar.noAppointments")}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {list.map((appointment, idx) => {
        const date = new Date(appointment.date);
        const isVideo = appointment.type === "Videoconsulta";
        return (
          <motion.div
            key={appointment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`group rounded-2xl border p-4 shadow-sm ${isVideo ? "border-purple-200 bg-purple-50 dark:border-purple-500/30 dark:bg-purple-500/10" : "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className={`flex items-center gap-2 text-sm font-bold ${isVideo ? "text-purple-900 dark:text-purple-200" : "text-emerald-900 dark:text-emerald-200"}`}>
                  {isVideo ? <Video className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  {appointment.patient?.name || t("patients.unassigned")}
                </p>
                <p className={`mt-1 text-sm font-medium ${isVideo ? "text-purple-700 dark:text-purple-300" : "text-emerald-700 dark:text-emerald-300"}`}>
                  {appointment.title}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${isVideo ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"}`}>{appointment.type}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    appointment.status === "Completada" || appointment.status === "Realizada"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200"
                      : appointment.status === "Cancelada"
                        ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
                  }`}>{appointment.status}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {withVideoLink && isVideo && (
                  <Link href={`/dashboard/video?appointment=${appointment.id}`} className="inline-flex rounded-lg bg-purple-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-purple-700">
                    {t("calendar.joinVideo")}
                  </Link>
                )}
                {!isVideo && withVideoLink && (
                  <span className="inline-flex rounded-lg bg-white/70 px-3 py-2 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    {t("calendar.presencial")}
                  </span>
                )}
                <button type="button" onClick={() => onDelete(appointment.id)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10" title={t("calendar.delete")}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
