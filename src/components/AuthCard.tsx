import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/3 h-80 w-80 rounded-full bg-brand/20 blur-[130px]" />
        <div className="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-brand-2/20 blur-[130px]" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-bg font-bold text-primary-foreground">
            C
          </span>
          <span className="text-lg font-bold tracking-tight">CollabNote</span>
        </Link>
        <div className="glass rounded-2xl p-7 shadow-2xl">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
  );
}

export const fieldClass =
  "w-full rounded-xl border border-input bg-surface-2/60 px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand";

export const submitClass =
  "w-full rounded-xl gradient-bg px-4 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60";
