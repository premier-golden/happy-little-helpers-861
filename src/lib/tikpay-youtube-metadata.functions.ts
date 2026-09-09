import { createServerFn } from "@tanstack/react-start";

type SyncInput = {
  videoIds: string[];
};

type StoredMetadata = {
  external_id: string;
  channel_name: string | null;
  channel_url: string | null;
  channel_avatar_url: string | null;
  likes_count: number | null;
  comments_count: number | null;
  metadata_refreshed_at: string | null;
};

type YouTubeMetadata = {
  externalId: string;
  channelName: string | null;
  channelUrl: string | null;
  channelAvatarUrl: string | null;
  likesCount: number | null;
  commentsCount: number | null;
};

function serviceHeaders(key: string) {
  const headers = new Headers({
    "Content-Type": "application/json",
    apikey: key,
  });

  if (!key.startsWith("sb_secret_") && !key.startsWith("sb_publishable_")) {
    headers.set("Authorization", `Bearer ${key}`);
  }

  return headers;
}

function decodeJsonEscapes(value: string | null | undefined) {
  if (!value) return null;

  try {
    return JSON.parse(`"${value.replace(/"/g, '\"')}"`) as string;
  } catch {
    return value
      .replace(/\\u0026/g, "&")
      .replace(/\\u003d/g, "=")
      .replace(/\\\//g, "/");
  }
}

function parseHumanCount(raw: string | null | undefined) {
  if (!raw) return null;

  const value = raw
    .replace(/\\u00a0/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim()
    .toLowerCase();

  const directDigits = value.match(/\b(\d{1,18})\b/);
  if (directDigits && /^\d+$/.test(value.replace(/[^0-9]/g, ""))) {
    const direct = Number(value.replace(/[^0-9]/g, ""));
    return Number.isFinite(direct) ? direct : null;
  }

  const compact = value.match(/([\d.,]+)\s*(mil|m|mill[oó]n(?:es)?|k|b)?/i);
  if (!compact) return null;

  let numeric = compact[1].trim();
  const suffix = (compact[2] || "").toLowerCase();

  if (suffix) {
    if (numeric.includes(",") && numeric.includes(".")) {
      numeric =
        numeric.lastIndexOf(",") > numeric.lastIndexOf(".")
          ? numeric.replace(/\./g, "").replace(",", ".")
          : numeric.replace(/,/g, "");
    } else if (numeric.includes(",")) {
      numeric = numeric.replace(",", ".");
    }

    const base = Number(numeric);
    if (!Number.isFinite(base)) return null;

    if (suffix === "mil" || suffix === "k") return Math.round(base * 1_000);
    if (suffix === "m" || suffix.startsWith("mill")) return Math.round(base * 1_000_000);
    if (suffix === "b") return Math.round(base * 1_000_000_000);
  }

  const integer = Number(numeric.replace(/[.,\s]/g, ""));
  return Number.isFinite(integer) ? integer : null;
}

function firstCount(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;

    const parsed = parseHumanCount(match[1]);
    if (parsed !== null) return parsed;
  }

  return null;
}

function firstUrl(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeJsonEscapes(match[1]);
  }

  return null;
}


const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://yt.chocolatemoo53.com",
];

function normalizeRemoteUrl(baseUrl: string, value: string | null | undefined) {
  if (!value) return null;

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

async function fetchInvidiousMetadata(
  externalId: string,
): Promise<YouTubeMetadata | null> {
  for (const baseUrl of INVIDIOUS_INSTANCES) {
    try {
      const videoResponse = await fetch(
        `${baseUrl}/api/v1/videos/${encodeURIComponent(
          externalId,
        )}?hl=es&region=ES`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36",
          },
        },
      );

      if (!videoResponse.ok) continue;

      const video = (await videoResponse.json()) as {
        author?: string;
        authorUrl?: string;
        authorThumbnails?: Array<{
          url?: string;
          width?: number;
          height?: number;
        }>;
        likeCount?: number;
      };

      let commentsCount: number | null = null;

      try {
        const commentsResponse = await fetch(
          `${baseUrl}/api/v1/comments/${encodeURIComponent(
            externalId,
          )}?hl=es&source=youtube`,
          {
            headers: {
              Accept: "application/json",
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36",
            },
          },
        );

        if (commentsResponse.ok) {
          const comments = (await commentsResponse.json()) as {
            commentCount?: number;
          };
          commentsCount = Number.isFinite(Number(comments.commentCount))
            ? Number(comments.commentCount)
            : null;
        }
      } catch {
        // Los comentarios son opcionales; el resto de metadata sigue sirviendo.
      }

      const thumbnails = Array.isArray(video.authorThumbnails)
        ? video.authorThumbnails
        : [];

      const bestThumbnail =
        [...thumbnails].sort(
          (a, b) =>
            Number(b.width ?? 0) * Number(b.height ?? 0) -
            Number(a.width ?? 0) * Number(a.height ?? 0),
        )[0]?.url ?? null;

      return {
        externalId,
        channelName: video.author?.trim() || null,
        channelUrl: normalizeRemoteUrl(baseUrl, video.authorUrl),
        channelAvatarUrl: normalizeRemoteUrl(baseUrl, bestThumbnail),
        likesCount: Number.isFinite(Number(video.likeCount))
          ? Number(video.likeCount)
          : null,
        commentsCount,
      };
    } catch {
      // Prueba con la siguiente instancia pública.
    }
  }

  return null;
}

