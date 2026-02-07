"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SignOutPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6 text-center space-y-4">
          <h1 className="text-xl font-heading font-bold">Abmelden</h1>
          <p className="text-muted-foreground">
            Moechtest du dich wirklich abmelden?
          </p>
          <Button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full"
            size="lg"
          >
            Abmelden
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
