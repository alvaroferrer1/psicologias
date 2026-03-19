"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { Patient } from "@prisma/client";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Calendar, FolderOpen, Loader2, Mail, Phone, Search, UserPlus, X } from "lucide-react";
import { createPatient, getPatients, updatePatientStatus } from "@/app/actions/patients";
import { useToast } from "@/components/ToastProvider";
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<PatientForm>(emptyForm);

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
      toast({ type: "success", title: "Paciente guardado.", description: "La ficha ya esta disponible en el directorio." });
    } else {
      toast({ type: "error", title: res.error || "No se pudo guardar el paciente." });
    }

    setIsSubmitting(false);
  };

  const handleStatusChange = (patientId: string, status: string) => {
    startTransition(async () => {
      const res = await updatePatientStatus(patientId, status);
      if (res.success) {
        await refreshPatients();
        toast({ type: "success", title: "Estado actualizado." });
      } else {
        toast({ type: "error", title: res.error || "No se pudo actualizar el estado." });
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

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-secondary-text md:text-3xl">Directorio clinico</h2>
          <p className="mt-1 text-sm font-medium text-slate-500 md:text-base">
            Gestiona historiales, documentacion y notas de tus pacientes.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} type="button">
          <UserPlus className="h-5 w-5" /> Anadir paciente
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar paciente por nombre o DNI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="inp py-3 pl-10 text-base shadow-sm"
            />
          </div>

          <select className="inp min-w-[180px]" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="infantil">Ninos</option>
            <option value="adolescente">Adolescentes</option>
            <option value="adulto">Adultos</option>
            <option value="pareja">Parejas</option>
            <option value="familia">Familia</option>
          </select>

          <select className="inp min-w-[170px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="pausa">Pausa</option>
            <option value="pasivo">Pasivo</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
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
                className="card group relative flex flex-col overflow-hidden bg-white/70 p-5 backdrop-blur-sm transition-all duration-300 hover:border-primary-border hover:shadow-xl"
              >
                <div className="absolute right-0 top-0 -z-10 h-32 w-32 rounded-full bg-primary/5 blur-3xl transition-colors group-hover:bg-primary/10" />
                <div className="z-10 mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white shadow-inner ${patient.color || "bg-blue-500"}`}>
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold leading-tight text-secondary-text">{patient.name}</h3>
                      <p className="mt-0.5 text-xs font-medium text-slate-400">{getPatientTypeLabel(patient.patientType)}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${getPatientStatusClasses(patientStatus)}`}>
                    {getPatientStatusLabel(patientStatus)}
                  </span>
                </div>

                <div className="z-10 mb-4 space-y-2.5 text-[13px] font-medium text-slate-500">
                  {patient.dni && <p>DNI: {patient.dni}</p>}
                  {age !== null && <p>Edad: {age} anos</p>}
                  {patient.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> {patient.phone}</p>}
                  {patient.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /> {patient.email}</p>}
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    Alta: {new Date(patient.createdAt).toLocaleDateString("es-ES")}
                  </p>
                  {birthdayAlert && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                      {birthdayAlert}
                    </div>
                  )}
                </div>

                <div className="z-10 mb-4">
                  <label className="mb-1 block text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Estado clinico
                  </label>
                  <select
                    className="inp text-sm"
                    value={patientStatus}
                    onChange={(e) => handleStatusChange(patient.id, e.target.value)}
                    disabled={isPending}
                  >
                    <option value="activo">Activo</option>
                    <option value="pausa">Pausa</option>
                    <option value="pasivo">Pasivo</option>
                  </select>
                </div>

                <div className="z-10 mt-auto flex gap-2 border-t border-slate-100 pt-4">
                  <Link href={`/dashboard/patients/${patient.id}`} className="btn btn-secondary btn-sm flex-1 bg-primary-light text-center text-primary hover:border-primary hover:bg-primary hover:text-white">
                    Abrir ficha
                  </Link>
                  <Link href={`/dashboard/patients/${patient.id}/history`} className="btn btn-ghost btn-sm flex items-center justify-center border-slate-200 p-2 hover:bg-slate-100" title="Ver historial completo">
                    <FolderOpen className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-2xl overflow-hidden rounded-[24px] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-6">
                <h3 className="text-lg font-bold text-secondary-text">Nuevo paciente</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 transition-colors hover:text-red-500" type="button">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddPatient} className="space-y-4 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[13px] font-bold text-slate-700">Nombre completo *</label>
                    <input required type="text" className="inp" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700">DNI</label>
                    <input type="text" className="inp" value={formData.dni} onChange={(e) => setFormData({ ...formData, dni: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700">Fecha de nacimiento</label>
                    <input type="date" className="inp" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700">Telefono</label>
                    <input type="tel" className="inp" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700">Email</label>
                    <input type="email" className="inp" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700">Tipo</label>
                    <select className="inp" value={formData.patientType} onChange={(e) => setFormData({ ...formData, patientType: e.target.value, description: getPatientTypeLabel(e.target.value) })}>
                      <option value="infantil">Ninos</option>
                      <option value="adolescente">Adolescentes</option>
                      <option value="adulto">Adultos</option>
                      <option value="pareja">Parejas</option>
                      <option value="familia">Familia</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700">Estado</label>
                    <select className="inp" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                      <option value="activo">Activo</option>
                      <option value="pausa">Pausa</option>
                      <option value="pasivo">Pasivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700">Apoderado / tutor</label>
                    <input type="text" className="inp" value={formData.guardianName} onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700">DNI apoderado</label>
                    <input type="text" className="inp" value={formData.guardianDni} onChange={(e) => setFormData({ ...formData, guardianDni: e.target.value })} />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost flex-1 font-bold text-slate-500 hover:bg-slate-100">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary flex flex-1 items-center justify-center">
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar paciente"}
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
