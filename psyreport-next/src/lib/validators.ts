export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeDni(value: string) {
  return value.trim().toUpperCase();
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidSpanishDni(value: string) {
  if (!value) return true;
  const normalized = normalizeDni(value);
  if (!/^[0-9XYZ][0-9]{7}[A-Z]$/.test(normalized)) {
    return false;
  }

  const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
  const prefix = normalized[0];
  const numericPrefix = prefix === "X" ? "0" : prefix === "Y" ? "1" : prefix === "Z" ? "2" : prefix;
  const number = Number(`${numericPrefix}${normalized.slice(1, 8)}`);

  return letters[number % 23] === normalized[8];
}

export function validatePasswordStrength(password: string) {
  if (password.length < 10) {
    return "La contrasena debe tener al menos 10 caracteres.";
  }
  if (!/[A-Z]/.test(password)) {
    return "La contrasena debe incluir al menos una mayuscula.";
  }
  if (!/[a-z]/.test(password)) {
    return "La contrasena debe incluir al menos una minuscula.";
  }
  if (!/[0-9]/.test(password)) {
    return "La contrasena debe incluir al menos un numero.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "La contrasena debe incluir al menos un simbolo.";
  }
  return null;
}

export function isValidSpanishPhone(value: string) {
  if (!value) return true;
  const normalized = value.replace(/[\s+-]/g, "");
  return /^(\+34)?[6-9][0-9]{8}$/.test(normalized);
}

export type PasswordCheck = { label: string; ok: boolean };

export function passwordChecks(password: string): { score: number; valid: boolean; checks: PasswordCheck[] } {
  const checks: PasswordCheck[] = [
    { label: "Al menos 10 caracteres", ok: password.length >= 10 },
    { label: "Una mayuscula", ok: /[A-Z]/.test(password) },
    { label: "Una minuscula", ok: /[a-z]/.test(password) },
    { label: "Un numero", ok: /\d/.test(password) },
    { label: "Un simbolo", ok: /[^A-Za-z0-9]/.test(password) },
  ];

  const passed = checks.filter((c) => c.ok).length;
  let score = 0;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 14) score++;

  return { score: Math.max(1, Math.min(4, score)), valid: passed === checks.length, checks };
}
