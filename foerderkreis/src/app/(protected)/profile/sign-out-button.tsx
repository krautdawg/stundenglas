"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOut } from "@/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline" className="w-full text-destructive">
        <LogOut className="h-4 w-4" />
        Abmelden
      </Button>
    </form>
  );
}
