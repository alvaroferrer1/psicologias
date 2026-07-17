import { getPatientCategoryLabel, type PatientCategory } from "@/lib/report-templates";

export type PatientStatus = "activo" | "pausa" | "pasivo";

export function getPatientStatusLabel(status?: string | null) {
  switch (status) {
    case "pausa":
      return "Pausa";
    case "pasivo":
      return "Pasivo";
    case "activo":
    default:
      return "Activo";
  }
}

export function getPatientStatusClasses(status?: string | null) {
  switch (status) {
    case "pausa":
      return "border-amber-200 bg-amber-100 text-amber-800";
    case "pasivo":
      return "border-slate-200 bg-slate-100 text-slate-600";
    case "activo":
    default:
      return "border-blue-200 bg-blue-100 text-blue-800";
  }
}

export function getPatientTypeLabel(type?: string | null) {
  return getPatientCategoryLabel(type as PatientCategory | undefined);
}

export function calculateAge(date?: string | Date | null) {
  if (!date) return null;
  const birth = new Date(date);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
}

export function getBirthdayAlert(date?: string | Date | null, patientType?: string | null) {
  if (!date || !patientType || !["infantil", "adolescente"].includes(patientType)) {
    return null;
  }

  const birth = new Date(date);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }

  const diffMs = nextBirthday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Cumpleaños hoy";
  }
  if (diffDays > 0 && diffDays <= 14) {
    return `Cumpleaños en ${diffDays} día${diffDays === 1 ? "" : "s"}`;
  }

  return null;
}
