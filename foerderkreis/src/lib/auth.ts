import { getServerSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || "noreply@sdl-app.de",
    }),
  ],
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
    error: "/login/error",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // Fetch extended user data
        const fullUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            role: true,
            familyId: true,
            firstName: true,
            lastName: true,
            onboardingCompleted: true,
          },
        });
        if (fullUser) {
          session.user.role = fullUser.role;
          session.user.familyId = fullUser.familyId;
          session.user.firstName = fullUser.firstName;
          session.user.lastName = fullUser.lastName;
          session.user.onboardingCompleted = fullUser.onboardingCompleted;
        }
      }
      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}

// Type augmentation for session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role?: string;
      familyId?: string | null;
      firstName?: string;
      lastName?: string;
      onboardingCompleted?: boolean;
    };
  }
}
