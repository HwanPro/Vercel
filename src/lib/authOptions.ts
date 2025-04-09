import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/infrastructure/prisma/prisma";
import bcrypt from "bcrypt";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Provider de Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    // Provider de credenciales
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username o Teléfono", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 Iniciando autorización de credenciales...");
        if (!credentials?.username || !credentials.password) {
          throw new Error("Faltan credenciales");
        }

        // Buscar al usuario por username o por phoneNumber usando findFirst y condición OR
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
            firstName: true,
            lastName: true,
          },
        });
        if (!user) {
          console.error("❌ Usuario no encontrado:", credentials.username);
          throw new Error("Usuario no encontrado");
        }

        // Comparar contraseña usando bcrypt
        const isMatch = await bcrypt.compare(
          credentials.password,
          user.password!
        );
        if (!isMatch) {
          console.error("❌ Contraseña incorrecta para:", credentials.username);
          throw new Error("Contraseña incorrecta");
        }

        console.log(
          "✅ Credenciales verificadas para usuario:",
          credentials.username
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
      // En el login inicial user no es undefined
      if (user) {
        token.id = user.id;
        token.role = user.role;
        // Puedes añadir otros campos si lo deseas
        token.firstName = (user as { firstName?: string }).firstName || "";
        token.lastName = (user as { lastName?: string }).lastName || "";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user = {
          ...session.user,
          name: token.firstName as string,
        };
        session.user = {
          ...session.user,
          name: token.lastName as string,
        };
      }
      return session;
    },
    async signIn({ user }) {
      console.log("🔑 Proceso de inicio de sesión para usuario:", user);
      // Si el usuario es "client", crea su perfil si no existe
      if (user.role === "client") {
        const existingProfile = await prisma.clientProfile.findUnique({
          where: { user_id: user.id },
        });
        if (!existingProfile) {
          console.log("👤 Creando perfil de cliente para usuario:", user.id);
          await prisma.clientProfile.create({
            data: {
              profile_first_name:
                (user as { firstName?: string }).firstName ||
                user.name ||
                "Sin nombre",
              profile_last_name:
                (user as { lastName?: string }).lastName || "Sin apellido",
              profile_plan: "Básico",
              profile_start_date: new Date(),
              profile_end_date: new Date(), // Ajusta la fecha según tu lógica
              profile_phone: user.phoneNumber || "",
              user_id: user.id,
            },
          });
          console.log("✅ Perfil de cliente creado para:", user.id);
        } else {
          console.log("👤 Perfil de cliente ya existente para:", user.id);
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "supersecret",
  // Evita configurar la propiedad domain en cookies si estás en desarrollo
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure:
          process.env.NODE_ENV === "production" &&
          process.env.NEXTAUTH_SECURE_COOKIE === "true",
      },
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
