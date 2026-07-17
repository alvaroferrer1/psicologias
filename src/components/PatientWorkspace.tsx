"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarDays, Download, FileText, FileUp, FolderHeart, NotebookPen, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { addConsentRecord, addPatientDocument, addPatientNote, archivePatient, restorePatient } from "@/app/actions/patients";
import { useToast } from "@/components/ToastProvider";
import { useT } from "@/lib/useT";

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
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
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
  const { t: tt, lang } = useT();
  const isEn = lang === "en";
  const [isPending, startTransition] = useTransition();
  const [reportQuery, setReportQuery] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [reportType, setReportType] = useState("");
  const [noteForm, setNoteForm] = useState({ title: "", content: "", sessionDate: "" });
  const [documentForm, setDocumentForm] = useState({ title: "", documentType: tt("patients.consentTypes.protection"), url: "", notes: "" });
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [consentForm, setConsentForm] = useState({ consentType: tt("patients.consentTypes.protection"), status: "firmado", signedAt: "", notes: "" });

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
    toast({ type: "success", title: tt("toast.dossierExported"), description: tt("toast.dossierExportedDesc") });
  };

  const handleAddNote = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const res = await addPatientNote({ patientId: patient.id, ...noteForm });
      if (!res.success) {
        toast({ type: "error", title: res.error || tt("toast.saveError") });
        return;
      }
      setNoteForm({ title: "", content: "", sessionDate: "" });
      toast({ type: "success", title: tt("toast.noteSaved") });
    });
  };

  const handleAddDocument = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      let uploadPayload: Record<string, string | number | undefined> = {};

      if (documentFile) {
        const payload = new FormData();
        payload.append("file", documentFile);
        payload.append("patientId", patient.id);
        const uploadRes = await fetch("/api/uploads/patient-document", {
          method: "POST",
          body: payload,
        });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) {
          toast({ type: "error", title: uploadJson.error || tt("toast.saveError") });
          return;
        }
        uploadPayload = uploadJson;
      }

      const res = await addPatientDocument({ patientId: patient.id, ...documentForm, ...uploadPayload });
      if (!res.success) {
        toast({ type: "error", title: res.error || tt("toast.saveError") });
        return;
      }
      setDocumentForm({ title: "", documentType: tt("patients.consentTypes.protection"), url: "", notes: "" });
      setDocumentFile(null);
      toast({ type: "success", title: tt("toast.docSaved") });
      window.location.reload();
    });
  };

  const handleAddConsent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const res = await addConsentRecord({ patientId: patient.id, ...consentForm });
      if (!res.success) {
        toast({ type: "error", title: res.error || tt("toast.saveError") });
        return;
      }
      setConsentForm({ consentType: tt("patients.consentTypes.protection"), status: "firmado", signedAt: "", notes: "" });
      toast({ type: "success", title: tt("toast.consentSaved") });
    });
  };

  const handleArchiveToggle = () => {
    startTransition(async () => {
      const res = patient.archived ? await restorePatient(patient.id) : await archivePatient(patient.id);
      if (!res.success) {
        toast({ type: "error", title: res.error || tt("toast.saveError") });
        return;
      }
      toast({
        type: "success",
        title: patient.archived ? tt("toast.patientRestored") : tt("toast.patientTrashed"),
      });
      window.location.reload();
    });
  };

  const uniqueReportTypes = [...new Set(reports.map((report) => report.type))];
  const uniqueReportStatuses = [...new Set(reports.map((report) => report.status))];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      firmado: "bg-emerald-100 text-emerald-700",
      pendiente: "bg-amber-100 text-amber-700",
      revocado: "bg-red-100 text-red-700",
      signed: "bg-emerald-100 text-emerald-700",
      pending: "bg-amber-100 text-amber-700",
      revoked: "bg-red-100 text-red-700",
    };
    const label = status === "firmado" ? tt("patients.consentSigned") : status === "pendiente" ? tt("patients.consentPending") : status === "revocado" ? tt("patients.consentRevoked") : status;
    return (
      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${map[status] || "bg-slate-100 text-slate-600"}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={exportDossier} className="btn btn-secondary">
          <Download className="h-4 w-4" /> {tt("patients.exportDossier")}
        </button>
        <button type="button" onClick={handleArchiveToggle} disabled={isPending} className="btn btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700">
          {patient.archived ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
          {patient.archived ? tt("patients.restore") : tt("patients.sendTrash")}
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary dark:bg-primary/10">
                <FileText className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-extrabold text-secondary-text">{tt("patients.reportHistory")}</h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <input
                value={reportQuery}
                onChange={(event) => setReportQuery(event.target.value)}
                placeholder={tt("patients.searchReport")}
                className="inp w-full"
              />
              <select value={reportStatus} onChange={(event) => setReportStatus(event.target.value)} className="inp w-full">
                <option value="">{tt("patients.allStatus")}</option>
                {uniqueReportStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <select value={reportType} onChange={(event) => setReportType(event.target.value)} className="inp w-full">
                <option value="">{tt("patients.allTypes")}</option>
                {uniqueReportTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="mt-5 space-y-3">
              {filteredReports.length === 0 ? (
                <div className="rounded-2xl border border-secondary-border bg-slate-50 p-5 text-sm text-slate-500 dark:bg-[var(--color-secondary-card)] dark:text-[var(--color-secondary-muted)]">
                  {tt("patients.noReports")}
                </div>
              ) : (
                filteredReports.map((report) => (
                  <div key={report.id} className="rounded-2xl border border-secondary-border bg-slate-50 p-4 transition-colors hover:border-primary/30 dark:bg-[var(--color-secondary-card)] dark:border-[var(--color-secondary-border)]">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-secondary-text">{report.title}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-[var(--color-secondary-muted)]">{report.type} · {new Date(report.updatedAt).toLocaleString(isEn ? "en-US" : "es-ES")}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:bg-[var(--color-secondary-card)] dark:text-[var(--color-secondary-muted)]">
                          {report.versions} {tt("patients.versions")}
                        </span>
                        <span className="rounded-full bg-primary-light px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary dark:bg-primary/10">
                          {report.status}
                        </span>
                        <a href={`/dashboard/history/${report.id}`} className="btn btn-secondary">
                          {tt("patients.openReport")}
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
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary dark:bg-primary/10">
                <NotebookPen className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-extrabold text-secondary-text">{tt("patients.clinicalNotes")}</h2>
            </div>
            <form onSubmit={handleAddNote} className="mt-5 space-y-3">
              <input value={noteForm.title} onChange={(event) => setNoteForm((prev) => ({ ...prev, title: event.target.value }))} placeholder={tt("patients.noteTitle")} className="inp w-full" required />
              <textarea value={noteForm.content} onChange={(event) => setNoteForm((prev) => ({ ...prev, content: event.target.value }))} placeholder={tt("patients.noteContent")} className="inp min-h-[120px] w-full resize-y" required />
              <input type="date" value={noteForm.sessionDate} onChange={(event) => setNoteForm((prev) => ({ ...prev, sessionDate: event.target.value }))} className="inp w-full" />
              <button type="submit" disabled={isPending} className="btn btn-primary">
                <NotebookPen className="h-4 w-4" /> {tt("patients.saveNote")}
              </button>
            </form>
            <div className="mt-5 space-y-3">
              {notes.length === 0 ? (
                <div className="rounded-2xl border border-secondary-border bg-slate-50 p-5 text-sm text-slate-500 dark:bg-[var(--color-secondary-card)] dark:text-[var(--color-secondary-muted)]">
                  {tt("patients.noNotes")}
                </div>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="rounded-2xl border border-secondary-border bg-slate-50 p-4 dark:bg-[var(--color-secondary-card)] dark:border-[var(--color-secondary-border)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-secondary-text">{note.title}</p>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {note.sessionDate ? new Date(note.sessionDate).toLocaleDateString(isEn ? "en-US" : "es-ES") : new Date(note.createdAt).toLocaleDateString(isEn ? "en-US" : "es-ES")}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-[var(--color-secondary-muted)]">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary dark:bg-primary/10">
                <FileUp className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-extrabold text-secondary-text">{tt("patients.linkedDocs")}</h2>
            </div>
            <form onSubmit={handleAddDocument} className="mt-5 space-y-3">
              <input value={documentForm.title} onChange={(event) => setDocumentForm((prev) => ({ ...prev, title: event.target.value }))} placeholder={tt("patients.docTitle")} className="inp w-full" required />
              <select value={documentForm.documentType} onChange={(event) => setDocumentForm((prev) => ({ ...prev, documentType: event.target.value }))} className="inp w-full">
                <option value={tt("patients.consentTypes.protection")}>{tt("patients.consentTypes.protection")}</option>
                <option value="Informe externo">Informe externo</option>
                <option value="Justificante">Justificante</option>
                <option value="Otro">Otro</option>
              </select>
              <input value={documentForm.url} onChange={(event) => setDocumentForm((prev) => ({ ...prev, url: event.target.value }))} placeholder={tt("patients.docUrl")} className="inp w-full" />
              <input type="file" className="inp w-full" onChange={(event) => setDocumentFile(event.target.files?.[0] || null)} />
              <textarea value={documentForm.notes} onChange={(event) => setDocumentForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder={tt("patients.docNotes")} className="inp min-h-[90px] w-full resize-y" />
              <button type="submit" disabled={isPending} className="btn btn-primary">
                <FolderHeart className="h-4 w-4" /> {tt("patients.registerDoc")}
              </button>
            </form>
            <div className="mt-5 space-y-3">
              {documents.length === 0 ? (
                <div className="rounded-2xl border border-secondary-border bg-slate-50 p-5 text-sm text-slate-500 dark:bg-[var(--color-secondary-card)] dark:text-[var(--color-secondary-muted)]">
                  {tt("patients.noDocs")}
                </div>
              ) : (
                documents.map((document) => (
                  <div key={document.id} className="rounded-2xl border border-secondary-border bg-slate-50 p-4 dark:bg-[var(--color-secondary-card)] dark:border-[var(--color-secondary-border)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-secondary-text">{document.title}</p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:bg-[var(--color-secondary-card)] dark:text-[var(--color-secondary-muted)]">
                        {document.documentType}
                      </span>
                    </div>
                    {document.url && (
                      <a href={document.url} target="_blank" rel="noreferrer" className="mt-2 block text-sm font-semibold text-primary hover:underline">
                        {tt("patients.openDoc")}
                      </a>
                    )}
                    {document.fileName && <p className="mt-2 text-xs text-slate-400">{document.fileName}{document.sizeBytes ? ` · ${(document.sizeBytes / 1024).toFixed(1)} KB` : ""}</p>}
                    {document.notes && <p className="mt-2 text-sm text-slate-600 dark:text-[var(--color-secondary-muted)]">{document.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary dark:bg-primary/10">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-extrabold text-secondary-text">{tt("patients.consents")}</h2>
            </div>
            <form onSubmit={handleAddConsent} className="mt-5 space-y-3">
              <input value={consentForm.consentType} onChange={(event) => setConsentForm((prev) => ({ ...prev, consentType: event.target.value }))} placeholder={tt("patients.consentType")} className="inp w-full" required />
              <select value={consentForm.status} onChange={(event) => setConsentForm((prev) => ({ ...prev, status: event.target.value }))} className="inp w-full">
                <option value="firmado">{tt("patients.consentSigned")}</option>
                <option value="pendiente">{tt("patients.consentPending")}</option>
                <option value="revocado">{tt("patients.consentRevoked")}</option>
              </select>
              <input type="date" value={consentForm.signedAt} onChange={(event) => setConsentForm((prev) => ({ ...prev, signedAt: event.target.value }))} className="inp w-full" />
              <textarea value={consentForm.notes} onChange={(event) => setConsentForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder={tt("patients.consentNotes")} className="inp min-h-[90px] w-full resize-y" />
              <button type="submit" disabled={isPending} className="btn btn-primary">
                <ShieldCheck className="h-4 w-4" /> {tt("patients.saveConsent")}
              </button>
            </form>
            <div className="mt-5 space-y-3">
              {consents.length === 0 ? (
                <div className="rounded-2xl border border-secondary-border bg-slate-50 p-5 text-sm text-slate-500 dark:bg-[var(--color-secondary-card)] dark:text-[var(--color-secondary-muted)]">
                  {tt("patients.noConsents")}
                </div>
              ) : (
                consents.map((consent) => (
                  <div key={consent.id} className="rounded-2xl border border-secondary-border bg-slate-50 p-4 dark:bg-[var(--color-secondary-card)] dark:border-[var(--color-secondary-border)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-secondary-text">{consent.consentType}</p>
                      {statusBadge(consent.status)}
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-[var(--color-secondary-muted)]">
                      {consent.signedAt ? `${tt("patients.consentSigned")}: ${new Date(consent.signedAt).toLocaleDateString(isEn ? "en-US" : "es-ES")}` : tt("patients.noAppointments")}
                    </p>
                    {consent.notes && <p className="mt-2 text-sm text-slate-600 dark:text-[var(--color-secondary-muted)]">{consent.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary dark:bg-primary/10">
                <CalendarDays className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-extrabold text-secondary-text">{tt("patients.appointments")}</h2>
            </div>
            <div className="mt-5 space-y-3">
              {appointments.length === 0 ? (
                <div className="rounded-2xl border border-secondary-border bg-slate-50 p-5 text-sm text-slate-500 dark:bg-[var(--color-secondary-card)] dark:text-[var(--color-secondary-muted)]">
                  {tt("patients.noAppointments")}
                </div>
              ) : (
                appointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-2xl border border-secondary-border bg-slate-50 p-4 dark:bg-[var(--color-secondary-card)] dark:border-[var(--color-secondary-border)]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-secondary-text">{appointment.title}</p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:bg-[var(--color-secondary-card)] dark:text-[var(--color-secondary-muted)]">
                        {appointment.type}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-[var(--color-secondary-muted)]">{new Date(appointment.date).toLocaleString(isEn ? "en-US" : "es-ES")}</p>
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
