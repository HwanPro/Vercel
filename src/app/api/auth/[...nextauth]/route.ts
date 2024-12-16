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
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciales inválidas");
        }

        // Buscar usuario
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("Usuario no encontrado");
        }

        // Comparar contraseña
        const isMatch = await bcrypt.compare(credentials.password, user.password!);
        if (!isMatch) throw new Error("Contraseña incorrecta");

        // Verificar si el email está confirmado
        if (!user.emailVerified) {
          throw new Error("Debes verificar tu correo electrónico antes de iniciar sesión");
        }

        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt", // Utiliza JWT en lugar de sesiones de base de datos
  },
  callbacks: {
    async jwt({ token, user }) {
      // Agregar propiedades del usuario al token JWT
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.emailVerified = user.emailVerified as boolean;
      }
      return token;
    },
    async session({ session, token }) {
      // Añadir propiedades del token a la sesión
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
    async signIn({ user }) {
      // Crear un perfil de cliente solo si no existe y si el usuario es un cliente
      if (user.role === "client") {
        const existingProfile = await prisma.clientProfile.findUnique({
          where: { user_id: user.id },
        });

        if (!existingProfile) {
          await prisma.clientProfile.create({
            data: {
              profile_first_name: user.name?.split(" ")[0] || "Sin nombre",
              profile_last_name: user.name?.split(" ")[1] || "Sin apellido",
              profile_plan: "Básico",
              profile_start_date: new Date(),
              profile_end_date: new Date(),
              profile_phone: "",
              profile_emergency_phone: "",
              user_id: user.id,
            },
          });
        }
      }

      return true; // Permitir inicio de sesión
    },
  },
  pages: {
    signIn: "/auth/login", // Ruta personalizada de login
  },
  secret: process.env.NEXTAUTH_SECRET || "supersecret",
  useSecureCookies: process.env.NODE_ENV === "production",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
