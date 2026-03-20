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