function mergeMetadata(
  primary: YouTubeMetadata,
  fallback: YouTubeMetadata | null,
): YouTubeMetadata {
  if (!fallback) return primary;

  return {
    externalId: primary.externalId,
    channelName: primary.channelName ?? fallback.channelName,
    channelUrl: primary.channelUrl ?? fallback.channelUrl,
    channelAvatarUrl:
      primary.channelAvatarUrl ?? fallback.channelAvatarUrl,
    likesCount: primary.likesCount ?? fallback.likesCount,
    commentsCount: primary.commentsCount ?? fallback.commentsCount,
  };
}

async function fetchDirectYouTubeMetadata(externalId: string): Promise<YouTubeMetadata> {
  const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(externalId)}&hl=es&gl=ES`;
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.7",
  };

  const [oembedResponse, watchResponse] = await Promise.all([
    fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${externalId}`,
      )}&format=json`,
      { headers },
    ).catch(() => null),
    fetch(watchUrl, { headers }).catch(() => null),
  ]);

  let channelName: string | null = null;
  let channelUrl: string | null = null;

  if (oembedResponse?.ok) {
    try {
      const data = (await oembedResponse.json()) as {
        author_name?: string;
        author_url?: string;
      };
      channelName = data.author_name?.trim() || null;
      channelUrl = data.author_url?.trim() || null;
    } catch {
      // Sigue con los metadatos disponibles en la página pública.
    }
  }

  const html = watchResponse?.ok ? await watchResponse.text() : "";

  const channelAvatarUrl = html
    ? firstUrl(html, [
        /"videoOwnerRenderer":\{[\s\S]{0,5000}?"thumbnails":\[\{"url":"([^"]+)"/i,
        /"avatar":\{"thumbnails":\[\{"url":"([^"]+)"/i,
      ])
    : null;

  let likesCount = html
    ? firstCount(html, [
        /"likeCount":"(\d+)"/i,
        /"likeCount":\{"simpleText":"([^"]+)"/i,
        /"accessibilityText":"([^"]*(?:Me gusta|likes)[^"]*)"/i,
        /"label":"([^"]*(?:Me gusta|likes)[^"]*)"/i,
      ])
    : null;

  let commentsCount = html
    ? firstCount(html, [
        /"commentCount":"(\d+)"/i,
        /"commentsCount":"(\d+)"/i,
        /"commentsHeaderRenderer":\{[\s\S]{0,2500}?"countText":\{"runs":\[\{"text":"([^"]+)"/i,
        /"commentsHeaderRenderer":\{[\s\S]{0,2500}?"simpleText":"([^"]+)"/i,
      ])
    : null;

  // Evita confundir "Me gusta" de botones genéricos con un contador.
  if (likesCount !== null && likesCount <= 1 && !/"likeCount":"\d+"/i.test(html)) {
    likesCount = null;
  }

  if (commentsCount !== null && commentsCount < 0) commentsCount = null;

  return {
    externalId,
    channelName,
    channelUrl,
    channelAvatarUrl,
    likesCount,
    commentsCount,
  };
}

async function fetchVideoMetadata(
  externalId: string,
): Promise<YouTubeMetadata> {
  let direct: YouTubeMetadata = {
    externalId,
    channelName: null,
    channelUrl: null,
    channelAvatarUrl: null,
    likesCount: null,
    commentsCount: null,
  };

  try {
    direct = await fetchDirectYouTubeMetadata(externalId);
  } catch {
    // Si YouTube bloquea la lectura directa, usa el fallback público.
  }

  const needsFallback =
    !direct.channelName ||
    !direct.channelAvatarUrl ||
    direct.likesCount === null ||
    direct.commentsCount === null;

  if (!needsFallback) return direct;

  const fallback = await fetchInvidiousMetadata(externalId);
  return mergeMetadata(direct, fallback);
}


async function readStoredMetadata(
  baseUrl: string,
  key: string,
  externalId: string,
): Promise<StoredMetadata | null> {
  const response = await fetch(
    `${baseUrl}/rest/v1/tikpay_daily_videos?select=external_id,channel_name,channel_url,channel_avatar_url,likes_count,comments_count,metadata_refreshed_at&external_id=eq.${encodeURIComponent(
      externalId,
    )}&limit=1`,
    { headers: serviceHeaders(key) },
  );

  if (!response.ok) return null;
  const rows = (await response.json()) as StoredMetadata[];
  return rows[0] ?? null;
}

function isFresh(value: string | null) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && Date.now() - time < 24 * 60 * 60 * 1000;
}

async function saveMetadata(
  baseUrl: string,
  key: string,
  metadata: YouTubeMetadata,
) {
  const response = await fetch(
    `${baseUrl}/rest/v1/tikpay_daily_videos?external_id=eq.${encodeURIComponent(
      metadata.externalId,
    )}`,
    {
      method: "PATCH",
      headers: serviceHeaders(key),
      body: JSON.stringify({
        channel_name: metadata.channelName,
        channel_url: metadata.channelUrl,
        channel_avatar_url: metadata.channelAvatarUrl,
        likes_count: metadata.likesCount,
        comments_count: metadata.commentsCount,
        metadata_refreshed_at: new Date().toISOString(),
      }),
    },
  );

  if (!response.ok) {
    console.error("[Tik Pay YouTube] No se pudo guardar metadata", {
      externalId: metadata.externalId,
      status: response.status,
    });
  }
}

export const syncTikPayYouTubeMetadata = createServerFn({ method: "POST" })
  .validator((input: SyncInput) => input)
  .handler(async ({ data }) => {
    "use server";

    const baseUrl = process.env["SUPABASE_URL"]?.replace(/\/$/, "");
    const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];

    if (!baseUrl || !key) {
      console.error("[Tik Pay YouTube] Supabase server environment is missing.");
      return [] as YouTubeMetadata[];
    }

    const videoIds = Array.from(
      new Set(
        (data.videoIds || [])
          .map((value) => String(value || "").trim())
          .filter((value) => /^[A-Za-z0-9_-]{6,20}$/.test(value)),
      ),
    ).slice(0, 6);

    const results: YouTubeMetadata[] = [];

    for (const externalId of videoIds) {
      const stored = await readStoredMetadata(baseUrl, key, externalId);

      const hasUsefulStoredMetadata = Boolean(
        stored?.channel_name ||
          stored?.channel_avatar_url ||
          stored?.likes_count !== null ||
          stored?.comments_count !== null,
      );

      if (
        stored &&
        hasUsefulStoredMetadata &&
        isFresh(stored.metadata_refreshed_at)
      ) {
        results.push({
          externalId,
          channelName: stored.channel_name,
          channelUrl: stored.channel_url,
          channelAvatarUrl: stored.channel_avatar_url,
          likesCount:
            stored.likes_count === null ? null : Number(stored.likes_count),
          commentsCount:
            stored.comments_count === null
              ? null
              : Number(stored.comments_count),
        });
        continue;
      }

      try {
        const metadata = await fetchVideoMetadata(externalId);
        await saveMetadata(baseUrl, key, metadata);
        results.push(metadata);
      } catch (error) {
        console.error("[Tik Pay YouTube] metadata fetch failed", {
          externalId,
          error: error instanceof Error ? error.message : String(error),
        });

        if (stored) {
          results.push({
            externalId,
            channelName: stored.channel_name,
            channelUrl: stored.channel_url,
            channelAvatarUrl: stored.channel_avatar_url,
            likesCount:
              stored.likes_count === null ? null : Number(stored.likes_count),
            commentsCount:
              stored.comments_count === null
                ? null
                : Number(stored.comments_count),
          });
        }
      }
    }

    return results;
  });
