import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bookmark,
  Check,
  Heart,
  MessageCircle,
  Plus,
  Search,
  Share2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  addTikPayRewardOnce,
  formatTikPayBalance,
  hasTikPayRewardClaimed,
  markTikPayRewardClaimed,
  readTikPayBalance,
  syncTikPayBalance,
} from "@/lib/members-balance";
import {
  buildTikPayRewardPlan,
  getPlanDayFromStartDate,
  rewardIdForVideo,
  TIK_PAY_VIDEOS_PER_DAY,
} from "@/lib/reward-plan";
import { getOrCreateTikPayMemberId } from "@/lib/tikpay-member-id";
import {
  claimTikPayVideoReward,
  getTikPayMemberState,
  saveTikPayVideoProgress,
} from "@/lib/tikpay-progress.functions";

type PlayerJsTimeUpdate = {
  seconds?: number;
  duration?: number;
  percent?: number;
};

type PlayerJsInstance = {
  on: (event: string, callback: (data?: PlayerJsTimeUpdate) => void) => void;
  off?: (event: string, callback?: (data?: PlayerJsTimeUpdate) => void) => void;
};

type PlayerJsGlobal = {
  Player: new (element: HTMLIFrameElement) => PlayerJsInstance;
};

type YouTubePlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  mute: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
};

type YouTubePlayerEvent = {
  data: number;
  target: YouTubePlayer;
};

type YouTubeGlobal = {
  Player: new (
    element: HTMLIFrameElement,
    options: {
      events: {
        onReady: (event: { target: YouTubePlayer }) => void;
        onStateChange: (event: YouTubePlayerEvent) => void;
      };
    },
  ) => YouTubePlayer;
  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
  };
};

declare global {
  interface Window {
    playerjs?: PlayerJsGlobal;
    __tikPayPlayerJsPromise?: Promise<PlayerJsGlobal>;
    YT?: YouTubeGlobal;
    onYouTubeIframeAPIReady?: () => void;
    __tikPayYouTubePromise?: Promise<YouTubeGlobal>;
  }
}

function loadPlayerJs(): Promise<PlayerJsGlobal> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.playerjs?.Player) return Promise.resolve(window.playerjs);
  if (window.__tikPayPlayerJsPromise) return window.__tikPayPlayerJsPromise;

  window.__tikPayPlayerJsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-tikpay-playerjs]");

    const finish = () => {
      if (window.playerjs?.Player) resolve(window.playerjs);
      else reject(new Error("Player.js no se inicializó"));
    };

    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar Player.js")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js";
    script.async = true;
    script.dataset.tikpayPlayerjs = "true";
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", () => reject(new Error("No se pudo cargar Player.js")), { once: true });
    document.head.appendChild(script);
  });

  return window.__tikPayPlayerJsPromise;
}

function loadYouTubeApi(): Promise<YouTubeGlobal> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (window.__tikPayYouTubePromise) return window.__tikPayYouTubePromise;

  window.__tikPayYouTubePromise = new Promise((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube IFrame API no se inicializó"));
    };

    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-tikpay-youtube-api]",
    );

    if (existing) return;

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.dataset.tikpayYoutubeApi = "true";
    script.addEventListener(
      "error",
      () => reject(new Error("No se pudo cargar YouTube IFrame API")),
      { once: true },
    );
    document.head.appendChild(script);
  });

  return window.__tikPayYouTubePromise;
}

function isYouTubeEmbed(embedUrl: string) {
  try {
    const url = new URL(embedUrl);
    return (
      url.hostname.includes("youtube.com") ||
      url.hostname.includes("youtube-nocookie.com")
    );
  } catch {
    return false;
  }
}

