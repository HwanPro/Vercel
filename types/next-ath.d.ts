// src/types/next-auth.d.ts
import type { DefaultSession, DefaultUser } from "next-auth";
import type { JWT as JWTType } from "next-auth/jwt"; // Importamos JWTType con alias

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    role?: string;
    phoneNumber?: string;
    // Otros campos personalizados...
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      role?: string;
      phoneNumber?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  // Extendemos la interfaz JWT de NextAuth con nuestros campos
  interface JWT extends JWTType {
    id: string;
    role?: string;
    phoneNumber?: string;
  }
}
