import { tikPayAuthenticatedFetch } from "@/lib/tikpay-auth";

export type TikPayCommunityComment = {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  author_avatar_url: string | null;
  body: string;
  created_at: string;
  is_preloaded: boolean;
};

export type TikPayCommunityPost = {
  id: string;
  author_name: string;
  author_handle: string | null;
  author_avatar_url: string | null;
  body: string;
  likes_count: number;
  comments_count: number;
  posted_at: string;
  sort_order: number;
  is_active: boolean;
  is_seed_demo: boolean;
};

type CommunityPostInput = {
  authorName: string;
  authorHandle?: string;
  authorAvatarUrl?: string;
  body: string;
  likesCount?: number;
  commentsCount?: number;
  sortOrder?: number;
  isActive?: boolean;
  isSeedDemo?: boolean;
};

async function parseError(response: Response) {
  const raw = await response.text();
  try {
    const parsed = JSON.parse(raw) as { message?: string; details?: string; hint?: string; code?: string };
    return parsed.message || parsed.details || parsed.hint || parsed.code || raw;
  } catch {
    return raw;
  }
}

function normalize(row: Record<string, unknown>): TikPayCommunityPost {
  return {
    id: String(row.id ?? ""),
    author_name: String(row.author_name ?? ""),
    author_handle: row.author_handle ? String(row.author_handle) : null,
    author_avatar_url: row.author_avatar_url ? String(row.author_avatar_url) : null,
    body: String(row.body ?? ""),
    likes_count: Number(row.likes_count ?? 0),
    comments_count: Number(row.comments_count ?? 0),
    posted_at: String(row.posted_at ?? ""),
    sort_order: Number(row.sort_order ?? 0),
    is_active: Boolean(row.is_active),
    is_seed_demo: Boolean(row.is_seed_demo),
  };
}

const SELECT =
  "id,author_name,author_handle,author_avatar_url,body,likes_count,comments_count,posted_at,sort_order,is_active,is_seed_demo";

export async function fetchTikPayCommunityPosts() {
  const response = await tikPayAuthenticatedFetch(
    `tikpay_community_posts?select=${SELECT}&is_active=eq.true&order=sort_order.asc,posted_at.desc`,
  );

  if (!response.ok) throw new Error(await parseError(response));
  const rows = (await response.json()) as Record<string, unknown>[];
  return rows.map(normalize);
}

export async function fetchTikPayCommunityPostsAdmin() {
  const response = await tikPayAuthenticatedFetch(
    `tikpay_community_posts?select=${SELECT}&order=sort_order.asc,posted_at.desc`,
  );

  if (!response.ok) throw new Error(await parseError(response));
  const rows = (await response.json()) as Record<string, unknown>[];
  return rows.map(normalize);
}

function payload(input: CommunityPostInput) {
  return {
    author_name: input.authorName.trim(),
    author_handle: input.authorHandle?.trim() || null,
    author_avatar_url: input.authorAvatarUrl?.trim() || null,
    body: input.body.trim(),
    likes_count: Math.max(0, Math.floor(input.likesCount ?? 0)),
    comments_count: Math.max(0, Math.floor(input.commentsCount ?? 0)),
    sort_order: Math.floor(input.sortOrder ?? 0),
    is_active: input.isActive ?? true,
    is_seed_demo: input.isSeedDemo ?? true,
  };
}

export async function createTikPayCommunityPost(input: CommunityPostInput) {
  const response = await tikPayAuthenticatedFetch(
    "tikpay_community_posts?select=" + SELECT,
    {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload(input)),
    },
  );

  if (!response.ok) throw new Error(await parseError(response));
  const rows = (await response.json()) as Record<string, unknown>[];
  return rows[0] ? normalize(rows[0]) : null;
}

