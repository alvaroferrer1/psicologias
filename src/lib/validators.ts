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
  return /^[0-9XYZ][0-9]{7}[A-Z]$/.test(value);
}

export function validatePasswordStrength(password: string) {
  if (password.length < 8) {
    return "La contrasena debe tener al menos 8 caracteres.";
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
  return null;
}
