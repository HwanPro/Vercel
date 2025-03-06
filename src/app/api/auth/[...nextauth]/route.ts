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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciales inválidas");
        }

        // 1) Buscar usuario en la base de datos
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) {
          throw new Error("Usuario no encontrado");
        }

        // 2) Verificar contraseña
        const isMatch = await bcrypt.compare(
          credentials.password,
          user.password!
        );
        if (!isMatch) {
          throw new Error("Contraseña incorrecta");
        }

        // 3) Verificar si está verificado
        if (!user.emailVerified) {
          throw new Error("Debes verificar tu correo antes de iniciar sesión");
        }

        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  callbacks: {
    // Se llama cada vez que se crea o actualiza el JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.emailVerified = user.emailVerified;
      }
      return token;
    },
    // Se llama cada vez que se crea o actualiza la sesión (cliente)
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
    // Para crear un perfil de client si no existe
    async signIn({ user }) {
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
              user_id: user.id,
            },
          });
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "supersecret",
  // Para que use cookies seguras en producción (HTTPS)
  useSecureCookies: process.env.NODE_ENV === "production",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