export async function updateTikPayCommunityPost(id: string, input: CommunityPostInput) {
  const response = await tikPayAuthenticatedFetch(
    `tikpay_community_posts?id=eq.${encodeURIComponent(id)}&select=${SELECT}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload(input)),
    },
  );

  if (!response.ok) throw new Error(await parseError(response));
  const rows = (await response.json()) as Record<string, unknown>[];
  return rows[0] ? normalize(rows[0]) : null;
}

export async function deleteTikPayCommunityPost(id: string) {
  const response = await tikPayAuthenticatedFetch(
    `tikpay_community_posts?id=eq.${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );

  if (!response.ok) throw new Error(await parseError(response));
}


export async function fetchTikPayCommunityLikedPostIds() {
  const response = await tikPayAuthenticatedFetch(
    "tikpay_community_likes?select=post_id",
  );

  if (!response.ok) throw new Error(await parseError(response));
  const rows = (await response.json()) as { post_id?: string }[];
  return rows
    .map((row) => row.post_id)
    .filter((value): value is string => Boolean(value));
}

export async function toggleTikPayCommunityLike(postId: string) {
  const response = await tikPayAuthenticatedFetch(
    "rpc/toggle_tikpay_community_like",
    {
      method: "POST",
      body: JSON.stringify({ p_post_id: postId }),
    },
  );

  if (!response.ok) throw new Error(await parseError(response));
  const result = (await response.json()) as {
    liked?: boolean;
    likes_count?: number;
  };

  return {
    liked: Boolean(result.liked),
    likesCount: Number(result.likes_count ?? 0),
  };
}

export async function fetchTikPayCommunityComments(postId: string) {
  const response = await tikPayAuthenticatedFetch(
    `tikpay_community_comments?select=id,post_id,user_id,author_name,author_avatar_url,body,created_at,is_preloaded&post_id=eq.${encodeURIComponent(postId)}&order=created_at.asc&limit=100`,
  );

  if (!response.ok) throw new Error(await parseError(response));
  const rows = (await response.json()) as Record<string, unknown>[];

  return rows.map(
    (row): TikPayCommunityComment => ({
      id: String(row.id ?? ""),
      post_id: String(row.post_id ?? ""),
      user_id: String(row.user_id ?? ""),
      author_name: String(row.author_name ?? "Miembro Tik Pay"),
      author_avatar_url: row.author_avatar_url
        ? String(row.author_avatar_url)
        : null,
      body: String(row.body ?? ""),
      created_at: String(row.created_at ?? ""),
      is_preloaded: Boolean(row.is_preloaded),
    }),
  );
}

export async function createTikPayCommunityComment(
  postId: string,
  body: string,
) {
  const response = await tikPayAuthenticatedFetch(
    "rpc/create_tikpay_community_comment",
    {
      method: "POST",
      body: JSON.stringify({
        p_post_id: postId,
        p_body: body,
      }),
    },
  );

  if (!response.ok) throw new Error(await parseError(response));
  const result = (await response.json()) as {
    comment?: Record<string, unknown>;
    comments_count?: number;
  };

  const row = result.comment ?? {};
  const comment: TikPayCommunityComment = {
    id: String(row.id ?? ""),
    post_id: String(row.post_id ?? postId),
    user_id: String(row.user_id ?? ""),
    author_name: String(row.author_name ?? "Miembro Tik Pay"),
    author_avatar_url: row.author_avatar_url
      ? String(row.author_avatar_url)
      : null,
    body: String(row.body ?? body),
    created_at: String(row.created_at ?? new Date().toISOString()),
    is_preloaded: false,
  };

  return {
    comment,
    commentsCount: Number(result.comments_count ?? 0),
  };
}

export async function deleteTikPayCommunityComment(commentId: string) {
  const response = await tikPayAuthenticatedFetch(
    "rpc/delete_tikpay_community_comment",
    {
      method: "POST",
      body: JSON.stringify({ p_comment_id: commentId }),
    },
  );

  if (!response.ok) throw new Error(await parseError(response));
  const count = await response.json();
  return Number(count ?? 0);
}
