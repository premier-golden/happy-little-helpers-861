import { useEffect, useState } from "react";
import { Check, Clock3, Play } from "lucide-react";

type Props = {
  title: string;
  embedUrl: string;
  lessonId: string;
  lessonLabel?: string;
  durationLabel?: string;
  className?: string;
  loading?: "lazy" | "eager";
};

const PROGRESS_PREFIX = "tikpay:lesson-progress:";

export function BunnyVideoEmbed({
  title,
  embedUrl,
  lessonId,
  lessonLabel = "Clase",
  durationLabel = "Duración en el reproductor",
  className,
  loading = "lazy",
}: Props) {
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(`${PROGRESS_PREFIX}${lessonId}`) ?? 0);
      if (Number.isFinite(saved)) setProgress(Math.max(0, Math.min(100, saved)));
    } catch {
      // El progreso sigue funcionando durante la sesión aunque el navegador bloquee localStorage.
    }
  }, [lessonId]);

  function persistProgress(value: number) {
    const next = Math.max(0, Math.min(100, value));
    setProgress(next);
    try {
      window.localStorage.setItem(`${PROGRESS_PREFIX}${lessonId}`, String(next));
    } catch {
      // Sin persistencia, mantenemos el estado en memoria.
    }
  }

  function startVideo() {
    setStarted(true);
    if (progress < 35) persistProgress(35);
  }

  function markWatched() {
    persistProgress(100);
  }

  const status = progress >= 100 ? "Completada" : progress > 0 ? "En progreso" : "Sin comenzar";

  return (
    <div className={className}>
      <div className="mx-auto w-full max-w-[330px]">
        <div className="relative aspect-[9/16] overflow-hidden rounded-[26px] bg-black shadow-[0_16px_40px_rgba(0,0,0,0.18)] ring-1 ring-black/10">
          {started ? (
            <iframe
              src={embedUrl}
              title={title}
              loading={loading}
              allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
              allowFullScreen
              className="h-full w-full border-0 bg-black"
            />
          ) : (
            <button
              type="button"
              onClick={startVideo}
              className="group relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#0d0d0f] p-5 text-left text-white"
              aria-label={`Reproducir ${title}`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(37,244,238,0.25),transparent_28%),radial-gradient(circle_at_85%_30%,rgba(255,59,92,0.32),transparent_34%),linear-gradient(180deg,#141416_0%,#050505_100%)]" />
              <div className="absolute -right-16 top-28 h-48 w-48 rounded-full border-[28px] border-[#ff3b5c]/15" />
              <div className="absolute -left-20 bottom-28 h-52 w-52 rounded-full border-[32px] border-[#25f4ee]/10" />

              <div className="relative z-10 flex items-center justify-between gap-3">
                <span className="rounded-full bg-[#ff3b5c] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                  {lessonLabel}
                </span>
                <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[10px] font-semibold text-white/80 backdrop-blur">
                  9:16
                </span>
              </div>

              <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-3 text-center">
                <div className="mb-5 grid h-[74px] w-[74px] place-items-center rounded-full bg-white text-[#161823] shadow-[0_12px_35px_rgba(0,0,0,0.32)] transition-transform group-active:scale-95">
                  <Play className="ml-1 h-8 w-8 fill-[#161823]" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">Tik Pay</p>
                <h3 className="mt-2 max-w-[240px] text-[22px] font-black leading-tight tracking-tight text-white">
                  {title}
                </h3>
                <p className="mt-3 text-[12px] font-medium text-white/60">Toca para reproducir</p>
              </div>

              <div className="relative z-10 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-[11px] text-white/65">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" /> {durationLabel}
                </span>
                <span>{status}</span>
              </div>
            </button>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-black/[0.06] bg-[#f8f9fa] p-3.5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a8a8e]">Progreso de la clase</p>
              <p className="mt-0.5 text-[12px] font-bold text-[#161823]">{status}</p>
            </div>
            <span className="text-[13px] font-black tabular-nums text-[#ff3b5c]">{progress}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-[#e7e7e9]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ff3b5c] to-[#fe2b54] transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {started && progress < 100 && (
            <button
              type="button"
              onClick={markWatched}
              className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#161823] px-4 py-2.5 text-[12px] font-black text-white transition-transform active:scale-[0.99]"
            >
              <Check className="h-4 w-4" /> Marcar como vista
            </button>
          )}

          {progress >= 100 && (
            <div className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#eafaf0] px-4 py-2.5 text-[12px] font-black text-[#159447]">
              <Check className="h-4 w-4" /> Clase completada
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
