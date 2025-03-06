import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/libs/prisma";
import bcrypt from "bcrypt";
import { NextAuthOptions } from "next-auth";

const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Proveedor Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    // Proveedor de credenciales personalizadas
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { id: "Email", label: "Email", type: "text" },
        password: { id: "Password", label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        console.log("🔐 Iniciando autorización de credenciales...");
        if (!credentials?.email || !credentials?.password) {
          console.error("❌ Credenciales no proporcionadas");
          throw new Error("Credenciales inválidas");
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) {
          console.error("❌ Usuario no encontrado:", credentials.email);
          throw new Error("Usuario no encontrado");
        }
        console.log("✅ Usuario encontrado:", user);
        const isMatch = await bcrypt.compare(
          credentials.password,
          user.password!
        );
        if (!isMatch) {
          console.error("❌ Contraseña incorrecta para:", credentials.email);
          throw new Error("Contraseña incorrecta");
        }
        if (!user.emailVerified) {
          console.error("❌ Correo no verificado:", credentials.email);
          throw new Error(
            "Debes verificar tu correo electrónico antes de iniciar sesión"
          );
        }
        console.log(
          "✅ Credenciales verificadas para usuario:",
          credentials.email
        );
        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.emailVerified = user.emailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.emailVerified = token.emailVerified;
      }
      return session;
    },
    async signIn({ user }) {
      // ...
      return true;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === "production",
  /**
   * Ajuste de cookies: si tu dominio es EXACTAMENTE wolf-gym.com (sin www),
   * puedes usar domain: ".wolf-gym.com" para abarcar subdominios también.
   */
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain:
          process.env.NODE_ENV === "production" ? ".wolf-gym.com" : undefined,
      },
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
