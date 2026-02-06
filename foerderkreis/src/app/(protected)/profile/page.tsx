import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "./profile-form";
import { SignOutButton } from "./sign-out-button";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("*, families(name, invite_code)")
    .eq("id", user!.id)
    .single();

  // Get user's Kreise
  const { data: memberships } = await supabase
    .from("kreis_memberships")
    .select("role, kreise(name, slug, icon)")
    .eq("user_id", user!.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-extrabold">Mein Profil</h1>

      {/* Avatar & Name */}
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 mx-auto flex items-center justify-center text-2xl font-heading font-bold text-white mb-3">
          {profile?.first_name?.[0] || "?"}
          {profile?.last_name?.[0] || ""}
        </div>
        <h2 className="text-xl font-heading font-bold">
          {profile?.first_name} {profile?.last_name}
        </h2>
        <p className="text-sm text-muted-foreground">{profile?.email}</p>
        {profile?.families && (
          <Badge variant="secondary" className="mt-2">
            {(profile.families as { name: string }).name}
          </Badge>
        )}
      </div>

      <Separator />

      {/* Kreise */}
      {memberships && memberships.length > 0 && (
        <div>
          <h3 className="font-heading font-bold mb-2">Meine Kreise</h3>
          <div className="flex gap-2 flex-wrap">
            {memberships.map((m) => {
              const kreis = m.kreise as unknown as {
                name: string;
                slug: string;
                icon: string;
              };
              return (
                <Badge key={kreis.slug} variant="secondary">
                  {kreis.icon} {kreis.name}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Family invite code */}
      {profile?.families && (
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
                {(profile.families as { invite_code: string }).invite_code}
              </code>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Edit Profile Form */}
      <ProfileForm
        initialData={{
          first_name: profile?.first_name || "",
          last_name: profile?.last_name || "",
          bio: profile?.bio || "",
          skill_tags: profile?.skill_tags || [],
          privacy_mode: profile?.privacy_mode || false,
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
