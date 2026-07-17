export function isValidEmailClient(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidDniClient(value: string): boolean {
  const normalized = value.trim().toUpperCase();
  if (!/^[0-9XYZ][0-9]{7}[A-Z]$/.test(normalized)) return false;
  const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
  const prefix = normalized[0];
  const numericPrefix = prefix === "X" ? "0" : prefix === "Y" ? "1" : prefix === "Z" ? "2" : prefix;
  const number = Number(`${numericPrefix}${normalized.slice(1, 8)}`);
  return letters[number % 23] === normalized[8];
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
