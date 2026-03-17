"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarDays, Download, FileText, FileUp, FolderHeart, NotebookPen, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { addConsentRecord, addPatientDocument, addPatientNote, archivePatient, restorePatient } from "@/app/actions/patients";
import { useToast } from "@/components/ToastProvider";

type ReportItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  updatedAt: string;
  versions: number;
};

type AppointmentItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  date: string;
  videoUrl?: string | null;
};

type NoteItem = {
  id: string;
  title: string;
  content: string;
  sessionDate?: string | null;
  createdAt: string;
};

type DocumentItem = {
  id: string;
  title: string;
  documentType: string;
  url?: string | null;
  notes?: string | null;
  createdAt: string;
};

type ConsentItem = {
  id: string;
  consentType: string;
  status: string;
  signedAt?: string | null;
  notes?: string | null;
  createdAt: string;
};

type PatientWorkspaceProps = {
  patient: {
    id: string;
    name: string;
    description?: string | null;
    email?: string | null;
    phone?: string | null;
    archived?: boolean;
  };
  reports: ReportItem[];
  appointments: AppointmentItem[];
  notes: NoteItem[];
  documents: DocumentItem[];
  consents: ConsentItem[];
};

export function PatientWorkspace({ patient, reports, appointments, notes, documents, consents }: PatientWorkspaceProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [reportQuery, setReportQuery] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [reportType, setReportType] = useState("");
  const [noteForm, setNoteForm] = useState({ title: "", content: "", sessionDate: "" });
  const [documentForm, setDocumentForm] = useState({ title: "", documentType: "Consentimiento", url: "", notes: "" });
  const [consentForm, setConsentForm] = useState({ consentType: "Proteccion de datos", status: "firmado", signedAt: "", notes: "" });

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesQuery =
        !reportQuery ||
        report.title.toLowerCase().includes(reportQuery.toLowerCase()) ||
        report.type.toLowerCase().includes(reportQuery.toLowerCase());
      const matchesStatus = !reportStatus || report.status === reportStatus;
      const matchesType = !reportType || report.type === reportType;
      return matchesQuery && matchesStatus && matchesType;
    });
  }, [reportQuery, reportStatus, reportType, reports]);

  const exportDossier = () => {
    const payload = {
      patient,
      generatedAt: new Date().toISOString(),
      reports,
      appointments,
      notes,
      documents,
      consents,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expediente_${patient.name.replace(/\s+/g, "_").toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast({ type: "success", title: "Expediente exportado.", description: "Se ha descargado un JSON completo del caso." });
  };

  const handleAddNote = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const res = await addPatientNote({ patientId: patient.id, ...noteForm });
      if (!res.success) {
        toast({ type: "error", title: res.error || "No se pudo guardar la nota." });
        return;
      }
      setNoteForm({ title: "", content: "", sessionDate: "" });
      toast({ type: "success", title: "Nota guardada." });
    });
  };

  const handleAddDocument = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const res = await addPatientDocument({ patientId: patient.id, ...documentForm });
      if (!res.success) {
        toast({ type: "error", title: res.error || "No se pudo guardar el documento." });
        return;
      }
      setDocumentForm({ title: "", documentType: "Consentimiento", url: "", notes: "" });
      toast({ type: "success", title: "Documento registrado." });
    });
  };

  const handleAddConsent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const res = await addConsentRecord({ patientId: patient.id, ...consentForm });
      if (!res.success) {
        toast({ type: "error", title: res.error || "No se pudo guardar el consentimiento." });
        return;
      }
      setConsentForm({ consentType: "Proteccion de datos", status: "firmado", signedAt: "", notes: "" });
      toast({ type: "success", title: "Consentimiento guardado." });
    });
  };

  const handleArchiveToggle = () => {
    startTransition(async () => {
      const res = patient.archived ? await restorePatient(patient.id) : await archivePatient(patient.id);
      if (!res.success) {
        toast({ type: "error", title: res.error || "No se pudo actualizar el estado del paciente." });
        return;
      }
      toast({
        type: "success",
        title: patient.archived ? "Paciente restaurado." : "Paciente enviado a papelera.",
      });
      window.location.reload();
    });
  };

  const uniqueReportTypes = [...new Set(reports.map((report) => report.type))];
  const uniqueReportStatuses = [...new Set(reports.map((report) => report.status))];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={exportDossier} className="btn btn-secondary">
          <Download className="h-4 w-4" /> Exportar expediente
        </button>
        <button type="button" onClick={handleArchiveToggle} disabled={isPending} className="btn btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700">
          {patient.archived ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
          {patient.archived ? "Restaurar paciente" : "Enviar a papelera"}
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-extrabold text-secondary-text">Historial de informes</h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <input
                value={reportQuery}
                onChange={(event) => setReportQuery(event.target.value)}
                placeholder="Buscar por titulo o tipo"
                className="inp w-full"
              />
              <select value={reportStatus} onChange={(event) => setReportStatus(event.target.value)} className="inp w-full">
                <option value="">Todos los estados</option>
                {uniqueReportStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <select value={reportType} onChange={(event) => setReportType(event.target.value)} className="inp w-full">
                <option value="">Todos los tipos</option>
                {uniqueReportTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="mt-5 space-y-3">
              {filteredReports.length === 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
                  No hay informes que coincidan con los filtros.
                </div>
              ) : (
                filteredReports.map((report) => (
                  <div key={report.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-secondary-text">{report.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{report.type} · {new Date(report.updatedAt).toLocaleString("es-ES")}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                          {report.versions} versiones
                        </span>
                        <span className="rounded-full bg-primary-light px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
                          {report.status}
                        </span>
                        <a href={`/dashboard/history/${report.id}`} className="btn btn-secondary">
                          Abrir informe
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2">
              <NotebookPen className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-extrabold text-secondary-text">Notas clinicas privadas</h2>
            </div>
            <form onSubmit={handleAddNote} className="mt-5 space-y-3">
              <input value={noteForm.title} onChange={(event) => setNoteForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Titulo de la nota" className="inp w-full" required />
              <textarea value={noteForm.content} onChange={(event) => setNoteForm((prev) => ({ ...prev, content: event.target.value }))} placeholder="Observaciones clinicas, seguimiento, acuerdos..." className="inp min-h-[120px] w-full resize-y" required />
              <input type="date" value={noteForm.sessionDate} onChange={(event) => setNoteForm((prev) => ({ ...prev, sessionDate: event.target.value }))} className="inp w-full" />
              <button type="submit" disabled={isPending} className="btn btn-primary">
                <NotebookPen className="h-4 w-4" /> Guardar nota
              </button>
            </form>
            <div className="mt-5 space-y-3">
              {notes.length === 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
                  Todavia no hay notas privadas en este caso.
                </div>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-secondary-text">{note.title}</p>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {note.sessionDate ? new Date(note.sessionDate).toLocaleDateString("es-ES") : new Date(note.createdAt).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-extrabold text-secondary-text">Documentos vinculados</h2>
            </div>
            <form onSubmit={handleAddDocument} className="mt-5 space-y-3">
              <input value={documentForm.title} onChange={(event) => setDocumentForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Nombre del documento" className="inp w-full" required />
              <select value={documentForm.documentType} onChange={(event) => setDocumentForm((prev) => ({ ...prev, documentType: event.target.value }))} className="inp w-full">
                <option value="Consentimiento">Consentimiento</option>
                <option value="Informe externo">Informe externo</option>
                <option value="Justificante">Justificante</option>
                <option value="Otro">Otro</option>
              </select>
              <input value={documentForm.url} onChange={(event) => setDocumentForm((prev) => ({ ...prev, url: event.target.value }))} placeholder="URL o referencia interna (opcional)" className="inp w-full" />
              <textarea value={documentForm.notes} onChange={(event) => setDocumentForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Notas del documento" className="inp min-h-[90px] w-full resize-y" />
              <button type="submit" disabled={isPending} className="btn btn-primary">
                <FolderHeart className="h-4 w-4" /> Registrar documento
              </button>
            </form>
            <div className="mt-5 space-y-3">
              {documents.length === 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
                  No hay documentos vinculados.
                </div>
              ) : (
                documents.map((document) => (
                  <div key={document.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-secondary-text">{document.title}</p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {document.documentType}
                      </span>
                    </div>
                    {document.url && (
                      <a href={document.url} target="_blank" rel="noreferrer" className="mt-2 block text-sm font-semibold text-primary hover:underline">
                        Abrir referencia
                      </a>
                    )}
                    {document.notes && <p className="mt-2 text-sm text-slate-600">{document.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-extrabold text-secondary-text">Consentimientos</h2>
            </div>
            <form onSubmit={handleAddConsent} className="mt-5 space-y-3">
              <input value={consentForm.consentType} onChange={(event) => setConsentForm((prev) => ({ ...prev, consentType: event.target.value }))} placeholder="Tipo de consentimiento" className="inp w-full" required />
              <select value={consentForm.status} onChange={(event) => setConsentForm((prev) => ({ ...prev, status: event.target.value }))} className="inp w-full">
                <option value="firmado">Firmado</option>
                <option value="pendiente">Pendiente</option>
                <option value="revocado">Revocado</option>
              </select>
              <input type="date" value={consentForm.signedAt} onChange={(event) => setConsentForm((prev) => ({ ...prev, signedAt: event.target.value }))} className="inp w-full" />
              <textarea value={consentForm.notes} onChange={(event) => setConsentForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Observaciones legales o clinicas" className="inp min-h-[90px] w-full resize-y" />
              <button type="submit" disabled={isPending} className="btn btn-primary">
                <ShieldCheck className="h-4 w-4" /> Guardar consentimiento
              </button>
            </form>
            <div className="mt-5 space-y-3">
              {consents.length === 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
                  No hay consentimientos registrados.
                </div>
              ) : (
                consents.map((consent) => (
                  <div key={consent.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-secondary-text">{consent.consentType}</p>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${consent.status === "firmado" ? "bg-emerald-100 text-emerald-700" : consent.status === "pendiente" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {consent.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {consent.signedAt ? `Fecha: ${new Date(consent.signedAt).toLocaleDateString("es-ES")}` : "Sin fecha de firma"}
                    </p>
                    {consent.notes && <p className="mt-2 text-sm text-slate-600">{consent.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-extrabold text-secondary-text">Citas registradas</h2>
            </div>
            <div className="mt-5 space-y-3">
              {appointments.length === 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
                  No hay citas registradas.
                </div>
              ) : (
                appointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-secondary-text">{appointment.title}</p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {appointment.type}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{new Date(appointment.date).toLocaleString("es-ES")}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
