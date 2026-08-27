import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  MoreVertical,
  FileText,
  Users,
  Loader2,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { fetchDocuments, plainText, timeAgo, type DocumentSummary } from "@/lib/documents";

type View = "all" | "mine" | "shared";

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: (search: Record<string, unknown>): { view?: View } => {
    const v = search["view"];
    return v === "mine" || v === "shared" ? { view: v } : {};
  },
  head: () => ({
    meta: [
      { title: "Dashboard — CollabNote" },
      { name: "description", content: "All your collaborative documents in one place." },
      { property: "og:title", content: "Dashboard — CollabNote" },
      { property: "og:description", content: "Manage and search your CollabNote documents." },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { view = "all" } = Route.useSearch();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    try {
      setError(null);
      const list = await fetchDocuments(user.id);
      setDocs(list);
    } catch {
      setError("Something went wrong loading your documents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("dashboard-docs")
      .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, () => {
        void load();
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "document_collaborators" },
        () => {
          void load();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs
      .filter((d) =>
        view === "mine" ? d.isOwner : view === "shared" ? !d.isOwner : true,
      )
      .filter(
        (d) =>
          !q ||
          d.title.toLowerCase().includes(q) ||
          plainText(d.content).toLowerCase().includes(q),
      );
  }, [docs, query, view]);

  async function createDocument() {
    if (!user) return;
    setCreating(true);
    const { data, error: err } = await supabase
      .from("documents")
      .insert({ owner_id: user.id, title: "Untitled document", content: "" })
      .select()
      .single();
    setCreating(false);
    if (err || !data) {
      toast.error("Couldn't create the document.");
      return;
    }
    toast.success("Document created");
    void navigate({ to: "/document/$id", params: { id: data.id as string } });
  }

  async function renameDocument(doc: DocumentSummary) {
    const next = window.prompt("Rename document", doc.title);
    if (next === null) return;
    const title = next.trim() || "Untitled document";
    const { error: err } = await supabase.from("documents").update({ title }).eq("id", doc.id);
    if (err) {
      toast.error("You don't have permission to rename this document.");
      return;
    }
    toast.success("Document renamed");
    void load();
  }

  async function deleteDocument(doc: DocumentSummary) {
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    const { error: err } = await supabase.from("documents").delete().eq("id", doc.id);
    if (err) {
      toast.error("Only the owner can delete this document.");
      return;
    }
    toast.success("Document deleted");
    setDocs((d) => d.filter((x) => x.id !== doc.id));
  }

  const title =
    view === "mine" ? "My Documents" : view === "shared" ? "Shared With Me" : "Your Documents";

  return (
    <AppShell activeView={view}>
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {greeting()}, <span className="gradient-text">{profile?.name || "there"}</span>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Pick up where you left off or start something new.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles and content..."
              className="w-full rounded-xl border border-input bg-surface-2/60 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-brand"
            />
          </div>
          <button
            onClick={createDocument}
            disabled={creating}
            className="inline-flex items-center justify-center gap-2 rounded-xl gradient-bg px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            New Document
          </button>
        </div>

        <h2 className="mt-9 text-lg font-semibold">{title}</h2>

        {loading ? (
          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading documents...
          </p>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-sm">
            {error}{" "}
            <button onClick={() => void load()} className="font-semibold underline">
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            searching={query.trim().length > 0}
            onCreate={createDocument}
            view={view}
          />
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                className="group relative flex flex-col rounded-2xl border border-border bg-surface/70 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brand/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="relative">
                    <button
                      aria-label="More options"
                      onClick={() => setMenuFor(menuFor === doc.id ? null : doc.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuFor === doc.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-xl">
                          <Link
                            to="/document/$id"
                            params={{ id: doc.id }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                          >
                            <ExternalLink className="h-4 w-4" /> Open
                          </Link>
                          <button
                            onClick={() => {
                              setMenuFor(null);
                              void renameDocument(doc);
                            }}
                            disabled={doc.permission === "viewer"}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent disabled:opacity-40"
                          >
                            <Pencil className="h-4 w-4" /> Rename
                          </button>
                          <button
                            onClick={() => {
                              setMenuFor(null);
                              void deleteDocument(doc);
                            }}
                            disabled={!doc.isOwner}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Link
                  to="/document/$id"
                  params={{ id: doc.id }}
                  className="mt-4 block min-w-0 flex-1"
                >
                  <h3 className="truncate font-semibold">{doc.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {plainText(doc.content).slice(0, 120) || "Empty document"}
                  </p>
                </Link>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>Edited {timeAgo(doc.updated_at)}</span>
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {doc.collaboratorCount}
                    </span>
                    <span className="truncate">{doc.ownerName}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function EmptyState({
  searching,
  onCreate,
  view,
}: {
  searching: boolean;
  onCreate: () => void;
  view: View;
}) {
  if (searching) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-border p-12 text-center">
        <p className="font-medium">No documents found</p>
        <p className="mt-1 text-sm text-muted-foreground">Try a different search term.</p>
      </div>
    );
  }
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border p-12 text-center">
      <p className="text-lg font-semibold">
        {view === "shared" ? "Nothing shared with you yet" : "No documents yet"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {view === "shared"
          ? "When a teammate shares a document, it will show up here."
          : "Create your first document and start collaborating."}
      </p>
      {view !== "shared" && (
        <button
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-xl gradient-bg px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Create Document
        </button>
      )}
    </div>
  );
}
