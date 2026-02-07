import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

const errorMessages: Record<string, { title: string; message: string }> = {
  Verification: {
    title: "Link ungültig",
    message: "Der Login-Link ist abgelaufen oder wurde bereits verwendet. Bitte fordere einen neuen Link an.",
  },
  AccessDenied: {
    title: "Zugriff verweigert",
    message: "Du hast keine Berechtigung, auf diese Seite zuzugreifen.",
  },
  Configuration: {
    title: "Konfigurationsfehler",
    message: "Es gibt ein Problem mit der Server-Konfiguration. Bitte kontaktiere den Administrator.",
  },
  Default: {
    title: "Anmeldung fehlgeschlagen",
    message: "Bei der Anmeldung ist ein Fehler aufgetreten. Bitte versuche es erneut.",
  },
};

export default function ErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const errorType = searchParams.error || "Default";
  const errorInfo = errorMessages[errorType] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 text-white text-3xl mb-4">
            🌳
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-foreground">
            Foerderkreis
          </h1>
        </div>

        <Card>
          <CardHeader className="text-center pb-2">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <h2 className="text-lg font-heading font-bold text-red-600">
              {errorInfo.title}
            </h2>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              {errorInfo.message}
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
            >
              Erneut anmelden
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
