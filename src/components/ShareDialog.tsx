import { useEffect, useState } from "react";
import { Link2, X, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { colorForId, initialsOf } from "@/lib/auth";
import type { CollaboratorRow } from "@/lib/documents";

type Person = CollaboratorRow & { name: string; email: string };

export function ShareDialog({
  documentId,
  isOwner,
  onClose,
}: {
  documentId: string;
  isOwner: boolean;
  onClose: () => void;
}) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"editor" | "viewer">("editor");
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("document_collaborators")
      .select("*")
      .eq("document_id", documentId);
    if (error) {
      toast.error("Couldn't load collaborators.");
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as CollaboratorRow[];
    const ids = rows.map((r) => r.user_id);
    let profiles: { id: string; name: string; email: string }[] = [];
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("id,name,email").in("id", ids);
      profiles = (p ?? []) as typeof profiles;
    }
    setPeople(
      rows.map((r) => {
        const prof = profiles.find((p) => p.id === r.user_id);
        return { ...r, name: prof?.name ?? "Teammate", email: prof?.email ?? "" };
      }),
    );
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  async function copyLink() {
    const url = `${window.location.origin}/document/${documentId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    toast.success("Link copied!");
  }

  async function addCollaborator(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const { data: userId, error: lookupError } = await supabase.rpc("find_profile_id_by_email", {
      _email: email.trim(),
    });
    if (lookupError) {
      setBusy(false);
      toast.error("Something went wrong.");
      return;
    }
    if (!userId) {
      setBusy(false);
      toast.error("No Online Notepad user with that email.");
      return;
    }
    const { error } = await supabase
      .from("document_collaborators")
      .upsert(
        { document_id: documentId, user_id: userId as string, permission },
        { onConflict: "document_id,user_id" },
      );
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Collaborator added");
    setEmail("");
    void load();
  }

  async function changePermission(id: string, next: "editor" | "viewer") {
    const { error } = await supabase
      .from("document_collaborators")
      .update({ permission: next })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Permission updated");
    void load();
  }

  async function removePerson(id: string) {
    const { error } = await supabase.from("document_collaborators").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Collaborator removed");
    void load();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="glass max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl p-6 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">Share this document</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Invite teammates or share a direct link.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={copyLink}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-2/60 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
        >
          <Link2 className="h-4 w-4" /> Copy document link
        </button>

        {isOwner && (
          <form onSubmit={addCollaborator} className="mt-5 space-y-3">
            <label className="block text-sm font-medium">Invite by email</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@team.com"
                className="min-w-0 flex-1 rounded-xl border border-input bg-surface-2/60 px-4 py-2.5 text-sm outline-none focus:border-brand"
              />
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as "editor" | "viewer")}
                className="rounded-xl border border-input bg-surface-2/60 px-3 py-2.5 text-sm outline-none focus:border-brand"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl gradient-bg px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invite"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6">
          <h3 className="text-sm font-semibold">People with access</h3>
          {loading ? (
            <p className="mt-3 text-sm text-muted-foreground">Loading collaborators...</p>
          ) : people.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No collaborators yet — invite someone above.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {people.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/40 px-3 py-2"
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: colorForId(p.user_id) }}
                  >
                    {initialsOf(p.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                  </div>
                  {isOwner ? (
                    <>
                      <select
                        value={p.permission}
                        onChange={(e) =>
                          changePermission(p.id, e.target.value as "editor" | "viewer")
                        }
                        className="rounded-lg border border-input bg-surface px-2 py-1 text-xs outline-none"
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={() => removePerson(p.id)}
                        aria-label="Remove collaborator"
                        className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs capitalize text-muted-foreground">{p.permission}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
