// types/next-connect.d.ts
import { NextApiRequest } from 'next';
import multer from 'multer';

import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string | null;
    emailVerified: boolean; // Personaliza según tu base de datos
  }

  interface Session {
    user: {
      id: string;
      role: string;
      emailVerified: boolean;
    } & DefaultSession["user"];
  }

  interface JWT {
    id: string;
    role: string;
    emailVerified: boolean;
  }
}

declare module 'next' {
  interface NextApiRequest {
    file?: multer.File;
    files?: multer.File[];
  }
}
