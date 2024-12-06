// src/libs/authOptions.ts

import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/libs/prisma';
import bcrypt from 'bcrypt';

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error('Credenciales inválidas');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) throw new Error('Usuario no encontrado');

        const isMatch = await bcrypt.compare(credentials.password, user.password!);

        if (!isMatch) throw new Error('Contraseña incorrecta');

        if (!user.emailVerified) {
          throw new Error('Debes verificar tu correo electrónico antes de iniciar sesión');
        }

        return user;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.emailVerified = !!user.emailVerified; // Convertir a booleano
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Crear ClientProfile para usuarios de Google o credenciales
      const existingProfile = await prisma.clientProfile.findUnique({
        where: { user_id: user.id },
      });

      if (!existingProfile) {
        // Crear el ClientProfile
        await prisma.clientProfile.create({
          data: {
            profile_first_name: user.name?.split(' ')[0] || '',
            profile_last_name: user.name?.split(' ')[1] || '',
            profile_plan: 'Básico',
            profile_start_date: new Date(),
            profile_end_date: new Date(), // Ajusta según tu lógica
            profile_phone: '',
            profile_emergency_phone: '',
            user_id: user.id,
          },
        });
      }

      return true;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === 'production',
};
