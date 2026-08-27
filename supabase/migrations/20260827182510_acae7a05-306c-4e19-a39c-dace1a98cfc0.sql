GRANT EXECUTE ON FUNCTION public.is_doc_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_doc(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_doc(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_doc_with(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_profile_id_by_email(text) TO authenticated;