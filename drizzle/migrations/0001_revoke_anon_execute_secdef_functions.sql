REVOKE EXECUTE ON FUNCTION public.create_tikpay_community_comment(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_tikpay_community_comment(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.toggle_tikpay_community_like(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_tikpay_profile_avatar(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.tikpay_set_updated_at() FROM anon, authenticated;