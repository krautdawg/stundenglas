import { getServerSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";

// Custom email sender using Brevo API
async function sendVerificationRequest({
  identifier: email,
  url,
}: {
  identifier: string;
  url: string;
  provider: { from: string };
}) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@sdl-app.de";
  const FROM_NAME = process.env.EMAIL_FROM_NAME || "Schule des Lebens";

  if (!BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email }],
      subject: "Dein Login-Link für Schule des Lebens",
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Willkommen bei Schule des Lebens</h2>
          <p>Klicke auf den Button unten, um dich einzuloggen:</p>
          <p style="margin: 30px 0;">
            <a href="${url}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Einloggen
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            Oder kopiere diesen Link in deinen Browser:<br>
            <a href="${url}">${url}</a>
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 40px;">
            Wenn du diese E-Mail nicht angefordert hast, kannst du sie ignorieren.
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Brevo API error:", error);
    throw new Error(`Failed to send email: ${JSON.stringify(error)}`);
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      // Server not used - we use custom sendVerificationRequest with Brevo API
      server: {},
      from: process.env.EMAIL_FROM || "noreply@sdl-app.de",
      sendVerificationRequest,
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
