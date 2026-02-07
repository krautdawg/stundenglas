import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "./profile-form";
import { SignOutButton } from "./sign-out-button";
import { AvatarUpload } from "./avatar-upload";

export default async function ProfilePage() {
  const session = await auth();
  const userId = session!.user.id;

  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      bio: true,
      skillTags: true,
      privacyMode: true,
      avatarUrl: true,
      family: { select: { name: true, inviteCode: true } },
    },
  });

  // Get user's Kreise
  const memberships = await prisma.kreisMembership.findMany({
    where: { userId },
    include: {
      kreis: { select: { name: true, slug: true, icon: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-extrabold">Mein Profil</h1>

      {/* Avatar & Name */}
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <AvatarUpload
            currentAvatarUrl={profile?.avatarUrl || null}
            firstName={profile?.firstName || ""}
            lastName={profile?.lastName || ""}
          />
        </div>
        <h2 className="text-xl font-heading font-bold">
          {profile?.firstName} {profile?.lastName}
        </h2>
        <p className="text-sm text-muted-foreground">{profile?.email}</p>
        {profile?.family && (
          <Badge variant="secondary" className="mt-2">
            {profile.family.name}
          </Badge>
        )}
      </div>

      <Separator />

      {/* Kreise */}
      {memberships && memberships.length > 0 && (
        <div>
          <h3 className="font-heading font-bold mb-2">Meine Kreise</h3>
          <div className="flex gap-2 flex-wrap">
            {memberships.map((m) => (
              <Badge key={m.kreis.slug} variant="secondary">
                {m.kreis.icon} {m.kreis.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Family invite code */}
      {profile?.family && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-heading font-bold text-sm mb-1">
              Familien-Einladungscode
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              Teile diesen Code mit deinem Partner/deiner Partnerin.
            </p>
            <div className="bg-muted rounded-lg p-3 text-center">
              <code className="text-lg font-bold tracking-widest">
                {profile.family.inviteCode}
              </code>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Edit Profile Form */}
      <ProfileForm
        initialData={{
          first_name: profile?.firstName || "",
          last_name: profile?.lastName || "",
          bio: profile?.bio || "",
          skill_tags: profile?.skillTags || [],
          privacy_mode: profile?.privacyMode || false,
        }}
      />

      <Separator />

      {/* Sign Out */}
      <SignOutButton />

      {/* Legal */}
      <div className="flex justify-center gap-4 text-xs text-muted-foreground pb-4">
        <a href="/impressum" className="hover:underline">
          Impressum
        </a>
        <a href="/datenschutz" className="hover:underline">
          Datenschutz
        </a>
      </div>
    </div>
  );
}
