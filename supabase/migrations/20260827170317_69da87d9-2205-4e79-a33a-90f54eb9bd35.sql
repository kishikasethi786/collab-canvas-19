-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Untitled document',
  content TEXT NOT NULL DEFAULT '',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE TYPE public.doc_permission AS ENUM ('editor', 'viewer');

CREATE TABLE public.document_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission public.doc_permission NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_collaborators TO authenticated;
GRANT ALL ON public.document_collaborators TO service_role;
ALTER TABLE public.document_collaborators ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_collab_user ON public.document_collaborators(user_id);
CREATE INDEX idx_collab_doc ON public.document_collaborators(document_id);
CREATE INDEX idx_docs_owner ON public.documents(owner_id);

-- helper functions (security definer avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_doc_owner(_doc UUID, _uid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.documents d WHERE d.id = _doc AND d.owner_id = _uid);
$$;

CREATE OR REPLACE FUNCTION public.can_view_doc(_doc UUID, _uid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_doc_owner(_doc, _uid)
    OR EXISTS (SELECT 1 FROM public.document_collaborators c WHERE c.document_id = _doc AND c.user_id = _uid);
$$;

CREATE OR REPLACE FUNCTION public.can_edit_doc(_doc UUID, _uid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_doc_owner(_doc, _uid)
    OR EXISTS (SELECT 1 FROM public.document_collaborators c
               WHERE c.document_id = _doc AND c.user_id = _uid AND c.permission = 'editor');
$$;

CREATE OR REPLACE FUNCTION public.shares_doc_with(_a UUID, _b UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents d
    LEFT JOIN public.document_collaborators c ON c.document_id = d.id
    WHERE (d.owner_id = _a OR c.user_id = _a)
      AND (d.owner_id = _b OR c.user_id = _b)
  );
$$;

CREATE OR REPLACE FUNCTION public.find_profile_id_by_email(_email TEXT)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.profiles WHERE lower(email) = lower(trim(_email)) LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.find_profile_id_by_email(TEXT) TO authenticated;

-- profiles policies
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.shares_doc_with(auth.uid(), id));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- documents policies
CREATE POLICY "documents_select" ON public.documents FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.can_view_doc(id, auth.uid()));
CREATE POLICY "documents_insert" ON public.documents FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "documents_update" ON public.documents FOR UPDATE TO authenticated
  USING (public.can_edit_doc(id, auth.uid())) WITH CHECK (public.can_edit_doc(id, auth.uid()));
CREATE POLICY "documents_delete" ON public.documents FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- collaborators policies
CREATE POLICY "collab_select" ON public.document_collaborators FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_doc_owner(document_id, auth.uid()));
CREATE POLICY "collab_insert" ON public.document_collaborators FOR INSERT TO authenticated
  WITH CHECK (public.is_doc_owner(document_id, auth.uid()));
CREATE POLICY "collab_update" ON public.document_collaborators FOR UPDATE TO authenticated
  USING (public.is_doc_owner(document_id, auth.uid())) WITH CHECK (public.is_doc_owner(document_id, auth.uid()));
CREATE POLICY "collab_delete" ON public.document_collaborators FOR DELETE TO authenticated
  USING (public.is_doc_owner(document_id, auth.uid()) OR user_id = auth.uid());

-- updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER documents_touch BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.documents REPLICA IDENTITY FULL;
ALTER TABLE public.document_collaborators REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_collaborators;