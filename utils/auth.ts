// src/utils/auth.ts

export function generateVerificationToken() {
  // Tu implementación, por ejemplo:
  const crypto = require("crypto");
  const token = crypto.randomBytes(32).toString("hex");
  return token;
}
export const getEmailFromToken = (token: string): string => {
  // Lógica para decodificar el token y obtener el email
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.email || '';
};
