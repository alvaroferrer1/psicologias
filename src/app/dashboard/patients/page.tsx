"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Patient } from "@prisma/client";
import { Search, Phone, Mail, FolderOpen, Calendar, UserPlus, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { getPatients, createPatient } from "@/app/actions/patients";
import { useToast } from "@/components/ToastProvider";

type PatientForm = {
  name: string;
  email: string;
  phone: string;
  description: string;
};

export default function PatientsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PatientForm>({ name: "", email: "", phone: "", description: "Adulto" });

  useEffect(() => {
    let active = true;

    const loadPatients = async () => {
      const data = await getPatients();
      if (!active) return;
      setPatients(data);
      setLoading(false);
    };

    loadPatients();

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
      setFormData({ name: "", email: "", phone: "", description: "Adulto" });
      await refreshPatients();
      toast({ type: "success", title: "Paciente guardado.", description: "La ficha ya está disponible en el directorio." });
    } else {
      toast({ type: "error", title: "No se pudo guardar el paciente." });
    }

    setIsSubmitting(false);
  };

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

  const filteredPatients = patients.filter((patient) => patient.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-secondary-text md:text-3xl">Directorio Clínico</h2>
          <p className="mt-1 text-sm font-medium text-slate-500 md:text-base">
            Gestiona historiales, documentación y notas de tus {patients.length} pacientes activos.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} type="button">
          <UserPlus className="h-5 w-5" /> Añadir Paciente
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar paciente por nombre o DNI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="inp py-3 pl-10 text-base shadow-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => (
            <motion.div variants={item} key={patient.id} className="card group relative flex flex-col overflow-hidden bg-white/70 p-5 backdrop-blur-sm transition-all duration-300 hover:border-primary-border hover:shadow-xl">
              <div className="absolute right-0 top-0 -z-10 h-32 w-32 rounded-full bg-primary/5 blur-3xl transition-colors group-hover:bg-primary/10" />
              <div className="z-10 mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white shadow-inner ${patient.color || "bg-emerald-500"}`}>
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold leading-tight text-secondary-text">{patient.name}</h3>
                    <p className="mt-0.5 text-xs font-medium text-slate-400">{patient.description || "Adulto"}</p>
                  </div>
                </div>
                {patient.active ? (
                  <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">Activo</span>
                ) : (
                  <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Inactivo</span>
                )}
              </div>

              <div className="z-10 mb-6 space-y-2.5 text-[13px] font-medium text-slate-500">
                {patient.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> {patient.phone}</p>}
                {patient.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /> {patient.email}</p>}
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Alta: {new Date(patient.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="z-10 mt-auto flex gap-2 border-t border-slate-100 pt-4">
                <Link href={`/dashboard/patients/${patient.id}`} className="btn btn-secondary btn-sm flex-1 bg-primary-light text-center text-primary hover:border-primary group-hover:border-primary hover:bg-primary hover:text-white">
                  Abrir Ficha
                </Link>
                <Link href={`/dashboard/patients/${patient.id}/history`} className="btn btn-ghost btn-sm flex items-center justify-center border-slate-200 p-2 hover:bg-slate-100" title="Ver historial completo">
                  <FolderOpen className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-6">
                <h3 className="text-lg font-bold text-secondary-text">Nuevo Paciente</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 transition-colors hover:text-red-500" type="button">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddPatient} className="space-y-4 p-6">
                <div>
                  <label className="mb-1 block text-[13px] font-bold text-slate-700">Nombre Completo *</label>
                  <input
                    required
                    type="text"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Ej. Ana García"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700">Teléfono</label>
                    <input
                      type="tel"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="Ej. 600..."
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-slate-700">Email</label>
                    <input
                      type="email"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="Ej. correo@app.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-bold text-slate-700">Tipo de Terapia / Descripción</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  >
                    <option value="Adulto">Terapia de Adultos</option>
                    <option value="Adolescente">Terapia Adolescente</option>
                    <option value="Infantil">Terapia Infantil</option>
                    <option value="Pareja">Terapia de Pareja</option>
                    <option value="Familiar">Terapia Familiar</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost flex-1 font-bold text-slate-500 hover:bg-slate-100">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary flex flex-1 items-center justify-center">
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar Paciente"}
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
