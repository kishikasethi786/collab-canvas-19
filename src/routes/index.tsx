import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  Save,
  Share2,
  ShieldCheck,
  Files,
  Radio,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Online Notepad — Write together. Think together." },
      {
        name: "description",
        content:
          "Create, edit and share notes with your team in real time. Live presence, automatic saving and granular sharing permissions.",
      },
      { property: "og:title", content: "Online Notepad — Write together. Think together." },
      {
        property: "og:description",
        content: "A real-time collaborative notepad for teams. Your ideas, together in real time.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Users,
    title: "Real-time collaboration",
    text: "Everyone edits the same document at once. Changes appear instantly, no refresh needed.",
  },
  {
    icon: Save,
    title: "Automatic saving",
    text: "Stop typing and it's already saved. No save button, no lost work.",
  },
  {
    icon: Share2,
    title: "Easy document sharing",
    text: "Copy a link or invite teammates by email as editors or viewers.",
  },
  {
    icon: ShieldCheck,
    title: "Secure authentication",
    text: "Accounts and row-level permissions keep private documents private.",
  },
  {
    icon: Files,
    title: "Multiple documents",
    text: "Organise everything in one dashboard with instant search across titles and content.",
  },
  {
    icon: Radio,
    title: "Online user presence",
    text: "See exactly who is in the document right now with live coloured avatars.",
  },
];

function Landing() {
  const { user, loading } = useAuth();
  const startTo = user ? "/dashboard" : "/signup";

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-brand/20 blur-[140px]" />
        <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-brand-2/20 blur-[140px]" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-bg text-primary-foreground font-bold">
            C
          </span>
          <span className="text-lg font-bold tracking-tight">Online Notepad</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          {!loading && user ? (
            <Link
              to="/dashboard"
              className="rounded-lg gradient-bg px-4 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-lg gradient-bg px-4 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-5 pt-12 pb-20 text-center md:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            Write together. Think together.
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl">
            Your ideas, <span className="gradient-text">together in real time.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Online Notepad is a collaborative notepad where your whole team can create, edit and share
            documents at the same time — with live presence and automatic saving built in.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={startTo}
              className="group inline-flex items-center gap-2 rounded-xl gradient-bg px-6 py-3 font-semibold text-primary-foreground glow transition-transform hover:-translate-y-0.5"
            >
              Start Writing
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-border bg-surface/60 px-6 py-3 font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Explore Features
            </a>
          </div>

          <EditorPreview />
        </section>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-24">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
            Everything a team needs to write together
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
            Built on a real database with live sync — not a demo.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="glass rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-brand/40"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 pb-24">
          <div className="glass glow rounded-3xl px-6 py-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Start your first shared document</h2>
            <p className="mt-3 text-muted-foreground">
              Free to create. Invite your team in seconds.
            </p>
            <Link
              to={startTo}
              className="mt-7 inline-flex rounded-xl gradient-bg px-6 py-3 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Start Writing
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border py-8 text-center text-sm text-muted-foreground">
        Online Notepad — Write together. Think together.
      </footer>
    </div>
  );
}

function EditorPreview() {
  const people = [
    { i: "K", c: "#8b5cf6" },
    { i: "A", c: "#3b82f6" },
    { i: "R", c: "#10b981" },
  ];
  return (
    <div className="mx-auto mt-16 max-w-4xl">
      <div className="glass overflow-hidden rounded-2xl text-left shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-surface-2/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-destructive/70" />
            <span className="h-3 w-3 rounded-full bg-amber-400/70" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
            <span className="ml-3 text-sm font-medium">Product roadmap Q3</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {people.map((p) => (
                <span
                  key={p.i}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface text-xs font-bold text-white"
                  style={{ backgroundColor: p.c }}
                >
                  {p.i}
                </span>
              ))}
            </div>
            <span className="hidden text-xs text-muted-foreground sm:inline">3 people editing</span>
          </div>
        </div>
        <div className="space-y-4 px-6 py-8">
          <h3 className="text-2xl font-bold">Launch checklist</h3>
          <p className="text-sm text-muted-foreground">
            Everything we need to ship before the end of the quarter.
          </p>
          <div className="space-y-2">
            {["Finalise onboarding copy", "Ship realtime presence", "Team review"].map((t, idx) => (
              <div key={t} className="flex items-center gap-3 text-sm">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: people[idx]!.c }}
                />
                {t}
              </div>
            ))}
          </div>
          <div className="h-2 w-3/4 rounded bg-muted" />
          <div className="h-2 w-2/3 rounded bg-muted" />
          <div className="h-2 w-1/2 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
