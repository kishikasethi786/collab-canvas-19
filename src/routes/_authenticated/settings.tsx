import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, LogOut, Moon, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, colorForId, initialsOf } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Online Notepad" },
      { name: "description", content: "Manage your Online Notepad profile, appearance and account." },
      { property: "og:title", content: "Settings — Online Notepad" },
      { property: "og:description", content: "Update your profile and appearance preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(profile?.name ?? "");
    setAvatar(profile?.avatar_url ?? "");
  }, [profile?.id, profile?.name, profile?.avatar_url]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim(), avatar_url: avatar.trim() || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Couldn't save your profile.");
      return;
    }
    await refreshProfile();
    toast.success("Profile saved");
  }

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    void navigate({ to: "/login", replace: true });
  }

  return (
    <AppShell activeView="settings">
      <div className="mx-auto max-w-2xl px-5 py-8 md:px-8 md:py-10">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>

        <section className="mt-7 rounded-2xl border border-border bg-surface/70 p-6">
          <h2 className="font-semibold">Profile</h2>
          <form onSubmit={saveProfile} className="mt-5 space-y-4">
            <div className="flex items-center gap-4">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Your avatar"
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{ backgroundColor: colorForId(user?.id ?? "x") }}
                >
                  {initialsOf(name || user?.email || "?")}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <label className="mb-1.5 block text-sm font-medium">Avatar image URL</label>
                <input
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-input bg-surface-2/60 px-4 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-input bg-surface-2/60 px-4 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <input
                value={user?.email ?? ""}
                readOnly
                className="w-full cursor-not-allowed rounded-xl border border-input bg-surface-2/30 px-4 py-2.5 text-sm text-muted-foreground outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl gradient-bg px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
            </button>
          </form>
        </section>

        <section className="mt-5 rounded-2xl border border-border bg-surface/70 p-6">
          <h2 className="font-semibold">Appearance</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {(
              [
                { key: "dark", label: "Dark mode", icon: Moon },
                { key: "light", label: "Light mode", icon: Sun },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTheme(opt.key)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                  theme === opt.key
                    ? "border-brand bg-brand/15"
                    : "border-border hover:bg-accent"
                }`}
              >
                <opt.icon className="h-4 w-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-border bg-surface/70 p-6">
          <h2 className="font-semibold">Account</h2>
          <button
            onClick={handleSignOut}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-destructive/40 px-5 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </section>
      </div>
    </AppShell>
  );
}
