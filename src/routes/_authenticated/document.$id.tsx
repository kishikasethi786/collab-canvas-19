import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  Share2,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, colorForId, initialsOf } from "@/lib/auth";
import { ShareDialog } from "@/components/ShareDialog";
import type { DocumentRow } from "@/lib/documents";

export const Route = createFileRoute("/_authenticated/document/$id")({
  head: () => ({
    meta: [
      { title: "Editor — CollabNote" },
      { name: "description", content: "Write and edit together in real time with your team." },
      { property: "og:title", content: "Editor — CollabNote" },
      { property: "og:description", content: "Real-time collaborative document editing." },
    ],
  }),
  component: EditorPage,
});

type Presence = { userId: string; name: string };
type SaveState = "idle" | "saving" | "saved";

function EditorPage() {
  const { id } = Route.useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const applyingRemote = useRef(false);

  const [doc, setDoc] = useState<DocumentRow | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [people, setPeople] = useState<Presence[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Load document + permission
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      setLoading(true);
      const { data, error: err } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (err) {
        setError("Something went wrong.");
        setLoading(false);
        return;
      }
      if (!data) {
        setError("You don't have permission to access this document.");
        setLoading(false);
        return;
      }
      const row = data as DocumentRow;
      const owner = row.owner_id === user.id;
      let edit = owner;
      if (!owner) {
        const { data: collab } = await supabase
          .from("document_collaborators")
          .select("permission")
          .eq("document_id", id)
          .eq("user_id", user.id)
          .maybeSingle();
        edit = (collab as { permission?: string } | null)?.permission === "editor";
      }
      if (cancelled) return;
      setDoc(row);
      setTitle(row.title);
      setIsOwner(owner);
      setCanEdit(edit);
      setError(null);
      setLoading(false);
      if (editorRef.current) editorRef.current.innerHTML = row.content || "";
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  // Realtime: presence + content broadcast + db changes
  useEffect(() => {
    if (!user || !doc) return;
    const channel = supabase.channel(`document:${id}`, {
      config: { presence: { key: user.id } },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ userId: string; name: string }>();
        const list: Presence[] = [];
        Object.values(state).forEach((entries) => {
          const e = entries[0];
          if (e && !list.some((p) => p.userId === e.userId)) {
            list.push({ userId: e.userId, name: e.name });
          }
        });
        setPeople(list);
      })
      .on("broadcast", { event: "content" }, ({ payload }) => {
        const p = payload as { content: string; title?: string; from: string };
        if (p.from === user.id) return;
        applyingRemote.current = true;
        if (editorRef.current && editorRef.current.innerHTML !== p.content) {
          editorRef.current.innerHTML = p.content;
        }
        if (typeof p.title === "string") setTitle(p.title);
        applyingRemote.current = false;
      })
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "documents", filter: `id=eq.${id}` },
        ({ new: row }) => {
          const r = row as DocumentRow;
          setTitle((t) => (r.title !== t ? r.title : t));
          if (
            editorRef.current &&
            document.activeElement !== editorRef.current &&
            editorRef.current.innerHTML !== r.content
          ) {
            editorRef.current.innerHTML = r.content || "";
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void channel.track({ userId: user.id, name: profile?.name ?? "Teammate" });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [id, user, doc, profile?.name]);

  const persist = useCallback(
    async (content: string, nextTitle: string) => {
      setSaveState("saving");
      const { error: err } = await supabase
        .from("documents")
        .update({ title: nextTitle, content })
        .eq("id", id);
      if (err) {
        setSaveState("idle");
        toast.error("Couldn't save your changes.");
        return;
      }
      setSaveState("saved");
    },
    [id],
  );

  const queueSave = useCallback(
    (content: string, nextTitle: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveState("saving");
      saveTimer.current = setTimeout(() => {
        void persist(content, nextTitle);
      }, 800);
    },
    [persist],
  );

  function handleInput() {
    if (!canEdit || applyingRemote.current) return;
    const content = editorRef.current?.innerHTML ?? "";
    channelRef.current?.send({
      type: "broadcast",
      event: "content",
      payload: { content, title, from: user?.id },
    });
    queueSave(content, title);
  }

  function handleTitleChange(next: string) {
    setTitle(next);
    if (!canEdit) return;
    const content = editorRef.current?.innerHTML ?? "";
    channelRef.current?.send({
      type: "broadcast",
      event: "content",
      payload: { content, title: next, from: user?.id },
    });
    queueSave(content, next);
  }

  function exec(command: string, value?: string) {
    if (!canEdit) return;
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading document...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold">{error}</h1>
        <button
          onClick={() => void navigate({ to: "/dashboard" })}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  const tools: { icon: typeof Bold; label: string; run: () => void }[] = [
    { icon: Bold, label: "Bold", run: () => exec("bold") },
    { icon: Italic, label: "Italic", run: () => exec("italic") },
    { icon: Underline, label: "Underline", run: () => exec("underline") },
    { icon: Strikethrough, label: "Strikethrough", run: () => exec("strikeThrough") },
    { icon: Heading1, label: "Heading 1", run: () => exec("formatBlock", "<h1>") },
    { icon: Heading2, label: "Heading 2", run: () => exec("formatBlock", "<h2>") },
    { icon: List, label: "Bullet list", run: () => exec("insertUnorderedList") },
    { icon: ListOrdered, label: "Numbered list", run: () => exec("insertOrderedList") },
    { icon: AlignLeft, label: "Align left", run: () => exec("justifyLeft") },
    { icon: AlignCenter, label: "Align center", run: () => exec("justifyCenter") },
    { icon: AlignRight, label: "Align right", run: () => exec("justifyRight") },
    { icon: Undo2, label: "Undo", run: () => exec("undo") },
    { icon: Redo2, label: "Redo", run: () => exec("redo") },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="glass sticky top-0 z-30 border-b border-border">
        <div className="flex items-center gap-3 px-3 py-2.5 sm:px-5">
          <Link
            to="/dashboard"
            className="rounded-lg p-2 hover:bg-accent"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="hidden bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(215_90%_60%)] bg-clip-text text-sm font-bold text-transparent sm:block">
            CollabNote
          </span>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            readOnly={!canEdit}
            aria-label="Document title"
            className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1 text-sm font-semibold outline-none focus:bg-accent/60"
          />
          <span className="hidden whitespace-nowrap text-xs text-muted-foreground sm:block">
            {offline
              ? "You're offline"
              : saveState === "saving"
                ? "Saving..."
                : saveState === "saved"
                  ? "Saved just now"
                  : canEdit
                    ? "Saved"
                    : "View only"}
          </span>
          <div className="flex -space-x-2">
            {people.slice(0, 4).map((p) => (
              <span
                key={p.userId}
                title={p.name}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background text-[11px] font-bold text-white"
                style={{ background: colorForId(p.userId) }}
              >
                {initialsOf(p.name)}
              </span>
            ))}
          </div>
          <span className="hidden whitespace-nowrap text-xs text-muted-foreground md:block">
            {people.length} {people.length === 1 ? "person" : "people"} online
          </span>
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>

        {canEdit && (
          <div className="flex gap-1 overflow-x-auto border-t border-border px-3 py-1.5 sm:px-5">
            {tools.map(({ icon: Icon, label, run }) => (
              <button
                key={label}
                type="button"
                title={label}
                aria-label={label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={run}
                className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <div
          ref={editorRef}
          className="doc-editor min-h-[60vh] w-full outline-none"
          contentEditable={canEdit}
          suppressContentEditableWarning
          onInput={handleInput}
          data-placeholder="Start writing..."
        />
      </main>

      {shareOpen && (
        <ShareDialog documentId={id} isOwner={isOwner} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}
