import { tikPayAuthenticatedFetch } from "@/lib/tikpay-auth";

export type TikPayDailyVideo = {
  id: string;
  plan_day: number;
  video_index: number;
  external_id: string;
  title: string;
  category: string | null;
  context: string | null;
  source_url: string;
  embed_url: string;
  channel_name: string | null;
  channel_url: string | null;
  channel_avatar_url: string | null;
  likes_count: number | null;
  comments_count: number | null;
  metadata_refreshed_at: string | null;
};

export async function fetchTikPayDailyVideos(planDay: number) {
  const safeDay = Math.max(1, Math.min(30, Math.floor(planDay || 1)));
  const response = await tikPayAuthenticatedFetch(
    `tikpay_daily_videos?select=id,plan_day,video_index,external_id,title,category,context,source_url,embed_url,channel_name,channel_url,channel_avatar_url,likes_count,comments_count,metadata_refreshed_at&plan_day=eq.${safeDay}&is_active=eq.true&order=video_index.asc`,
  );

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(raw || "No se pudieron cargar los vídeos de hoy.");
  }

  const rows = (await response.json()) as Record<string, unknown>[];
  return rows.map(
    (row): TikPayDailyVideo => ({
      id: String(row.id ?? ""),
      plan_day: Number(row.plan_day ?? safeDay),
      video_index: Number(row.video_index ?? 1),
      external_id: String(row.external_id ?? ""),
      title: String(row.title ?? ""),
      category: row.category ? String(row.category) : null,
      context: row.context ? String(row.context) : null,
      source_url: String(row.source_url ?? ""),
      embed_url: String(row.embed_url ?? ""),
      channel_name: row.channel_name ? String(row.channel_name) : null,
      channel_url: row.channel_url ? String(row.channel_url) : null,
      channel_avatar_url: row.channel_avatar_url
        ? String(row.channel_avatar_url)
        : null,
      likes_count:
        row.likes_count === null || row.likes_count === undefined
          ? null
          : Number(row.likes_count),
      comments_count:
        row.comments_count === null || row.comments_count === undefined
          ? null
          : Number(row.comments_count),
      metadata_refreshed_at: row.metadata_refreshed_at
        ? String(row.metadata_refreshed_at)
        : null,
    }),
  );
}
