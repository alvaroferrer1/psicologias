"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { Patient } from "@prisma/client";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  Cake,
  ChevronRight,
  Clock,
  FolderOpen,
  HeartPulse,
  IdCard,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Stethoscope,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react";
import { createPatient, getPatients, updatePatientStatus } from "@/app/actions/patients";
import { useToast } from "@/components/ToastProvider";
import { useT } from "@/lib/useT";
import {
  calculateAge,
  getBirthdayAlert,
  getPatientStatusClasses,
  getPatientStatusLabel,
  getPatientTypeLabel,
} from "@/lib/patient-utils";

type PatientListItem = Patient;

type PatientForm = {
  name: string;
  email: string;
  phone: string;
  dni: string;
  birthDate: string;
  description: string;
  patientType: string;
  status: string;
  guardianName: string;
  guardianDni: string;
};

const emptyForm: PatientForm = {
  name: "",
  email: "",
  phone: "",
  dni: "",
  birthDate: "",
  description: "Adultos",
  patientType: "adulto",
  status: "activo",
  guardianName: "",
  guardianDni: "",
};

export default function PatientsPage() {
  const { toast } = useToast();
  const { t } = useT();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<PatientForm>(emptyForm);

  const typeOptions = [
    { value: "infantil", label: t("patients.type.child") },
    { value: "adolescente", label: t("patients.type.teen") },
    { value: "adulto", label: t("patients.type.adult") },
    { value: "pareja", label: t("patients.type.couple") },
    { value: "familia", label: t("patients.type.family") },
  ];
  const statusOptions = [
    { value: "activo", label: t("patients.status.active") },
    { value: "pausa", label: t("patients.status.pause") },
    { value: "pasivo", label: t("patients.status.passive") },
  ];

  useEffect(() => {
    let active = true;

    const loadPatients = async () => {
      const data = await getPatients();
      if (!active) return;
      setPatients(data);
      setLoading(false);
    };

    void loadPatients();
    return () => {
      active = false;
    };
  }, []);

  const refreshPatients = async () => {
    setLoading(true);
    const data = await getPatients();
    setPatients(data);
    setLoading(false);
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await createPatient(formData);
    if (res.success) {
      setIsModalOpen(false);
      setFormData(emptyForm);
      await refreshPatients();
      toast({ type: "success", title: t("patients.saved"), description: t("patients.savedDesc") });
    } else {
      toast({ type: "error", title: res.error || t("patients.saveError") });
    }

    setIsSubmitting(false);
  };

  const handleStatusChange = (patientId: string, status: string) => {
    startTransition(async () => {
      const res = await updatePatientStatus(patientId, status);
      if (res.success) {
        await refreshPatients();
        toast({ type: "success", title: t("patients.statusUpdated") });
      } else {
        toast({ type: "error", title: res.error || t("patients.updateError") });
      }
    });
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const patientStatus = patient.status || (patient.active ? "activo" : "pasivo");
      const matchesSearch =
        patient.name.toLowerCase().includes(search.toLowerCase()) ||
        (patient.dni || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || patientStatus === statusFilter;
      const matchesType = !typeFilter || (patient.patientType || "adulto") === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [patients, search, statusFilter, typeFilter]);

  const activeCount = useMemo(
    () => patients.filter((p) => (p.status || (p.active ? "activo" : "pasivo")) === "activo").length,
    [patients],
  );
  const pausedCount = useMemo(
    () => patients.filter((p) => (p.status || (p.active ? "activo" : "pasivo")) === "pausa").length,
    [patients],
  );

  const hasActiveFilters = search.trim() !== "" || statusFilter !== "" || typeFilter !== "";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
  };

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04, delayChildren: 0.05 },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
  };

  const locale = t("patients.dni") === "ID" ? "en-US" : "es-ES";

  const SelectWithIcon = ({
    icon: Icon,
    value,
    onChange,
    children,
  }: {
    icon: typeof Users;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    children: React.ReactNode;
  }) => (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <select
        className="inp min-w-[180px] cursor-pointer appearance-none pl-9 pr-8"
        value={value}
        onChange={onChange}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[24px] border border-primary/20 bg-gradient-to-br from-primary-light via-primary-light to-primary/10 p-6 shadow-[0_8px_30px_rgba(25,103,210,0.10)] sm:p-8 dark:border-primary/25 dark:from-[var(--color-primary-light)] dark:via-[var(--color-primary-light)] dark:to-primary/10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15" />
        <div className="pointer-events-none absolute -bottom-12 right-24 h-32 w-32 rounded-full bg-primary/10 blur-2xl dark:bg-primary/10" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-primary backdrop-blur dark:bg-white/10 dark:text-primary">
              <Star className="h-3.5 w-3.5 fill-current" />
              {t("patients.directory")}
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-secondary-text md:text-[34px] md:leading-tight">
              Directorio clínico
            </h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600 dark:text-[var(--color-secondary-muted)] md:text-[15px]">
              {t("patients.directoryDesc")}
            </p>
            <button
              className="btn btn-primary mt-5 shadow-[0_6px_18px_rgba(25,103,210,0.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(25,103,210,0.38)]"
              onClick={() => setIsModalOpen(true)}
              type="button"
            >
              <UserPlus className="h-5 w-5" /> {t("patients.add")}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="flex min-w-[104px] flex-col items-center justify-center rounded-2xl bg-white/70 px-3 py-4 text-center shadow-sm backdrop-blur transition-transform hover:-translate-y-0.5 dark:bg-white/5">
              <span className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary dark:bg-primary/15">
                <Users className="h-5 w-5" />
              </span>
              <span className="text-2xl font-extrabold leading-none text-secondary-text">{patients.length}</span>
              <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-[var(--color-secondary-muted)]">Total</span>
            </div>
            <div className="flex min-w-[104px] flex-col items-center justify-center rounded-2xl bg-white/70 px-3 py-4 text-center shadow-sm backdrop-blur transition-transform hover:-translate-y-0.5 dark:bg-white/5">
              <span className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                <HeartPulse className="h-5 w-5" />
              </span>
              <span className="text-2xl font-extrabold leading-none text-secondary-text">{activeCount}</span>
              <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-[var(--color-secondary-muted)]">Activos</span>
            </div>
            <div className="flex min-w-[104px] flex-col items-center justify-center rounded-2xl bg-white/70 px-3 py-4 text-center shadow-sm backdrop-blur transition-transform hover:-translate-y-0.5 dark:bg-white/5">
              <span className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                <UserX className="h-5 w-5" />
              </span>
              <span className="text-2xl font-extrabold leading-none text-secondary-text">{pausedCount}</span>
              <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-[var(--color-secondary-muted)]">En pausa</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4 shadow-[0_4px_20px_rgba(15,23,42,0.06)] sm:p-5 dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
        <div className="mb-3 flex items-center gap-2 text-[13px] font-black uppercase tracking-wider text-slate-400">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Filtros
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t("patients.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="inp py-3.5 pl-12 text-base shadow-sm"
            />
          </div>

          <SelectWithIcon icon={Stethoscope} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">{t("patients.allTypes")}</option>
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </SelectWithIcon>

          <SelectWithIcon icon={HeartPulse} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">{t("patients.allStatus")}</option>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </SelectWithIcon>

          <AnimatePresence>
            {hasActiveFilters && (
              <motion.button
                type="button"
                onClick={clearFilters}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="btn btn-ghost btn-sm shrink-0 text-slate-500"
              >
                <X className="h-4 w-4" /> Limpiar
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : patients.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="card flex flex-col items-center justify-center gap-5 px-6 py-20 text-center"
        >
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary-light text-primary ring-8 ring-primary/5 dark:bg-primary/15 dark:ring-primary/10">
            <Users className="h-9 w-9" />
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-md">
              <Plus className="h-4 w-4" />
            </span>
          </div>
          <div className="max-w-sm">
            <h3 className="text-xl font-bold text-secondary-text">Aún no hay pacientes registrados</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-[var(--color-secondary-muted)]">
              Tu directorio clínico está vacío. Empieza añadiendo tu primer paciente para organizar sus sesiones.
            </p>
          </div>
          <button className="btn btn-primary shadow-[0_6px_18px_rgba(25,103,210,0.28)]" onClick={() => setIsModalOpen(true)} type="button">
            <UserPlus className="h-5 w-5" /> {t("patients.add")}
          </button>
        </motion.div>
      ) : filteredPatients.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="card flex flex-col items-center justify-center gap-5 px-6 py-20 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-[var(--color-secondary-border)]">
            <Search className="h-9 w-9" />
          </div>
          <div className="max-w-sm">
            <h3 className="text-xl font-bold text-secondary-text">No se encontraron pacientes</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-[var(--color-secondary-muted)]">
              Ningún paciente coincide con la búsqueda o los filtros aplicados. Prueba a ajustarlos.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={clearFilters} type="button">
            <X className="h-4 w-4" /> Limpiar filtros
          </button>
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => {
            const patientStatus = patient.status || (patient.active ? "activo" : "pasivo");
            const age = calculateAge(patient.birthDate);
            const birthdayAlert = getBirthdayAlert(patient.birthDate, patient.patientType);

            return (
              <motion.div
                variants={item}
                key={patient.id}
                className="card group relative flex flex-col overflow-hidden bg-white/80 shadow-[0_2px_10px_rgba(15,23,42,0.05)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-border hover:shadow-[0_16px_40px_rgba(25,103,210,0.14)] dark:bg-[var(--color-secondary-card)]"
              >
                  <div
                    className={`relative h-16 w-full overflow-hidden bg-gradient-to-r ${patient.color || "bg-blue-500"}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/10 opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_0%_0%,rgba(255,255,255,0.35),transparent_55%)]" />
                    <div className={`absolute -bottom-6 left-5 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg ring-4 ring-white dark:ring-[var(--color-secondary-card)] ${patient.color || "bg-blue-500"}`}>
                      {patient.name.charAt(0)}
                    </div>
                  </div>

                  <div className="z-10 flex flex-1 flex-col px-5 pb-5 pt-10">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-xl font-extrabold leading-tight text-secondary-text">{patient.name}</h3>
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-[var(--color-secondary-border)] dark:text-[var(--color-secondary-muted)]">
                        <Stethoscope className="h-3 w-3" />
                        {getPatientTypeLabel(patient.patientType)}
                      </span>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${getPatientStatusClasses(patientStatus)}`}>
                      {getPatientStatusLabel(patientStatus)}
                    </span>
                  </div>

                  <div className="mb-4 grid grid-cols-1 gap-x-4 gap-y-2.5 text-[13px] font-medium text-slate-600 dark:text-[var(--color-secondary-muted)] sm:grid-cols-2">
                    {patient.dni && (
                      <p className="flex items-center gap-2"><IdCard className="h-4 w-4 shrink-0 text-slate-400" /> <span className="truncate">{patient.dni}</span></p>
                    )}
                    {age !== null && (
                      <p className="flex items-center gap-2"><Cake className="h-4 w-4 shrink-0 text-slate-400" /> {age} {t("patients.age") === "Age" ? "" : "años"}</p>
                    )}
                    {patient.phone && (
                      <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-slate-400" /> <span className="truncate">{patient.phone}</span></p>
                    )}
                    {patient.email && (
                      <p className="flex items-center gap-2 truncate"><Mail className="h-4 w-4 shrink-0 text-slate-400" /> <span className="truncate">{patient.email}</span></p>
                    )}
                    <p className="flex items-center gap-2 sm:col-span-2"><Clock className="h-4 w-4 shrink-0 text-slate-400" /> {t("patients.admitted")}: {new Date(patient.createdAt).toLocaleDateString(locale)}</p>
                  </div>

                  {birthdayAlert && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                      <Cake className="h-4 w-4 shrink-0" />
                      {birthdayAlert}
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      <HeartPulse className="h-3.5 w-3.5" />
                      {t("patients.statusClinical")}
                    </label>
                    <div className="relative">
                      <select
                        className="inp cursor-pointer appearance-none pr-9 text-sm"
                        value={patientStatus}
                        onChange={(e) => handleStatusChange(patient.id, e.target.value)}
                        disabled={isPending}
                      >
                        {statusOptions.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <svg
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>

                  <div className="mt-auto flex gap-2 border-t border-slate-100 pt-4 dark:border-[var(--color-secondary-border)]">
                    <Link
                      href={`/dashboard/patients/${patient.id}`}
                      className="btn btn-primary btn-sm flex flex-1 items-center justify-center gap-1.5 bg-primary-light text-primary transition-all hover:bg-primary hover:text-white"
                    >
                      {t("patients.openFile")} <ChevronRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/dashboard/patients/${patient.id}/history`}
                      className="btn btn-ghost btn-sm flex items-center justify-center border-slate-200 p-2 transition-all hover:border-primary-border hover:bg-primary-light hover:text-primary dark:border-[var(--color-secondary-border)]"
                      title={t("patients.viewHistory")}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-2xl overflow-hidden rounded-[24px] bg-white shadow-2xl dark:bg-[var(--color-secondary-card)]">
              <div className="relative flex items-center justify-between gap-3 overflow-hidden bg-gradient-to-r from-primary to-primary-dark p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur">
                    <UserPlus className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-bold text-white">{t("patients.modal.title")}</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white" type="button">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddPatient} className="space-y-4 p-6 sm:p-7">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[13px] font-bold text-slate-700 dark:text-[var(--color-secondary-muted)]">{t("patients.modal.fullName")}</label>
                    <input required type="text" className="inp" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700 dark:text-[var(--color-secondary-muted)]">{t("patients.dni")}</label>
                    <input type="text" className="inp" value={formData.dni} onChange={(e) => setFormData({ ...formData, dni: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700 dark:text-[var(--color-secondary-muted)]">{t("patients.modal.birth")}</label>
                    <input type="date" className="inp" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700 dark:text-[var(--color-secondary-muted)]">{t("patients.phone")}</label>
                    <input type="tel" className="inp" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700 dark:text-[var(--color-secondary-muted)]">{t("patients.email")}</label>
                    <input type="email" className="inp" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700 dark:text-[var(--color-secondary-muted)]">{t("patients.type.adult")}</label>
                    <select className="inp" value={formData.patientType} onChange={(e) => setFormData({ ...formData, patientType: e.target.value, description: getPatientTypeLabel(e.target.value) })}>
                      {typeOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700 dark:text-[var(--color-secondary-muted)]">{t("patients.status.active")}</label>
                    <select className="inp" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                      {statusOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700 dark:text-[var(--color-secondary-muted)]">{t("patients.modal.guardian")}</label>
                    <input type="text" className="inp" value={formData.guardianName} onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700 dark:text-[var(--color-secondary-muted)]">{t("patients.modal.guardianDni")}</label>
                    <input type="text" className="inp" value={formData.guardianDni} onChange={(e) => setFormData({ ...formData, guardianDni: e.target.value })} />
                  </div>
                </div>

                <div className="flex gap-3 pt-5">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost flex-1 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--color-secondary-border)]">
                    {t("patients.modal.cancel")}
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary flex flex-1 items-center justify-center shadow-[0_6px_18px_rgba(25,103,210,0.28)]">
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : t("patients.modal.save")}
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