function youtubePosterUrl(embedUrl: string) {
  try {
    const url = new URL(embedUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    const embedIndex = parts.indexOf("embed");
    const videoId = embedIndex >= 0 ? parts[embedIndex + 1] : "";
    return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "";
  } catch {
    return "";
  }
}

function formatSocialCount(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "";

  return new Intl.NumberFormat("es-ES", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Math.max(0, value));
}

export type TikPayLesson = {
  id: string;
  label: string;
  title: string;
  embedUrl: string;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  likesCount?: number | null;
  commentsCount?: number | null;
};

type Props = {
  lessons: TikPayLesson[];
  mode?: "daily" | "static";
};


const PROGRESS_PREFIX = "tikpay:lesson-progress:";
const LIKE_PREFIX = "tikpay:lesson-like:";
const SAVE_PREFIX = "tikpay:lesson-save:";
const FOLLOW_KEY = "tikpay:members-following";
const TIK_PAY_COIN = "data:image/webp;base64,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";

function progressKey(day: number, lessonId: string) {
  return `${PROGRESS_PREFIX}day-${day}:${lessonId}`;
}

function readProgress(day: number, id: string) {
  try {
    const value = Number(window.localStorage.getItem(progressKey(day, id)) ?? 0);
    return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  } catch {
    return 0;
  }
}

function writeProgress(day: number, id: string, value: number) {
  try {
    window.localStorage.setItem(progressKey(day, id), String(value));
  } catch {
    // Mantém a experiência funcional mesmo sem persistência.
  }
}

function readBoolean(key: string) {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeBoolean(key: string, value: boolean) {
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
  } catch {
    // Mantém o estado apenas durante a sessão.
  }
}

function lessonPlayerUrl(embedUrl: string, active: boolean) {
  try {
    const url = new URL(embedUrl);

    if (
      url.hostname.includes("youtube.com") ||
      url.hostname.includes("youtube-nocookie.com")
    ) {
      url.hostname = "www.youtube-nocookie.com";
      url.searchParams.set("enablejsapi", "1");
      url.searchParams.set("playsinline", "1");
      url.searchParams.set("rel", "0");
      url.searchParams.set("controls", "0");
      url.searchParams.set("fs", "0");
      url.searchParams.set("disablekb", "1");
      url.searchParams.set("iv_load_policy", "3");
      url.searchParams.set("cc_load_policy", "0");
      url.searchParams.set("autoplay", active ? "1" : "0");
      url.searchParams.set("mute", "1");

      if (typeof window !== "undefined" && window.location.origin) {
        url.searchParams.set("origin", window.location.origin);
      }

      return url.toString();
    }

    url.searchParams.set("autoplay", active ? "true" : "false");
    url.searchParams.set("muted", "true");
    url.searchParams.set("preload", active ? "true" : "false");
    url.searchParams.set("responsive", "true");
    url.searchParams.set("controls", "false");
    return url.toString();
  } catch {
    return embedUrl;
  }
}

function playRewardSound() {
  try {
    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) return;

    const context = new AudioContextCtor();
    void context.resume();

    const now = context.currentTime;
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
    master.connect(context.destination);

    [880, 1174.66, 1567.98].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + index * 0.08;

      oscillator.type = index === 2 ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(index === 2 ? 0.16 : 0.11, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);

      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start);
      oscillator.stop(start + 0.26);
    });

    window.setTimeout(() => void context.close(), 900);
  } catch {
    // O áudio de recompensa é decorativo; falhas não interrompem o fluxo.
  }
}

