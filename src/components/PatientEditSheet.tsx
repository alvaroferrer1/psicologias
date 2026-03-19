"use client";

import { useState } from "react";
import { Edit3, Loader2, Save } from "lucide-react";
import { updatePatient } from "@/app/actions/patients";
import { useToast } from "@/components/ToastProvider";

type Props = {
  patient: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    dni?: string | null;
    birthDate?: string | null;
    address?: string | null;
    patientType?: string | null;
    status?: string | null;
    guardianName?: string | null;
    guardianDni?: string | null;
    guardianPhone?: string | null;
    guardianEmail?: string | null;
    clinicalAlerts?: string | null;
  };
};

export function PatientEditSheet({ patient }: Props) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: patient.name || "",
    email: patient.email || "",
    phone: patient.phone || "",
    dni: patient.dni || "",
    birthDate: patient.birthDate ? patient.birthDate.slice(0, 10) : "",
    address: patient.address || "",
    patientType: patient.patientType || "adulto",
    status: patient.status || "activo",
    guardianName: patient.guardianName || "",
    guardianDni: patient.guardianDni || "",
    guardianPhone: patient.guardianPhone || "",
    guardianEmail: patient.guardianEmail || "",
    clinicalAlerts: patient.clinicalAlerts || "",
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    const res = await updatePatient({ id: patient.id, ...formData });
    if (res.success) {
      toast({ type: "success", title: "Ficha actualizada." });
      setIsOpen(false);
      window.location.reload();
    } else {
      toast({ type: "error", title: res.error || "No se pudo actualizar el paciente." });
    }
    setIsSaving(false);
  };

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className="btn btn-secondary">
        <Edit3 className="h-4 w-4" /> Editar ficha
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-[24px] bg-white shadow-2xl">
            <div className="border-b border-slate-100 bg-slate-50 p-6">
              <h3 className="text-lg font-bold text-secondary-text">Editar ficha del paciente</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[13px] font-bold text-slate-700">Nombre completo</label>
                  <input required type="text" className="inp" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-bold text-slate-700">DNI</label>
                  <input type="text" className="inp" value={formData.dni} onChange={(e) => setFormData((prev) => ({ ...prev, dni: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-bold text-slate-700">Fecha de nacimiento</label>
                  <input type="date" className="inp" value={formData.birthDate} onChange={(e) => setFormData((prev) => ({ ...prev, birthDate: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-bold text-slate-700">Teléfono</label>
                  <input type="text" className="inp" value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-bold text-slate-700">Email</label>
                  <input type="email" className="inp" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[13px] font-bold text-slate-700">Dirección</label>
                  <input type="text" className="inp" value={formData.address} onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-bold text-slate-700">Tipo</label>
                  <select className="inp" value={formData.patientType} onChange={(e) => setFormData((prev) => ({ ...prev, patientType: e.target.value }))}>
                    <option value="infantil">Niños</option>
                    <option value="adolescente">Adolescentes</option>
                    <option value="adulto">Adultos</option>
                    <option value="pareja">Parejas</option>
                    <option value="familia">Familia</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-bold text-slate-700">Estado</label>
                  <select className="inp" value={formData.status} onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}>
                    <option value="activo">Activo</option>
                    <option value="pausa">Pausa</option>
                    <option value="pasivo">Pasivo</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-bold text-slate-700">Apoderado / tutor</label>
                  <input type="text" className="inp" value={formData.guardianName} onChange={(e) => setFormData((prev) => ({ ...prev, guardianName: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-bold text-slate-700">DNI del apoderado</label>
                  <input type="text" className="inp" value={formData.guardianDni} onChange={(e) => setFormData((prev) => ({ ...prev, guardianDni: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-bold text-slate-700">Teléfono del apoderado</label>
                  <input type="text" className="inp" value={formData.guardianPhone} onChange={(e) => setFormData((prev) => ({ ...prev, guardianPhone: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-bold text-slate-700">Email del apoderado</label>
                  <input type="email" className="inp" value={formData.guardianEmail} onChange={(e) => setFormData((prev) => ({ ...prev, guardianEmail: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[13px] font-bold text-slate-700">Alertas clínicas</label>
                  <textarea className="inp min-h-[90px] w-full resize-y" value={formData.clinicalAlerts} onChange={(e) => setFormData((prev) => ({ ...prev, clinicalAlerts: e.target.value }))} />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="btn btn-ghost flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="btn btn-primary flex-1">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Guardar cambios</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
