import { getServerSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER || "smtp://localhost",
      from: process.env.EMAIL_FROM || "noreply@sdl-app.de",
      sendVerificationRequest: async ({ identifier: email, url }) => {
        const BREVO_API_KEY = process.env.BREVO_API_KEY;
        const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@sdl-app.de";

        if (!BREVO_API_KEY) {
          throw new Error("BREVO_API_KEY not set");
        }

        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "api-key": BREVO_API_KEY,
          },
          body: JSON.stringify({
            sender: { name: "Schule des Lebens", email: FROM_EMAIL },
            to: [{ email }],
            subject: "Dein Login-Link",
            htmlContent: \`<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h2>Login bei Schule des Lebens</h2>
              <p>Klicke hier zum Einloggen:</p>
              <p style="margin:30px 0">
                <a href="\${url}" style="background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px">Einloggen</a>
              </p>
              <p style="color:#666;font-size:14px">Link: <a href="\${url}">\${url}</a></p>
            </div>\`,
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          console.error("Brevo error:", err);
          throw new Error("Failed to send email via Brevo");
        }
      },
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify", 
    error: "/login/error",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const fullUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, familyId: true, firstName: true, lastName: true, onboardingCompleted: true },
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
