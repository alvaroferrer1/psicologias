"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Appointment, Patient } from "@prisma/client";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock3, Loader2, Plus, User, Video, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createAppointment, getAppointments } from "@/app/actions/appointments";
import { getPatients } from "@/app/actions/patients";
import { useToast } from "@/components/ToastProvider";

type AppointmentWithPatient = Appointment & {
  patient: Patient | null;
};

type CalendarForm = {
  patientId: string;
  title: string;
  type: string;
  hour: string;
};

const HOURS = Array.from({ length: 8 }, (_, index) => index + 10);
const WEEK_DAYS = ["L", "M", "X", "J", "V", "S", "D"];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [formData, setFormData] = useState<CalendarForm>({
    patientId: "",
    title: "Sesion de seguimiento",
    type: "Presencial",
    hour: "10",
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
      toast({ type: "info", title: "Necesitas al menos un paciente.", description: "Crea primero una ficha para poder agendar." });
      return;
    }

    setIsSubmitting(true);

    const date = new Date(selectedDate);
    date.setHours(Number.parseInt(formData.hour, 10), 0, 0, 0);

    const res = await createAppointment({ ...formData, date });
    if (res.success) {
      setIsModalOpen(false);
      await refreshData();
      toast({ type: "success", title: "Cita guardada correctamente." });
    } else {
      toast({ type: "error", title: "No se pudo agendar la cita." });
    }

    setIsSubmitting(false);
  };

  const monthGrid = useMemo(() => {
    const start = startOfMonthGrid(visibleMonth);
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [visibleMonth]);

  const selectedDayAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => sameDay(new Date(appointment.date), selectedDate))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments, selectedDate]);

  const appointmentCountByDay = useMemo(() => {
    const map = new Map<string, number>();
    appointments.forEach((appointment) => {
      const date = new Date(appointment.date);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [appointments]);

  const upcomingAppointments = appointments
    .filter((appointment) => new Date(appointment.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-secondary-text md:text-3xl">
            <CalendarIcon className="h-8 w-8 text-primary" /> Calendario Inteligente
          </h1>
          <p className="mt-1 text-slate-500">Agenda clinica conectada con las citas reales guardadas en base de datos.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} type="button">
          <Plus className="h-5 w-5" /> Agendar cita
        </button>
      </div>

      <div className="card flex min-h-[540px] flex-col shadow-sm md:flex-row">
        <div className="w-full border-b border-secondary-border bg-slate-50 p-5 md:w-80 md:border-b-0 md:border-r">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-secondary-text">
              {visibleMonth.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
            </h3>
            <div className="flex gap-1">
              <button className="rounded-md p-1 hover:bg-slate-200" type="button" onClick={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="rounded-md p-1 hover:bg-slate-200" type="button" onClick={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>
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
                  onClick={() => setSelectedDate(day)}
                  className={`relative rounded-full py-2 transition-colors ${
                    isSelected
                      ? "bg-primary font-extrabold text-white shadow-md"
                      : isToday
                        ? "bg-primary-light font-bold text-primary"
                        : isCurrentMonth
                          ? "text-slate-700 hover:bg-slate-200"
                          : "text-slate-300"
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

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Fecha seleccionada</p>
            <p className="mt-2 text-sm font-bold text-secondary-text">
              {selectedDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {selectedDayAppointments.length} cita{selectedDayAppointments.length !== 1 ? "s" : ""} en este dia
            </p>
          </div>
        </div>

        <div className="grid flex-1 gap-0 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="border-b border-secondary-border p-5 lg:border-b-0 lg:border-r">
            <h3 className="mb-6 text-lg font-bold">
              Agenda del dia
            </h3>

            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : selectedDayAppointments.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm font-medium text-slate-500">
                No hay citas programadas para esta fecha.
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDayAppointments.map((appointment) => {
                  const date = new Date(appointment.date);
                  const isVideo = appointment.type === "Videoconsulta";
                  return (
                    <div key={appointment.id} className={`rounded-2xl border p-4 shadow-sm ${isVideo ? "border-purple-200 bg-purple-50" : "border-emerald-200 bg-emerald-50"}`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className={`flex items-center gap-2 text-sm font-bold ${isVideo ? "text-purple-900" : "text-emerald-900"}`}>
                            {isVideo ? <Video className="h-4 w-4" /> : <User className="h-4 w-4" />}
                            {appointment.patient?.name || "Paciente eliminado"}
                          </p>
                          <p className={`mt-1 text-sm font-medium ${isVideo ? "text-purple-700" : "text-emerald-700"}`}>
                            {appointment.title}
                          </p>
                          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                            <Clock3 className="h-3.5 w-3.5" />
                            <span>{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            <span>·</span>
                            <span>{appointment.type}</span>
                            <span>·</span>
                            <span>{appointment.status}</span>
                          </div>
                        </div>
                        {isVideo ? (
                          <Link href={`/dashboard/video?appointment=${appointment.id}`} className="inline-flex rounded-lg bg-purple-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-purple-700">
                            Entrar sala
                          </Link>
                        ) : (
                          <span className="inline-flex rounded-lg bg-white/70 px-3 py-2 text-xs font-bold text-slate-700">
                            Cita presencial
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-5">
            <h3 className="mb-6 text-lg font-bold">Proximas sesiones reales</h3>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm font-medium text-slate-500">
                No hay citas futuras programadas.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => {
                  const date = new Date(appointment.date);
                  const isVideo = appointment.type === "Videoconsulta";
                  return (
                    <div key={appointment.id} className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-primary/20 hover:bg-slate-50">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-secondary-text">{appointment.patient?.name || "Paciente eliminado"}</p>
                          <p className="mt-1 text-xs font-medium text-slate-500">{appointment.title}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${isVideo ? "bg-primary-light text-primary" : "bg-emerald-50 text-emerald-700"}`}>
                          {appointment.type}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span>{date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                        <span>·</span>
                        <span>{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      {isVideo && (
                        <div className="mt-3">
                          <Link href={`/dashboard/video?appointment=${appointment.id}`} className="inline-flex rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-dark">
                            Abrir videoconsulta
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-6">
                <h3 className="text-lg font-bold text-secondary-text">Agendar sesion</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 transition-colors hover:text-red-500" type="button">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddAppointment} className="space-y-4 p-6">
                {patients.length === 0 && (
                  <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600">
                    No hay pacientes registrados en la base de datos.
                  </div>
                )}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm font-medium text-slate-600">
                  Fecha seleccionada: {selectedDate.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-bold text-slate-700">Paciente *</label>
                  <select
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={formData.patientId}
                    onChange={(event) => setFormData({ ...formData, patientId: event.target.value })}
                    disabled={patients.length === 0}
                  >
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>{patient.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700">Hora de inicio</label>
                    <select
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={formData.hour}
                      onChange={(event) => setFormData({ ...formData, hour: event.target.value })}
                    >
                      {HOURS.map((hour) => <option key={hour} value={hour}>{hour}:00</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700">Modalidad</label>
                    <select
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={formData.type}
                      onChange={(event) => setFormData({ ...formData, type: event.target.value })}
                    >
                      <option value="Presencial">Presencial</option>
                      <option value="Videoconsulta">Videollamada</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-bold text-slate-700">Asunto / titulo interno</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={formData.title}
                    onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost flex-1 font-bold text-slate-500 hover:bg-slate-100">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSubmitting || patients.length === 0} className="btn btn-primary flex flex-1 items-center justify-center">
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar cita"}
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
