import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  TikPayLessonFeed,
  type TikPayLesson,
} from "@/components/members/TikPayLessonFeed";
import { useTikPayMemberState } from "@/hooks/use-tikpay-member-state";
import { fetchTikPayDailyVideos } from "@/lib/tikpay-video-api";
import { syncTikPayYouTubeMetadata } from "@/lib/tikpay-youtube-metadata.functions";

function fallbackCommentCount(externalId: string) {
  let hash = 0;
  for (let index = 0; index < externalId.length; index += 1) {
    hash = (hash * 31 + externalId.charCodeAt(index)) >>> 0;
  }

  return 12 + (hash % 137);
}

export const Route = createFileRoute("/module/start-here")({
  head: () => ({
    meta: [{ title: "Plan diario — Tik Pay" }],
  }),
  component: ModuleStartHerePage,
});

const fallbackLessons: TikPayLesson[] = [
  {
    id: "fallback-video-01",
    label: "Vídeo 01",
    title: "Mira el vídeo y completa tu recompensa",
    embedUrl:
      "https://player.mediadelivery.net/embed/660067/fa1ab74a-2f27-41bd-9eb0-b9a0c841caff?autoplay=false&preload=true",
  },
  {
    id: "fallback-video-02",
    label: "Vídeo 02",
    title: "Continúa viendo para aumentar tu saldo",
    embedUrl:
      "https://player.mediadelivery.net/embed/660067/8affa0f6-d379-4fc2-9a79-99d174390ed8?autoplay=false&preload=true",
  },
  {
    id: "fallback-video-03",
    label: "Vídeo 03",
    title: "Completa el último vídeo de hoy",
    embedUrl:
      "https://player.mediadelivery.net/embed/660067/2f7a09f3-3d38-4ec8-9ac6-f2864bdb8916?autoplay=false&preload=true",
  },
];

function ModuleStartHerePage() {
  const { state, loading: memberLoading } = useTikPayMemberState();
  const planDay = Math.max(1, Math.min(30, state?.member.activeDay ?? 1));
  const [lessons, setLessons] = useState<TikPayLesson[]>([]);
  const [videoLoading, setVideoLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadVideos() {
      setVideoLoading(true);

      try {
        const rows = await fetchTikPayDailyVideos(planDay);
        if (cancelled) return;

        if (rows.length >= 3) {
          let synced = [] as Awaited<
            ReturnType<typeof syncTikPayYouTubeMetadata>
          >;

          try {
            synced = await syncTikPayYouTubeMetadata({
              data: {
                videoIds: rows.slice(0, 3).map((row) => row.external_id),
              },
            });
          } catch (metadataError) {
            console.warn(
              "[Tik Pay] No se pudo actualizar metadata pública de YouTube:",
              metadataError,
            );
          }

          if (cancelled) return;

          const metadataById = new Map(
            synced.map((item) => [item.externalId, item] as const),
          );

          setLessons(
            rows.slice(0, 3).map((row) => {
              const metadata = metadataById.get(row.external_id);

              return {
                id: `day-${row.plan_day}-youtube-${row.external_id}`,
                label: `Vídeo ${String(row.video_index).padStart(2, "0")}`,
                title:
                  row.title || "Mira el vídeo y completa tu recompensa",
                embedUrl: row.embed_url,
                authorName:
                  metadata?.channelName ?? row.channel_name ?? null,
                authorAvatarUrl:
                  metadata?.channelAvatarUrl ??
                  row.channel_avatar_url ??
                  null,
                likesCount:
                  metadata?.likesCount ?? row.likes_count ?? null,
                commentsCount:
                  metadata?.commentsCount ??
                  row.comments_count ??
                  fallbackCommentCount(row.external_id),
              };
            }),
          );
        } else {
          setLessons(fallbackLessons);
        }
      } catch (error) {
        console.error("[Tik Pay] No se pudo cargar el catálogo de vídeos:", error);
        if (!cancelled) setLessons(fallbackLessons);
      } finally {
        if (!cancelled) setVideoLoading(false);
      }
    }

    if (!memberLoading) void loadVideos();

    return () => {
      cancelled = true;
    };
  }, [memberLoading, planDay]);

  const readyLessons = useMemo(
    () => (lessons.length >= 3 ? lessons : fallbackLessons),
    [lessons],
  );

  if (memberLoading || videoLoading) {
    return (
      <main className="grid h-[100dvh] w-full place-items-center bg-black font-sans text-white">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-white/20 border-t-[#ff3b5c]" />
          <p className="mt-3 text-[11px] font-black uppercase tracking-[0.08em] text-white/70">
            Cargando vídeos del día {planDay}
          </p>
        </div>
      </main>
    );
  }

  return <TikPayLessonFeed lessons={readyLessons} mode="daily" />;
}
