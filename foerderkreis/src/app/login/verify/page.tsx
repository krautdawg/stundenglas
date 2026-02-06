import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Mail } from "lucide-react";
import Link from "next/link";

export default function VerifyPage() {
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
            <Mail className="w-12 h-12 text-amber-500 mx-auto mb-2" />
            <h2 className="text-lg font-heading font-bold">
              Pruefe dein Postfach
            </h2>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Wir haben dir einen Login-Link per E-Mail geschickt.
              Klicke auf den Link, um dich anzumelden.
            </p>
            <p className="text-xs text-muted-foreground">
              Der Link ist 24 Stunden gueltig.
            </p>
            <Link
              href="/login"
              className="text-sm text-amber-600 hover:underline mt-4 inline-block"
            >
              Zurueck zur Anmeldung
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
