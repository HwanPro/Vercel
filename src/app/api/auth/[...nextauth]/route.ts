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
        console.log("🔐 Iniciando autorización de credenciales...");
        if (!credentials?.email || !credentials?.password) {
          console.error("❌ Credenciales no proporcionadas");
          throw new Error("Credenciales inválidas");
        }

        // Buscar usuario
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          console.error("❌ Usuario no encontrado:", credentials.email);
          throw new Error("Usuario no encontrado");
        }

        console.log("✅ Usuario encontrado:", user);

        // Comparar contraseña
        const isMatch = await bcrypt.compare(
          credentials.password,
          user.password!
        );
        if (!isMatch) {
          console.error("❌ Contraseña incorrecta para:", credentials.email);
          throw new Error("Contraseña incorrecta");
        }

        // Verificar si el email está confirmado
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
    strategy: "jwt", // Utiliza JWT en lugar de sesiones de base de datos
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log("🔑 Callback JWT iniciado. Token actual:", token);
      console.log("🛡 Usuario recibido:", user);
      // Agregar propiedades del usuario al token JWT
      if (user) {
        console.log("🛡 Agregando datos del usuario al token:", user);
        token.id = user.id;
        token.role = user.role;
        token.emailVerified = user.emailVerified as boolean;
      }
      console.log("✅ Token generado:", token);
      return token;
    },
    async session({ session, token }) {
      console.log("🛠 Procesando sesión con token:", token);
      console.log("🛠 Sesión antes de asignar valores:", session);

      // Añadir propiedades del token a la sesión
      if (token && session.user) {
        console.log("🛡 Agregando datos del token a la sesión:", token);
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.emailVerified = token.emailVerified as boolean;
      }
      console.log("✅ Sesión generada:", session);
      return session;
    },
    async signIn({ user }) {
      console.log(
        "🔑 Iniciando proceso de inicio de sesión para usuario:",
        user
      );
      // Crear un perfil de cliente solo si no existe y si el usuario es un cliente
      if (user.role === "client") {
        const existingProfile = await prisma.clientProfile.findUnique({
          where: { user_id: user.id },
        });

        if (!existingProfile) {
          console.log("👤 Creando perfil de cliente para usuario:", user.id);
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
          console.log("✅ Perfil de cliente creado.");
        } else {
          console.log(
            "👤 Perfil de cliente ya existente para usuario:",
            user.id
          );
        }
      }
      console.log("✅ Inicio de sesión permitido para usuario:", user.id);
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
