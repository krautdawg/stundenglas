"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Mail, Loader2, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError("Es gab einen Fehler. Bitte versuche es erneut.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 text-white text-3xl mb-4">
            🌳
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-foreground">
            Foerderkreis
          </h1>
          <p className="text-muted-foreground mt-1">
            Schule des Lebens &middot; Kloster Lehnin
          </p>
        </div>

        <Card>
          <CardHeader className="text-center pb-2">
            <h2 className="text-lg font-heading font-bold">
              {sent ? "E-Mail gesendet!" : "Willkommen!"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {sent
                ? "Pruefe dein Postfach und klicke auf den Link."
                : "Melde dich mit deiner E-Mail-Adresse an."}
            </p>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-sage-500 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Wir haben dir einen Login-Link an{" "}
                  <strong className="text-foreground">{email}</strong> gesendet.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                >
                  Andere E-Mail verwenden
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="deine@email.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-coral-500">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !email}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Wird gesendet...
                    </>
                  ) : (
                    "Magic Link senden"
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Kein Passwort noetig! Du erhaeltst einen sicheren Login-Link
                  per E-Mail.
                </p>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Legal links */}
        <div className="flex justify-center gap-4 mt-6 text-xs text-muted-foreground">
          <a href="/impressum" className="hover:underline">
            Impressum
          </a>
          <a href="/datenschutz" className="hover:underline">
            Datenschutz
          </a>
        </div>
      </div>
    </div>
  );
}
