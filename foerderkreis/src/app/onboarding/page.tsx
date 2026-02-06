"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowRight,
  Users,
  UserPlus,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  createFamily,
  joinFamily,
  updateOnboardingProfile,
  joinKreise,
  completeOnboarding,
  getKreise,
} from "@/actions/onboarding";

const STEPS = ["Familie", "Profil", "Kreise"];

const COMMON_SKILLS = [
  "Garten",
  "Kochen",
  "Handwerk",
  "Organisation",
  "IT",
  "Erste Hilfe",
  "Finanzen",
  "Kreativ",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Family step
  const [familyMode, setFamilyMode] = useState<"create" | "join" | null>(null);
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  // Profile step
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  // Kreise step
  const [kreise, setKreise] = useState<
    { id: string; name: string; icon: string | null }[]
  >([]);
  const [selectedKreise, setSelectedKreise] = useState<string[]>([]);
  const [kreiseLoaded, setKreiseLoaded] = useState(false);

  async function handleFamilyStep() {
    setLoading(true);

    if (familyMode === "create") {
      if (!familyName.trim()) {
        toast.error("Bitte gib einen Familiennamen ein");
        setLoading(false);
        return;
      }

      const result = await createFamily(familyName);
      if (result.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }
    } else if (familyMode === "join") {
      const result = await joinFamily(inviteCode);
      if (result.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    setStep(1);
  }

  async function handleProfileStep() {
    setLoading(true);

    const result = await updateOnboardingProfile({
      firstName,
      lastName,
      skillTags: skills,
    });

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    // Load kreise for next step
    if (!kreiseLoaded) {
      const data = await getKreise();
      if (data) setKreise(data);
      setKreiseLoaded(true);
    }

    setLoading(false);
    setStep(2);
  }

  async function handleKreiseStep() {
    setLoading(true);

    // Join selected Kreise
    if (selectedKreise.length > 0) {
      const result = await joinKreise(selectedKreise);
      if (result.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }
    }

    // Mark onboarding as complete
    const completeResult = await completeOnboarding();
    if (completeResult.error) {
      toast.error(completeResult.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    toast.success("Willkommen beim Foerderkreis!");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-sm mx-auto">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i <= step
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-12 h-0.5 ${
                    i < step ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Family */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-3">👨‍👩‍👧‍👦</div>
              <h1 className="text-2xl font-heading font-extrabold">
                Deine Familie
              </h1>
              <p className="text-muted-foreground mt-1">
                Erstelle eine neue Familie oder tritt einer bestehenden bei.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card
                className={`cursor-pointer transition-all ${
                  familyMode === "create"
                    ? "border-primary ring-2 ring-primary/20"
                    : ""
                }`}
                onClick={() => setFamilyMode("create")}
              >
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="font-medium text-sm">Neue Familie</div>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer transition-all ${
                  familyMode === "join"
                    ? "border-primary ring-2 ring-primary/20"
                    : ""
                }`}
                onClick={() => setFamilyMode("join")}
              >
                <CardContent className="p-4 text-center">
                  <UserPlus className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="font-medium text-sm">Beitreten</div>
                </CardContent>
              </Card>
            </div>

            {familyMode === "create" && (
              <div>
                <Label htmlFor="familyName">Familienname</Label>
                <Input
                  id="familyName"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="z.B. Familie Mueller"
                  className="mt-1.5"
                />
              </div>
            )}

            {familyMode === "join" && (
              <div>
                <Label htmlFor="inviteCode">Einladungscode</Label>
                <Input
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Code von Partner/in eingeben"
                  className="mt-1.5"
                />
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleFamilyStep}
              disabled={loading || !familyMode}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Weiter <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Profile */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-3">👤</div>
              <h1 className="text-2xl font-heading font-extrabold">
                Dein Profil
              </h1>
              <p className="text-muted-foreground mt-1">
                Wie moechtest du in der Gemeinschaft erscheinen?
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName">Vorname</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nachname</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Faehigkeiten (optional)</Label>
                <div className="flex gap-2 flex-wrap mt-2">
                  {COMMON_SKILLS.map((skill) => (
                    <Badge
                      key={skill}
                      variant={skills.includes(skill) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() =>
                        setSkills((prev) =>
                          prev.includes(skill)
                            ? prev.filter((s) => s !== skill)
                            : [...prev, skill]
                        )
                      }
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleProfileStep}
              disabled={loading || !firstName || !lastName}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Weiter <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 3: Kreise */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🔵</div>
              <h1 className="text-2xl font-heading font-extrabold">
                Kreise beitreten
              </h1>
              <p className="text-muted-foreground mt-1">
                Waehle Kreise, die dich interessieren.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {kreise.map((k) => (
                <Card
                  key={k.id}
                  className={`cursor-pointer transition-all ${
                    selectedKreise.includes(k.id)
                      ? "border-primary ring-2 ring-primary/20"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedKreise((prev) =>
                      prev.includes(k.id)
                        ? prev.filter((id) => id !== k.id)
                        : [...prev, k.id]
                    )
                  }
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-1">{k.icon || "🔵"}</div>
                    <div className="font-medium text-sm">{k.name}</div>
                    {selectedKreise.includes(k.id) && (
                      <Check className="h-4 w-4 text-primary mx-auto mt-1" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleKreiseStep}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Los geht&apos;s! <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={handleKreiseStep}
              disabled={loading}
            >
              Ueberspringen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
