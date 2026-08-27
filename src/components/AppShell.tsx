import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LayoutDashboard, FileText, Users, Settings, LogOut, Menu, X } from "lucide-react";
import { useAuth, colorForId, initialsOf } from "@/lib/auth";
import { toast } from "sonner";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, search: undefined },
  { to: "/dashboard", label: "My Documents", icon: FileText, search: { view: "mine" } },
  { to: "/dashboard", label: "Shared With Me", icon: Users, search: { view: "shared" } },
  { to: "/settings", label: "Settings", icon: Settings, search: undefined },
] as const;

export function AppShell({
  children,
  activeView,
}: {
  children: ReactNode;
  activeView?: string;
}) {
  const [open, setOpen] = useState(false);
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();

  const name = profile?.name || user?.email || "You";
  const id = user?.id ?? "anon";

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    void navigate({ to: "/login", replace: true });
  }

  const sidebar = (
    <div className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <Link
        to="/dashboard"
        className="flex items-center gap-2 px-5 py-5"
        onClick={() => setOpen(false)}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-bg font-bold text-primary-foreground">
          C
        </span>
        <span className="text-lg font-bold tracking-tight">CollabNote</span>
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const key = item.search?.view ?? (item.to === "/settings" ? "settings" : "all");
          const active = activeView === key;
          return (
            <Link
              key={item.label}
              to={item.to}
              search={item.search as never}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand/15 text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: colorForId(id) }}
          >
            {initialsOf(name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 animate-in slide-in-from-left duration-200">
            {sidebar}
          </div>
          <button
            aria-label="Close menu"
            className="absolute right-4 top-4 rounded-lg bg-surface p-2"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 md:hidden">
          <button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-lg p-1.5">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold tracking-tight">CollabNote</span>
        </div>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
