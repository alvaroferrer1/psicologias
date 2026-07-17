export type AppRole = "ADMIN" | "PSYCHOLOGIST" | "READONLY";

export function isAdminRole(role?: string | null) {
  return role === "ADMIN";
}

export function canEditRole(role?: string | null) {
  return role === "ADMIN" || role === "PSYCHOLOGIST" || role === "USER";
}

export function getRoleLabel(role?: string | null) {
  switch (role) {
    case "ADMIN":
      return "Administrador(a)";
    case "READONLY":
      return "Lectura";
    case "PSYCHOLOGIST":
    case "USER":
    default:
      return "Psicóloga";
  }
}
