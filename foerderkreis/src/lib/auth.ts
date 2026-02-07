import { getServerSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { createTransport } from "nodemailer";
import { prisma } from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";

async function sendVerificationRequest({ identifier: email, url, provider }: {
  identifier: string;
  url: string;
  provider: { server: any; from: string };
}) {
  const transport = createTransport(provider.server);
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #FDFCFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FDFCFB; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4A8E50 0%, #5EAD62 100%); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">🌱 Schule des Lebens</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="color: #231F1B; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Hallo!</h2>
              <p style="color: #544D43; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                Klicke auf den Button, um dich einzuloggen. Der Link ist 24 Stunden gültig.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px 0;">
                    <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #4A8E50 0%, #5EAD62 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(74, 142, 80, 0.3);">
                      Jetzt einloggen
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #948B7F; margin: 0; font-size: 14px; line-height: 1.5;">
                Falls du diese E-Mail nicht angefordert hast, kannst du sie einfach ignorieren.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #EDEAE6; text-align: center;">
              <p style="color: #948B7F; margin: 0; font-size: 12px;">
                Schule des Lebens · Elternarbeitszeit-App
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Schule des Lebens - Login\n\nHallo!\n\nKlicke auf den folgenden Link, um dich einzuloggen:\n${url}\n\nDer Link ist 24 Stunden gültig.\n\nFalls du diese E-Mail nicht angefordert hast, kannst du sie einfach ignorieren.`;

  await transport.sendMail({
    to: email,
    from: provider.from,
    subject: "🌱 Dein Login-Link für Schule des Lebens",
    html,
    text,
  });
}

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
        secure: false,
        tls: { rejectUnauthorized: false },
      },
      from: process.env.EMAIL_FROM || "noreply@sdl-app.de",
      sendVerificationRequest,
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
