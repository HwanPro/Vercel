import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/infrastructure/prisma/prisma";
import bcrypt from "bcrypt";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
  
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) {
          throw new Error("Faltan credenciales");
        }

        // Buscar al usuario
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: credentials.username },
              { phoneNumber: credentials.username },
            ],
          },
        });

        if (!user) {
          throw new Error("Usuario no encontrado");
        }

        // Comparar contraseña
        const isMatch = await bcrypt.compare(
          credentials.password,
          user.password!
        );
        if (!isMatch) {
          throw new Error("Contraseña incorrecta");
        }

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
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
