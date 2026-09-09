import { createFileRoute } from "@tanstack/react-router";
import {
  Heart,
  MessageCircle,
  RefreshCw,
  Send,
  UserRound,
  UsersRound,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { MembersLayout } from "@/components/members/MembersLayout";
import { useTikPayMemberState } from "@/hooks/use-tikpay-member-state";
import {
  createTikPayCommunityComment,
  fetchTikPayCommunityComments,
  fetchTikPayCommunityLikedPostIds,
  fetchTikPayCommunityPosts,
  toggleTikPayCommunityLike,
  type TikPayCommunityComment,
  type TikPayCommunityPost,
} from "@/lib/tikpay-community-api";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Comunidad — Tik Pay" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CommunityPage,
});

function commentTime(value: string) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "";
  const diff = Math.max(0, Date.now() - time);
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "ahora";
  if (minutes < 60) return "hace " + minutes + " min";

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return "hace " + hours + " h";

  const days = Math.floor(hours / 24);
  return "hace " + days + (days === 1 ? " día" : " días");
}

function addToSet(source: Set<string>, value: string) {
  const next = new Set(source);
  next.add(value);
  return next;
}

function removeFromSet(source: Set<string>, value: string) {
  const next = new Set(source);
  next.delete(value);
  return next;
}

