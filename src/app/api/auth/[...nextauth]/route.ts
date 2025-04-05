// src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/infrastructure/prisma/prisma";
import bcrypt from "bcrypt";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 Iniciando autorización de credenciales...");

        if (!credentials?.username || !credentials?.password) {
          throw new Error("Credenciales inválidas");
        }

        // Asegúrate de seleccionar las columnas que te interesen (firstName, lastName, etc.).
        // En user devuelves EXACTAMENTE lo que quieras tener más adelante en session.
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: credentials.username },
              { phoneNumber: credentials.username },
            ],
          },
          select: {
            id: true,
            username: true,
            phoneNumber: true,
            role: true,
            password: true,
            firstName: true, // <-- añade
            lastName: true, // <-- añade
            // si tienes un campo image en la db, etc. agrégalo
          },
        });

        if (!user) {
          console.error("❌ Usuario no encontrado:", credentials.username);
          throw new Error("Usuario no encontrado");
        }

        console.log("✅ Usuario encontrado:", user);

        // Comparar contraseña
        const isMatch = await bcrypt.compare(
          credentials.password,
          user.password || ""
        );
        if (!isMatch) {
          console.error("❌ Contraseña incorrecta para:", credentials.username);
          throw new Error("Contraseña incorrecta");
        }

        console.log("✅ Credenciales verificadas:", user.username);

        // Regresamos un objeto "limpio" sin user.password
        return {
          id: user.id,
          username: user.username,
          phoneNumber: user.phoneNumber,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          // image, si la tuvieras
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  callbacks: {
    async jwt({ token, user }) {
      // Si es la primera vez (login inicial), "user" no es undefined
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phoneNumber = user.phoneNumber;
        // añadimos los nuevos campos
        token.firstName = (user as { firstName?: string }).firstName || "";
        token.lastName = (user as { lastName?: string }).lastName || "";
        // token.image = user.image; si tuvieras
      }
      return token;
    },
    async session({ session, token }) {
      // Copiamos del token a session.user
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.phoneNumber = token.phoneNumber as string;
        session.user = {
          ...session.user,
          ...((token as { firstName?: string }).firstName && {
            firstName: (token as { firstName?: string }).firstName as string,
          }),
        };
        session.user = {
          ...session.user,
          ...((token as { lastName?: string }).lastName && {
            lastName: (token as { lastName?: string }).lastName as string,
          }),
        };
        // session.user.image = token.image as string;
      }
      return session;
    },
    async signIn({ user }) {
      console.log("🔑 Proceso de inicio de sesión para usuario:", user);
      if (user.role === "client") {
        const existingProfile = await prisma.clientProfile.findUnique({
          where: { user_id: user.id },
        });
        if (!existingProfile) {
          console.log("👤 Creando perfil de cliente para usuario:", user.id);
          await prisma.clientProfile.create({
            data: {
              profile_first_name:
                (user as { firstName?: string; name?: string }).firstName ||
                (user as { name?: string }).name ||
                "Sin nombre",
              profile_last_name:
                (user as { lastName?: string }).lastName || "Sin apellido",
              profile_plan: "Básico",
              profile_start_date: new Date(),
              profile_end_date: new Date(),
              profile_phone: user.phoneNumber || "",
              user_id: user.id,
            },
          });
          console.log("✅ Perfil de cliente creado.");
        } else {
          console.log("👤 Perfil ya existente para:", user.id);
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "supersecret",
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
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
