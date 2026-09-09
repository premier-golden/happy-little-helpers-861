-- Comments: owner-only writes
CREATE POLICY "tikpay_community_comments_insert_own"
ON public.tikpay_community_comments
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()) AND is_preloaded IS NOT TRUE);

CREATE POLICY "tikpay_community_comments_update_own"
ON public.tikpay_community_comments
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "tikpay_community_comments_delete_own"
ON public.tikpay_community_comments
FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Likes: owner-only writes
CREATE POLICY "tikpay_community_likes_insert_own"
ON public.tikpay_community_likes
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "tikpay_community_likes_delete_own"
ON public.tikpay_community_likes
FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tikpay_community_comments TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.tikpay_community_likes TO authenticated;
GRANT ALL ON public.tikpay_community_comments TO service_role;
GRANT ALL ON public.tikpay_community_likes TO service_role;