function CommunityPage() {
  const { state: memberState } = useTikPayMemberState();
  const [posts, setPosts] = useState<TikPayCommunityPost[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [expandedPostIds, setExpandedPostIds] = useState<Set<string>>(new Set());
  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, TikPayCommunityComment[]>
  >({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [likeLoading, setLikeLoading] = useState<Set<string>>(new Set());
  const [commentLoading, setCommentLoading] = useState<Set<string>>(new Set());
  const [commentSending, setCommentSending] = useState<Set<string>>(new Set());
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextPosts, likedIds] = await Promise.all([
        fetchTikPayCommunityPosts(),
        fetchTikPayCommunityLikedPostIds(),
      ]);
      setPosts(nextPosts);
      setLikedPostIds(new Set(likedIds));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo cargar la comunidad.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleLike(postId: string) {
    if (likeLoading.has(postId)) return;

    setLikeLoading((prev) => addToSet(prev, postId));
    setActionErrors((prev) => ({ ...prev, [postId]: "" }));

    try {
      const result = await toggleTikPayCommunityLike(postId);

      setLikedPostIds((prev) => {
        const next = new Set(prev);
        if (result.liked) next.add(postId);
        else next.delete(postId);
        return next;
      });

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likes_count: result.likesCount }
            : post,
        ),
      );
    } catch (caught) {
      setActionErrors((prev) => ({
        ...prev,
        [postId]:
          caught instanceof Error
            ? caught.message
            : "No se pudo registrar tu like.",
      }));
    } finally {
      setLikeLoading((prev) => removeFromSet(prev, postId));
    }
  }

  async function openComments(postId: string) {
    const isOpen = expandedPostIds.has(postId);

    if (isOpen) {
      setExpandedPostIds((prev) => removeFromSet(prev, postId));
      return;
    }

    setExpandedPostIds((prev) => addToSet(prev, postId));

    if (commentsByPost[postId] !== undefined || commentLoading.has(postId)) {
      return;
    }

    setCommentLoading((prev) => addToSet(prev, postId));
    setActionErrors((prev) => ({ ...prev, [postId]: "" }));

    try {
      const comments = await fetchTikPayCommunityComments(postId);
      setCommentsByPost((prev) => ({ ...prev, [postId]: comments }));
    } catch (caught) {
      setActionErrors((prev) => ({
        ...prev,
        [postId]:
          caught instanceof Error
            ? caught.message
            : "No se pudieron cargar los comentarios.",
      }));
    } finally {
      setCommentLoading((prev) => removeFromSet(prev, postId));
    }
  }

  async function submitComment(
    event: FormEvent<HTMLFormElement>,
    postId: string,
  ) {
    event.preventDefault();
    const body = (drafts[postId] ?? "").trim();

    if (!body || commentSending.has(postId)) return;

    setCommentSending((prev) => addToSet(prev, postId));
    setActionErrors((prev) => ({ ...prev, [postId]: "" }));

    try {
      const result = await createTikPayCommunityComment(postId, body);

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), result.comment],
      }));
      setDrafts((prev) => ({ ...prev, [postId]: "" }));
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, comments_count: result.commentsCount }
            : post,
        ),
      );
      setExpandedPostIds((prev) => addToSet(prev, postId));
    } catch (caught) {
      setActionErrors((prev) => ({
        ...prev,
        [postId]:
          caught instanceof Error
            ? caught.message
            : "No se pudo publicar tu comentario.",
      }));
    } finally {
      setCommentSending((prev) => removeFromSet(prev, postId));
    }
  }

  return (
    <MembersLayout>
      <section className="mb-4 overflow-hidden rounded-[24px] border border-[#ffdce3] bg-gradient-to-br from-[#fff5f7] via-white to-[#fff9fa] p-5 shadow-[0_8px_28px_rgba(255,59,92,0.08)]">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#ff3b5c] text-white shadow-[0_8px_18px_rgba(255,59,92,0.22)]">
            <UsersRound className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#ff3b5c]">
              Comunidad Tik Pay
            </p>
            <h1 className="mt-1 text-[21px] font-black tracking-tight text-[#161823]">
              Experiencias de la comunidad
            </h1>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[#747378]">
              Comparte, comenta y conecta con otros miembros.
            </p>
          </div>
        </div>

        {!loading && posts.length > 0 ? (
          <div className="mt-4 flex items-center gap-3 border-t border-[#f3dfe4] pt-4">
            <div className="flex -space-x-2">
              {posts
                .filter((post) => Boolean(post.author_avatar_url))
                .slice(0, 5)
                .map((post) => (
                  <img
                    key={post.id}
                    src={post.author_avatar_url ?? ""}
                    alt=""
                    className="h-8 w-8 rounded-full border-2 border-white object-cover shadow-sm"
                  />
                ))}
            </div>
            <div>
              <p className="text-[11px] font-black text-[#161823]">
                {posts.length} experiencias
              </p>
              <p className="text-[9px] text-[#929297]">
                Comunidad en crecimiento
              </p>
            </div>
          </div>
        ) : null}

      </section>

      {loading ? (
        <div className="rounded-[22px] border border-black/[0.05] bg-white p-8 text-center shadow-[0_8px_26px_rgba(0,0,0,0.05)]">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-[#ffd1da] border-t-[#ff3b5c]" />
          <p className="mt-3 text-[11px] font-bold text-[#8a8a8e]">
            Cargando comunidad...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-[22px] border border-[#ffd6de] bg-[#fff5f7] p-5 text-center">
          <p className="text-[12px] font-semibold text-[#c93652]">
            No se pudo cargar la comunidad.
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[11px] font-black text-[#ff3b5c] shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            INTENTAR DE NUEVO
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-[22px] border border-black/[0.05] bg-white p-6 text-center text-[12px] text-[#8a8a8e]">
          Todavía no hay publicaciones.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const liked = likedPostIds.has(post.id);
            const commentsOpen = expandedPostIds.has(post.id);
            const comments = commentsByPost[post.id] ?? [];
            const currentAvatar = memberState?.member.avatarUrl ?? null;

            return (
              <article
                key={post.id}
                className="overflow-hidden rounded-[22px] border border-black/[0.05] bg-white shadow-[0_7px_24px_rgba(0,0,0,0.045)]"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {post.author_avatar_url ? (
                      <img
                        src={post.author_avatar_url}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                      />
                    ) : (
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f1f1f3] text-[#96969b] ring-2 ring-white shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
                        <UserRound className="h-5 w-5" strokeWidth={1.8} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <h2 className="truncate text-[13px] font-black text-[#161823]">
                          {post.author_name}
                        </h2>
                        <span className="shrink-0 rounded-full bg-[#fff0f3] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.05em] text-[#ff3b5c]">
                          Miembro
                        </span>
                      </div>
                      {post.author_handle ? (
                        <span className="mt-0.5 block truncate text-[10px] text-[#a0a0a4]">
                          {post.author_handle}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <p className="mt-3 text-[13px] leading-[1.55] text-[#3f3f44]">
                    {post.body}
                  </p>

                  <div className="mt-4 flex items-center gap-2 border-t border-black/[0.05] pt-3">
                    <button
                      type="button"
                      disabled={likeLoading.has(post.id)}
                      onClick={() => void handleLike(post.id)}
                      className={
                        "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[10px] font-black transition active:scale-95 disabled:opacity-60 " +
                        (liked
                          ? "bg-[#fff0f3] text-[#ff3b5c]"
                          : "bg-[#f5f5f6] text-[#747378]")
                      }
                    >
                      <Heart
                        className={
                          "h-4 w-4 " + (liked ? "fill-current" : "")
                        }
                      />
                      {post.likes_count}
                    </button>

                    <button
                      type="button"
                      onClick={() => void openComments(post.id)}
                      className={
                        "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[10px] font-black transition active:scale-95 " +
                        (commentsOpen
                          ? "bg-[#fff0f3] text-[#ff3b5c]"
                          : "bg-[#f5f5f6] text-[#747378]")
                      }
                    >
                      <MessageCircle className="h-4 w-4" />
                      {post.comments_count > 0
                        ? post.comments_count
                        : "Comentar"}
                    </button>
                  </div>

                  {actionErrors[post.id] ? (
                    <p className="mt-2 rounded-xl bg-[#fff0f3] px-3 py-2 text-[9px] font-semibold text-[#c93652]">
                      {actionErrors[post.id]}
                    </p>
                  ) : null}
                </div>

                {commentsOpen ? (
                  <div className="border-t border-black/[0.06] bg-[#fafafa] px-4 py-4">
                    {commentLoading.has(post.id) ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#ffd1da] border-t-[#ff3b5c]" />
                      </div>
                    ) : comments.length > 0 ? (
                      <div className="space-y-3">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex items-start gap-2.5">
                            {comment.author_avatar_url ? (
                              <img
                                src={comment.author_avatar_url}
                                alt=""
                                className="h-8 w-8 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#ececef] text-[#96969b]">
                                <UserRound className="h-3.5 w-3.5" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1 rounded-[15px] bg-white px-3 py-2.5 ring-1 ring-black/[0.045]">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-[10px] font-black text-[#161823]">
                                  {comment.author_name}
                                </p>
                                {!comment.is_preloaded ? (
                                  <span className="shrink-0 text-[8px] text-[#aaaab0]">
                                    {commentTime(comment.created_at)}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-[#55555a]">
                                {comment.body}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-2 text-center text-[10px] font-semibold text-[#99999e]">
                        Sé el primero en comentar.
                      </p>
                    )}

                    <form
                      onSubmit={(event) => void submitComment(event, post.id)}
                      className="mt-4 flex items-end gap-2"
                    >
                      {currentAvatar ? (
                        <img
                          src={currentAvatar}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#ececef] text-[#96969b]">
                          <UserRound className="h-4 w-4" />
                        </div>
                      )}

                      <div className="flex min-h-10 min-w-0 flex-1 items-end rounded-[16px] bg-white px-3 py-2 ring-1 ring-black/[0.06]">
                        <textarea
                          value={drafts[post.id] ?? ""}
                          onChange={(event) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [post.id]: event.target.value,
                            }))
                          }
                          maxLength={500}
                          rows={1}
                          placeholder="Escribe un comentario..."
                          className="max-h-24 min-h-[22px] min-w-0 flex-1 resize-none bg-transparent text-[11px] leading-relaxed text-[#3f3f44] outline-none placeholder:text-[#b0b0b4]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={
                          commentSending.has(post.id) ||
                          !(drafts[post.id] ?? "").trim()
                        }
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ff3b5c] text-white shadow-[0_6px_14px_rgba(255,59,92,0.2)] transition active:scale-95 disabled:opacity-40"
                        aria-label="Publicar comentario"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </MembersLayout>
  );
}
