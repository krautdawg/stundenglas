"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, X, Shield } from "lucide-react";
import { updateProfile, updatePrivacyMode } from "@/actions/profile";
import { toast } from "sonner";

const COMMON_SKILLS = [
  "Garten",
  "Kochen",
  "Handwerk",
  "Organisation",
  "IT",
  "Erste Hilfe",
  "Finanzen",
  "Kreativ",
  "Putzen",
  "Transport",
];

interface ProfileFormProps {
  initialData: {
    first_name: string;
    last_name: string;
    bio: string;
    skill_tags: string[];
    privacy_mode: boolean;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState(initialData.first_name);
  const [lastName, setLastName] = useState(initialData.last_name);
  const [bio, setBio] = useState(initialData.bio);
  const [skills, setSkills] = useState<string[]>(initialData.skill_tags);
  const [privacyMode, setPrivacyMode] = useState(initialData.privacy_mode);

  function toggleSkill(skill: string) {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.set("first_name", firstName);
    formData.set("last_name", lastName);
    formData.set("bio", bio);
    formData.set("skill_tags", JSON.stringify(skills));

    const result = await updateProfile(formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Profil aktualisiert!");
      router.refresh();
    }
    setLoading(false);
  }

  async function handlePrivacyToggle() {
    const newValue = !privacyMode;
    setPrivacyMode(newValue);
    const result = await updatePrivacyMode(newValue);
    if (result.error) {
      toast.error(result.error);
      setPrivacyMode(!newValue);
    } else {
      toast.success(
        newValue
          ? "Datenschutz-Modus aktiviert"
          : "Datenschutz-Modus deaktiviert"
      );
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="first_name">Vorname</Label>
            <Input
              id="first_name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="last_name">Nachname</Label>
            <Input
              id="last_name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="bio">Ueber mich</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Erzaehl etwas ueber dich..."
            className="mt-1"
            rows={3}
          />
        </div>

        <div>
          <Label>Faehigkeiten</Label>
          <div className="flex gap-2 flex-wrap mt-2">
            {COMMON_SKILLS.map((skill) => (
              <Badge
                key={skill}
                variant={skills.includes(skill) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleSkill(skill)}
              >
                {skills.includes(skill) && <X className="h-3 w-3 mr-1" />}
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Profil speichern
        </Button>
      </form>

      {/* Privacy Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="font-medium text-sm">Datenschutz-Modus</div>
            <div className="text-xs text-muted-foreground">
              Deine Familie wird in der Rangliste als &quot;Anonym&quot;
              angezeigt.
            </div>
          </div>
        </div>
        <button
          onClick={handlePrivacyToggle}
          className={`relative w-12 h-7 rounded-full transition-colors ${
            privacyMode ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
              privacyMode ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
