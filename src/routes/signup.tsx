import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AuthCard, fieldClass, submitClass } from "@/components/AuthCard";

export const Route = createFileRoute("/signup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create your account — Online Notepad" },
      {
        name: "description",
        content: "Sign up for Online Notepad and start writing collaborative documents with your team.",
      },
      { property: "og:title", content: "Create your account — Online Notepad" },
      {
        property: "og:description",
        content: "Join Online Notepad and collaborate on documents in real time.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name: name.trim() },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      setPendingEmail(true);
      toast.success("Check your email to confirm your account.");
      return;
    }
    toast.success("Account created!");
    void navigate({ to: "/dashboard", replace: true });
  }

  if (pendingEmail) {
    return (
      <AuthCard
        title="Confirm your email"
        subtitle={`We sent a confirmation link to ${email}. Click it to activate your account.`}
        footer={
          <Link to="/login" className="font-medium text-brand-2 hover:underline">
            Back to log in
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">
          Once confirmed, you'll be able to log in and start creating documents.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start collaborating in real time — it takes seconds."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-2 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            required
            className={fieldClass}
            placeholder="Kishika Sethi"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className={fieldClass}
            placeholder="you@team.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            className={fieldClass}
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className={submitClass} disabled={busy}>
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </button>
      </form>
    </AuthCard>
  );
}