export function TikPayLessonFeed({ lessons, mode = "daily" }: Props) {
  const rewardsEnabled = mode === "daily";

  const scrollerRef = useRef<HTMLDivElement>(null);
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
  const activePlayerCleanupRef = useRef<(() => void) | null>(null);
  const finishHandledRef = useRef(new Set<string>());
  const memberIdRef = useRef<string | null>(null);
  const lastServerProgressBucketRef = useRef<Record<string, number>>({});
  const balanceRef = useRef(readTikPayBalance());
  const rewardAnimationFrameRef = useRef<number | null>(null);
  const rewardPlan = useMemo(() => buildTikPayRewardPlan(), []);
  const [planDay, setPlanDay] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [playbackProgress, setPlaybackProgress] = useState<Record<string, number>>({});
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [claimedByLesson, setClaimedByLesson] = useState<Record<string, boolean>>({});
  const [followed, setFollowed] = useState(false);
  const [rewardFlash, setRewardFlash] = useState<number | null>(null);
  const [rewardBurst, setRewardBurst] = useState(false);
  const [balance, setBalance] = useState(() => readTikPayBalance());
  const [claimingLessonId, setClaimingLessonId] = useState<string | null>(null);
  const [playerLoaded, setPlayerLoaded] = useState<Record<string, boolean>>({});

  const dayConfig = rewardPlan[planDay - 1] ?? rewardPlan[0];
  const visibleLessons = lessons.slice(0, TIK_PAY_VIDEOS_PER_DAY);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      const memberId = getOrCreateTikPayMemberId();
      if (!memberId) return;
      memberIdRef.current = memberId;

      const nextLiked: Record<string, boolean> = {};
      const nextSaved: Record<string, boolean> = {};
      visibleLessons.forEach((lesson) => {
        nextLiked[lesson.id] = readBoolean(`${LIKE_PREFIX}${lesson.id}`);
        nextSaved[lesson.id] = readBoolean(`${SAVE_PREFIX}${lesson.id}`);
      });
      setLiked(nextLiked);
      setSaved(nextSaved);
      setFollowed(readBoolean(FOLLOW_KEY));
      setBalance(readTikPayBalance());

      try {
        // Migra recompensas locais antigas para o banco, de forma idempotente.
        const localDayGuess = Math.max(1, planDay);
        const localConfig = rewardPlan[localDayGuess - 1] ?? rewardPlan[0];
        if (localConfig) {
          await Promise.all(
            visibleLessons.map((lesson, index) => {
              const rewardId = rewardIdForVideo(localDayGuess, index + 1);
              if (!hasTikPayRewardClaimed(rewardId)) return Promise.resolve(null);

              return claimTikPayVideoReward({
                data: {
                  memberId,
                  planDay: localDayGuess,
                  videoIndex: index + 1,
                  reward: localConfig.videoRewards[index] ?? 0,
                },
              });
            }),
          );
        }

        const state = await getTikPayMemberState({ data: { memberId } });
        if (cancelled) return;

        const currentDay = getPlanDayFromStartDate(state.member.planStartedOn);
        setPlanDay(currentDay);
        setBalance(state.member.balance);
        syncTikPayBalance(state.member.balance);

        const nextProgress: Record<string, number> = {};
        const nextPlaybackProgress: Record<string, number> = {};
        const nextClaimed: Record<string, boolean> = {};

        visibleLessons.forEach((lesson, index) => {
          const remote = state.progress.find(
            (row) => row.planDay === currentDay && row.videoIndex === index + 1,
          );
          const local = readProgress(currentDay, lesson.id);
          const watched = Math.max(local, remote?.progress ?? 0);

          nextProgress[lesson.id] = watched;
          nextPlaybackProgress[lesson.id] = watched;
          nextClaimed[lesson.id] =
            Boolean(remote?.rewardClaimed) ||
            hasTikPayRewardClaimed(rewardIdForVideo(currentDay, index + 1));

          lastServerProgressBucketRef.current[lesson.id] =
            Math.floor((remote?.progress ?? 0) / 5) * 5;
        });

        setProgress(nextProgress);
        setPlaybackProgress(nextPlaybackProgress);
        setClaimedByLesson(nextClaimed);
      } catch (error) {
        console.error("[Tik Pay] No se pudo cargar el progreso del banco:", error);

        const fallbackDay = planDay;
        const nextProgress: Record<string, number> = {};
        const nextClaimed: Record<string, boolean> = {};

        visibleLessons.forEach((lesson, index) => {
          nextProgress[lesson.id] = readProgress(fallbackDay, lesson.id);
          nextClaimed[lesson.id] = hasTikPayRewardClaimed(
            rewardIdForVideo(fallbackDay, index + 1),
          );
        });

        setProgress(nextProgress);
        setPlaybackProgress(nextProgress);
        setClaimedByLesson(nextClaimed);
      }
    }

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [lessons, rewardPlan]);

  useEffect(() => {
    const origins = [
      "https://www.youtube-nocookie.com",
      "https://www.youtube.com",
      "https://i.ytimg.com",
      "https://www.googlevideo.com",
    ];

    const created: HTMLLinkElement[] = [];

    origins.forEach((href) => {
      if (document.head.querySelector(`link[data-tikpay-preconnect="${href}"]`)) return;

      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = href;
      link.crossOrigin = "anonymous";
      link.dataset.tikpayPreconnect = href;
      document.head.appendChild(link);
      created.push(link);
    });

    return () => {
      created.forEach((link) => link.remove());
    };
  }, []);

  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  useEffect(() => {
    const syncFromStorage = () => {
      const next = readTikPayBalance();
      balanceRef.current = next;
      setBalance(next);
    };

    window.addEventListener("storage", syncFromStorage);

    return () => {
      window.removeEventListener("storage", syncFromStorage);
      if (rewardAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(rewardAnimationFrameRef.current);
      }
    };
  }, []);

  function animateBalanceTo(nextBalance: number, amount: number) {
    if (rewardAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(rewardAnimationFrameRef.current);
    }

    const startBalance = balanceRef.current;
    const target = Math.round(nextBalance * 100) / 100;
    const duration = 1050;
    const startedAt = performance.now();

    setRewardBurst(true);
    setRewardFlash(amount);
    playRewardSound();

    const tick = (now: number) => {
      const elapsed = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      const current =
        Math.round((startBalance + (target - startBalance) * eased) * 100) / 100;

      balanceRef.current = current;
      setBalance(current);

      if (elapsed < 1) {
        rewardAnimationFrameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      balanceRef.current = target;
      setBalance(target);
      rewardAnimationFrameRef.current = null;

      window.setTimeout(() => setRewardBurst(false), 450);
      window.setTimeout(() => setRewardFlash(null), 900);
    };

    rewardAnimationFrameRef.current = window.requestAnimationFrame(tick);
  }


  useEffect(() => {
    const lesson = visibleLessons[activeIndex];
    const iframe = lesson ? iframeRefs.current[lesson.id] : null;
    if (!lesson || !iframe) return;

    let cancelled = false;
    let youtubeProgressTimer: number | null = null;

    activePlayerCleanupRef.current?.();
    activePlayerCleanupRef.current = null;

    const reportProgress = (next: number) => {
      const clamped = Math.max(0, Math.min(100, next));

      setPlaybackProgress((state) => ({
        ...state,
        [lesson.id]: clamped,
      }));

      setProgress((state) => {
        const previous = state[lesson.id] ?? 0;
        const watched = Math.max(previous, clamped);

        if (Math.floor(watched) !== Math.floor(previous)) {
          writeProgress(planDay, lesson.id, watched);

          const bucket = Math.floor(watched / 5) * 5;
          const memberId = memberIdRef.current;
          const previousBucket =
            lastServerProgressBucketRef.current[lesson.id] ?? 0;

          if (memberId && bucket >= previousBucket + 5) {
            lastServerProgressBucketRef.current[lesson.id] = bucket;

            void saveTikPayVideoProgress({
              data: {
                memberId,
                planDay,
                videoIndex: activeIndex + 1,
                progress: watched,
              },
            }).catch((error) => {
              console.error(
                "[Tik Pay] No se pudo guardar el progreso:",
                error,
              );
            });
          }
        }

        return watched === previous
          ? state
          : { ...state, [lesson.id]: watched };
      });

    };

    const handleEnded = () => {
      reportProgress(100);
    };

    if (isYouTubeEmbed(lesson.embedUrl)) {
      void loadYouTubeApi()
        .then((youtube) => {
          if (cancelled) return;

          const startProgressTimer = (player: YouTubePlayer) => {
            if (youtubeProgressTimer !== null) {
              window.clearInterval(youtubeProgressTimer);
            }

            youtubeProgressTimer = window.setInterval(() => {
              const duration = Number(player.getDuration?.() ?? 0);
              const currentTime = Number(player.getCurrentTime?.() ?? 0);

              if (duration > 0 && Number.isFinite(currentTime)) {
                if (currentTime > 0.08) {
                  setPlayerLoaded((state) =>
                    state[lesson.id]
                      ? state
                      : { ...state, [lesson.id]: true },
                  );
                }

                reportProgress((currentTime / duration) * 100);
              }
            }, 250);
          };

          const player = new youtube.Player(iframe, {
            events: {
              onReady: (event) => {
                event.target.mute();
                event.target.playVideo();
                startProgressTimer(event.target);
              },
              onStateChange: (event) => {
                if (event.data === youtube.PlayerState.ENDED) {
                  handleEnded();
                }
              },
            },
          });

          activePlayerCleanupRef.current = () => {
            if (youtubeProgressTimer !== null) {
              window.clearInterval(youtubeProgressTimer);
              youtubeProgressTimer = null;
            }

            try {
              player.pauseVideo();
            } catch {
              // Mantém o swipe funcional mesmo se o player já tiver sido removido.
            }
          };
        })
        .catch((error) => {
          console.error("[Tik Pay] No se pudo inicializar YouTube:", error);
        });
    } else {
      void loadPlayerJs()
        .then((playerjs) => {
          if (cancelled) return;

          const player = new playerjs.Player(iframe);

          const handleTimeUpdate = (data?: PlayerJsTimeUpdate) => {
            const duration = Number(data?.duration ?? 0);
            const seconds = Number(data?.seconds ?? 0);
            const providedPercent = Number(data?.percent);

            let next = 0;

            if (Number.isFinite(providedPercent) && providedPercent >= 0) {
              next =
                providedPercent <= 1
                  ? providedPercent * 100
                  : providedPercent;
            } else if (duration > 0 && Number.isFinite(seconds)) {
              next = (seconds / duration) * 100;
            }

            reportProgress(next);
          };

          player.on("timeupdate", handleTimeUpdate);
          player.on("ended", handleEnded);

          activePlayerCleanupRef.current = () => {
            player.off?.("timeupdate", handleTimeUpdate);
            player.off?.("ended", handleEnded);
          };
        })
        .catch(() => {
          // Se Player.js falhar, o vídeo continua reproduzindo normalmente.
        });
    }

    return () => {
      cancelled = true;

      if (youtubeProgressTimer !== null) {
        window.clearInterval(youtubeProgressTimer);
      }

      activePlayerCleanupRef.current?.();
      activePlayerCleanupRef.current = null;
    };
  }, [
    activeIndex,
    planDay,
    visibleLessons.map((lesson) => lesson.id).join("|"),
  ]);

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollTop / el.clientHeight);
    setActiveIndex(Math.max(0, Math.min(index, visibleLessons.length - 1)));
  }

  async function completeLesson(lesson: TikPayLesson, videoIndex: number) {
    const rewardId = rewardIdForVideo(planDay, videoIndex + 1);
    const reward = dayConfig.videoRewards[videoIndex] ?? 0;

    if ((playbackProgress[lesson.id] ?? 0) < 99.5) {
      return false;
    }

    setClaimingLessonId(lesson.id);
    setProgress((state) => ({ ...state, [lesson.id]: 100 }));
    setPlaybackProgress((state) => ({ ...state, [lesson.id]: 100 }));
    writeProgress(planDay, lesson.id, 100);

    const memberId = memberIdRef.current;

    if (memberId && rewardsEnabled) {
      try {
        const result = await claimTikPayVideoReward({
          data: {
            memberId,
            planDay,
            videoIndex: videoIndex + 1,
            reward,
          },
        });

        markTikPayRewardClaimed(rewardId);
        setClaimedByLesson((state) => ({ ...state, [lesson.id]: true }));

        if (result.added) {
          animateBalanceTo(
            result.balance,
            result.rewardAmount || reward,
          );
        } else {
          balanceRef.current = result.balance;
          setBalance(result.balance);
        }

        setClaimingLessonId(null);
        return result.added;
      } catch (error) {
        console.error(
          "[Tik Pay] No se pudo confirmar la recompensa en el banco:",
          error,
        );
      }
    }

    const result = addTikPayRewardOnce(rewardId, reward);
    setClaimedByLesson((state) => ({ ...state, [lesson.id]: true }));

    if (result.added) {
      animateBalanceTo(result.balance, reward);
    } else {
      balanceRef.current = result.balance;
      setBalance(result.balance);
    }

    setClaimingLessonId(null);
    return result.added;
  }

  async function finishLesson(lesson: TikPayLesson, videoIndex: number) {
    if ((playbackProgress[lesson.id] ?? 0) < 99.5) return;

    const finishKey = `${planDay}:${lesson.id}`;
    if (finishHandledRef.current.has(finishKey)) return;
    finishHandledRef.current.add(finishKey);

    try {
      await completeLesson(lesson, videoIndex);
    } catch {
      finishHandledRef.current.delete(finishKey);
      setClaimingLessonId(null);
      return;
    }

    window.setTimeout(() => {
      const scroller = scrollerRef.current;
      const hasNext = videoIndex < visibleLessons.length - 1;

      if (hasNext && scroller) {
        scroller.scrollTo({
          top: (videoIndex + 1) * scroller.clientHeight,
          behavior: "smooth",
        });
        return;
      }

      window.location.assign("/members");
    }, 1450);
  }

  function toggleLike(lessonId: string) {
    const next = !liked[lessonId];
    setLiked((state) => ({ ...state, [lessonId]: next }));
    writeBoolean(`${LIKE_PREFIX}${lessonId}`, next);
  }

  function toggleSaved(lessonId: string) {
    const next = !saved[lessonId];
    setSaved((state) => ({ ...state, [lessonId]: next }));
    writeBoolean(`${SAVE_PREFIX}${lessonId}`, next);
  }

  function toggleFollow() {
    const next = !followed;
    setFollowed(next);
    writeBoolean(FOLLOW_KEY, next);
  }

  async function shareLesson(lesson: TikPayLesson) {
    const shareData = {
      title: lesson.title,
      text: "Mira esta clase en Tik Pay",
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // O usuário pode cancelar o compartilhamento.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Sem clipboard, não interrompe o vídeo.
    }
  }

  return (
    <main className="h-[100dvh] w-full overflow-hidden bg-black font-sans text-white">
      <style>{`
        @keyframes tpRewardCoinRise {
          0% {
            opacity: 0;
            transform: translate3d(0, 8px, 0) scale(.72) rotate(0deg);
          }
          18% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate3d(var(--tp-x, 0px), -76px, 0) scale(1.05) rotate(220deg);
          }
        }

        .tp-reward-coin-rise {
          animation: tpRewardCoinRise 900ms cubic-bezier(.2,.7,.2,1) both;
        }
      `}</style>
      <div className="relative mx-auto h-full w-full max-w-[430px] overflow-hidden bg-black">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-28 bg-gradient-to-b from-black/75 via-black/20 to-transparent" />

        <Link
          to="/members"
          className="absolute left-3 z-50 grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md active:scale-95"
          style={{ top: "calc(12px + env(safe-area-inset-top, 0px))" }}
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.6} />
        </Link>

        <div
          className="absolute left-1/2 z-40 flex -translate-x-1/2 items-center gap-4"
          style={{ top: "calc(16px + env(safe-area-inset-top, 0px))" }}
        >
          <button
            type="button"
            className="relative min-h-8 px-1 text-[14px] font-bold text-white/60 drop-shadow-md"
            aria-label="Siguiendo"
          >
            Siguiendo
          </button>
          <button
            type="button"
            className="relative min-h-8 px-1 text-[14px] font-black text-white drop-shadow-md"
            aria-label="Para ti"
          >
            Para ti
            <span className="absolute -bottom-0.5 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-white" />
          </button>
        </div>

        <button
          type="button"
          className="absolute right-3 z-50 grid h-10 w-10 place-items-center rounded-full bg-black/25 text-white backdrop-blur-sm active:scale-95"
          style={{ top: "calc(12px + env(safe-area-inset-top, 0px))" }}
          aria-label="Buscar"
        >
          <Search className="h-[22px] w-[22px]" strokeWidth={2.6} />
        </button>

        {rewardFlash !== null ? (
          <div
            className="pointer-events-none absolute left-1/2 z-[70] -translate-x-1/2 whitespace-nowrap rounded-full bg-[#159447] px-4 py-2.5 text-[11px] font-black text-white shadow-[0_10px_30px_rgba(21,148,71,0.28)]"
            style={{ top: "calc(62px + env(safe-area-inset-top, 0px))" }}
          >
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
              +{formatTikPayBalance(rewardFlash)} añadido a tu saldo
            </span>
          </div>
        ) : null}

        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="h-full w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain"
          style={{ scrollbarWidth: "none" }}
        >
          {visibleLessons.map((lesson, index) => {
            const claimed =
              Boolean(claimedByLesson[lesson.id]) ||
              hasTikPayRewardClaimed(rewardIdForVideo(planDay, index + 1));
            const videoProgress = playbackProgress[lesson.id] ?? 0;
            const readyToClaim = videoProgress >= 99.5;
            const claiming = claimingLessonId === lesson.id;
            const isLiked = Boolean(liked[lesson.id]);
            const isSaved = Boolean(saved[lesson.id]);
            const isYouTube = isYouTubeEmbed(lesson.embedUrl);
            const shouldMountPlayer =
              !isYouTube ||
              index === activeIndex ||
              index === activeIndex + 1;
            const posterUrl = isYouTube ? youtubePosterUrl(lesson.embedUrl) : "";
            const hasLoaded = Boolean(playerLoaded[lesson.id]);

            return (
              <section key={lesson.id} className="relative h-full w-full snap-start overflow-hidden bg-black">
                <div className="absolute inset-0 overflow-hidden bg-black">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt=""
                      aria-hidden="true"
                      className={
                        "pointer-events-none absolute inset-0 z-[2] h-full w-full object-cover " +
                        (hasLoaded ? "invisible opacity-0" : "visible opacity-100")
                      }
                    />
                  ) : null}

                  {shouldMountPlayer ? (
                    <iframe
                      ref={(node) => {
                        iframeRefs.current[lesson.id] = node;
                      }}
                      src={lessonPlayerUrl(lesson.embedUrl, index === activeIndex)}
                      title={lesson.title}
                      loading="eager"
                      allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                      allowFullScreen={false}
                      className="absolute left-1/2 top-1/2 z-[1] h-full max-w-none -translate-x-1/2 -translate-y-1/2 border-0 bg-black"
                      style={{ width: "max(100%, calc(100dvh * 16 / 9))" }}
                    />
                  ) : null}

                  {/* Escudo visual: cobre a faixa de controles nativa do embed sem afetar o vídeo. */}
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[76px] bg-gradient-to-t from-black via-black/92 to-transparent"
                    aria-hidden="true"
                  />
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-56 bg-gradient-to-t from-black/82 via-black/34 to-transparent" />

                <div
                  className="absolute right-2.5 z-50 flex w-[52px] flex-col items-center gap-[13px]"
                  style={{ bottom: "calc(112px + env(safe-area-inset-bottom, 0px))" }}
                >
                  <button
                    type="button"
                    onClick={toggleFollow}
                    className="relative mb-1 grid h-[48px] w-[48px] place-items-center overflow-visible rounded-full border-2 border-white bg-[#161823] text-white shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition active:scale-90"
                    aria-label={
                      followed
                        ? "Dejar de seguir"
                        : lesson.authorName
                          ? `Seguir a ${lesson.authorName}`
                          : "Seguir"
                    }
                  >
                    {lesson.authorAvatarUrl ? (
                      <img
                        src={lesson.authorAvatarUrl}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-[13px] font-black tracking-[-0.04em]">
                        {lesson.authorName
                          ? lesson.authorName
                              .split(/\s+/)
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0]?.toUpperCase())
                              .join("")
                          : "TP"}
                      </span>
                    )}
                    <span
                      className={
                        "absolute -bottom-[7px] left-1/2 grid h-[20px] w-[20px] -translate-x-1/2 place-items-center rounded-full border-2 border-black text-white shadow " +
                        (followed ? "bg-[#25b45b]" : "bg-[#ff3b5c]")
                      }
                    >
                      {followed ? (
                        <Check className="h-3 w-3" strokeWidth={3.2} />
                      ) : (
                        <Plus className="h-3.5 w-3.5" strokeWidth={3.2} />
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleLike(lesson.id)}
                    className="flex min-h-[52px] w-[52px] flex-col items-center justify-center text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)] transition active:scale-90"
                    aria-label="Me gusta"
                  >
                    <Heart
                      className={
                        "h-[31px] w-[31px] " +
                        (isLiked
                          ? "fill-[#ff3b5c] text-[#ff3b5c]"
                          : "fill-white text-white")
                      }
                      strokeWidth={2.2}
                    />
                    {lesson.likesCount !== null &&
                    lesson.likesCount !== undefined ? (
                      <span className="mt-0.5 text-[10px] font-black leading-none text-white">
                        {formatSocialCount(lesson.likesCount)}
                      </span>
                    ) : null}
                  </button>

                  <button
                    type="button"
                    className="flex min-h-[52px] w-[52px] flex-col items-center justify-center text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)] transition active:scale-90"
                    aria-label="Comentarios"
                  >
                    <MessageCircle
                      className="h-[30px] w-[30px] fill-white text-white"
                      strokeWidth={2.2}
                    />
                    {lesson.commentsCount !== null &&
                    lesson.commentsCount !== undefined ? (
                      <span className="mt-0.5 text-[10px] font-black leading-none text-white">
                        {formatSocialCount(lesson.commentsCount)}
                      </span>
                    ) : null}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSaved(lesson.id)}
                    className="grid h-[44px] w-[44px] place-items-center text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)] transition active:scale-90"
                    aria-label={isSaved ? "Quitar de guardados" : "Guardar"}
                  >
                    <Bookmark
                      className={"h-[29px] w-[29px] " + (isSaved ? "fill-white text-white" : "text-white")}
                      strokeWidth={2.4}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => void shareLesson(lesson)}
                    className="grid h-[44px] w-[44px] place-items-center text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)] transition active:scale-90"
                    aria-label="Compartir"
                  >
                    <Share2 className="h-[29px] w-[29px]" strokeWidth={2.6} />
                  </button>

                </div>

                <div
                  className="absolute left-4 right-[70px] z-50"
                  style={{ bottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}
                >
                  <div className="mb-3">
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.09em] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                      <span>Progreso del vídeo</span>
                      <span className="rounded-full bg-black/45 px-1.5 py-0.5 tabular-nums text-white shadow-[0_1px_4px_rgba(0,0,0,0.65)] backdrop-blur-sm">{readyToClaim ? 100 : Math.min(99, Math.round(videoProgress))}%</span>
                    </div>
                    <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/20 shadow-[0_1px_4px_rgba(0,0,0,0.35)]">
                      <div
                        className="h-full rounded-full bg-[#ff3b5c] transition-[width] duration-500 ease-out"
                        style={{ width: `${readyToClaim ? 100 : Math.min(99, videoProgress)}%` }}
                      />
                    </div>
                  </div>
                  {lesson.authorName ? (
                    <p className="mb-1 truncate text-[11px] font-black text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)]">
                      @{lesson.authorName}
                    </p>
                  ) : null}

                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff3b5c] drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)]">
                    Día {planDay} · Vídeo {index + 1}
                  </p>

                  <p className="mt-1.5 max-w-[300px] text-[14px] font-black leading-[1.25] text-white drop-shadow-[0_2px_7px_rgba(0,0,0,1)]">
                    Mira el vídeo y completa tu recompensa
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="relative">
                      {rewardBurst ? (
                        <div className="pointer-events-none absolute -inset-x-3 bottom-full h-16 overflow-visible">
                          {Array.from({ length: 7 }, (_, coinIndex) => (
                            <span
                              key={coinIndex}
                              className="tp-reward-coin-rise absolute bottom-0 grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-[#ffe784] to-[#efb21b] text-[8px] font-black text-[#775200] shadow-lg"
                              style={{
                                left: `${6 + coinIndex * 13}%`,
                                animationDelay: `${coinIndex * 65}ms`,
                                ["--tp-x" as string]: `${(coinIndex - 3) * 7}px`,
                              }}
                            >
                              €
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div
                        className={
                          "inline-flex min-h-9 items-center gap-2 rounded-full bg-black/60 px-3.5 text-white shadow-[0_5px_16px_rgba(0,0,0,0.32)] backdrop-blur-md transition-transform " +
                          (rewardBurst ? "scale-110 ring-2 ring-[#f6c73a]/60" : "")
                        }
                      >
                        <img
                          src={TIK_PAY_COIN}
                          alt=""
                          aria-hidden="true"
                          className="h-[18px] w-[18px] shrink-0 object-contain"
                        />
                        <span className="text-[11px] font-bold text-white/60">
                          Saldo
                        </span>
                        <span className="text-[13px] font-black leading-none tabular-nums">
                          {formatTikPayBalance(balance)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void finishLesson(lesson, index)}
                      disabled={claimed || !readyToClaim || claiming}
                      className={
                        "relative inline-flex min-h-9 items-center gap-1 rounded-full px-3.5 text-[13px] font-black text-white shadow-[0_5px_16px_rgba(21,148,71,0.3)] transition active:scale-95 disabled:cursor-default " +
                        (readyToClaim && !claimed
                          ? "bg-[#159447] animate-pulse ring-2 ring-white/35"
                          : claimed
                            ? "bg-[#159447]/55"
                            : "bg-[#159447]/75")
                      }
                    >
                      {claiming ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      ) : null}
                      +{formatTikPayBalance(dayConfig.videoRewards[index] ?? 0)}
                    </button>

                    <div
                      className={
                        "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-4 text-[11px] font-black shadow-[0_5px_16px_rgba(0,0,0,0.26)] " +
                        (readyToClaim
                          ? "bg-white text-[#159447]"
                          : "bg-white/20 text-white/55 backdrop-blur-sm")
                      }
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                      {!readyToClaim ? "En curso" : claimed ? "Listo" : "100%"}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

      </div>
    </main>
  );
}
