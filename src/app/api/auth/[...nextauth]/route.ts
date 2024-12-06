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
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciales inválidas");
        }
      
        // Busca al usuario en la base de datos
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
      
        if (!user) {
          throw new Error("Usuario no encontrado");
        }
      
        // Verifica la contraseña
        const isMatch = await bcrypt.compare(credentials.password, user.password!);
      
        if (!isMatch) {
          throw new Error("Contraseña incorrecta");
        }
      
        // Verifica si el correo está confirmado
        if (!user.emailVerified) {
          throw new Error("Debes verificar tu correo electrónico antes de iniciar sesión");
        }
      
        // Retorna el usuario con las propiedades esperadas
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          emailVerified: user.emailVerified,
          isVerified: user.isVerified, // Asegúrate de usar el nombre correcto según el modelo
        };
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.emailVerified = user.emailVerified as boolean; // Ahora se maneja correctamente
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
    async signIn({ user }) {
      const existingProfile = await prisma.clientProfile.findUnique({
        where: { user_id: user.id },
      });

      if (!existingProfile) {
        await prisma.clientProfile.create({
          data: {
            profile_first_name: user.name?.split(" ")[0] || "",
            profile_last_name: user.name?.split(" ")[1] || "",
            profile_plan: "Básico",
            profile_start_date: new Date(),
            profile_end_date: new Date(),
            profile_phone: "",
            profile_emergency_phone: "",
            user_id: user.id,
          },
        });
      }

      return true;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === "production",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
