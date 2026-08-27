import { supabase } from "@/integrations/supabase/client";

export type DocumentRow = {
  id: string;
  title: string;
  content: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type CollaboratorRow = {
  id: string;
  document_id: string;
  user_id: string;
  permission: "editor" | "viewer";
  created_at: string;
};

export type DocumentSummary = DocumentRow & {
  ownerName: string;
  collaboratorCount: number;
  isOwner: boolean;
  permission: "owner" | "editor" | "viewer";
};

export function plainText(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString();
}

export async function fetchDocuments(userId: string): Promise<DocumentSummary[]> {
  const { data: docs, error } = await supabase
    .from("documents")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;

  const rows = (docs ?? []) as DocumentRow[];
  if (rows.length === 0) return [];

  const ids = rows.map((d) => d.id);
  const [{ data: collabs }, { data: profiles }] = await Promise.all([
    supabase.from("document_collaborators").select("*").in("document_id", ids),
    supabase.from("profiles").select("id,name,email"),
  ]);

  const nameById = new Map<string, string>();
  for (const p of (profiles ?? []) as { id: string; name: string; email: string }[]) {
    nameById.set(p.id, p.name || p.email);
  }

  return rows.map((d) => {
    const list = ((collabs ?? []) as CollaboratorRow[]).filter((c) => c.document_id === d.id);
    const mine = list.find((c) => c.user_id === userId);
    return {
      ...d,
      ownerName: d.owner_id === userId ? "You" : (nameById.get(d.owner_id) ?? "Teammate"),
      collaboratorCount: list.length,
      isOwner: d.owner_id === userId,
      permission: d.owner_id === userId ? "owner" : (mine?.permission ?? "viewer"),
    };
  });
}
