import { Check, ChevronDown, Languages } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  type TikPayLocale,
  useTikPayI18n,
} from "@/lib/tikpay-i18n";

type Props = {
  compact?: boolean;
  className?: string;
};

const OPTIONS: Array<{
  locale: TikPayLocale;
  flag: string;
  label: string;
  short: string;
}> = [
  { locale: "es", flag: "🇪🇸", label: "Español", short: "ES" },
  { locale: "en", flag: "🇬🇧", label: "English", short: "EN" },
  { locale: "fr", flag: "🇫🇷", label: "Français", short: "FR" },
  { locale: "it", flag: "🇮🇹", label: "Italiano", short: "IT" },
];

export function TikPayLanguageSwitcher({
  compact = false,
  className = "",
}: Props) {
  const { locale, setLocale } = useTikPayI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const active = OPTIONS.find((item) => item.locale === locale) ?? OPTIONS[0];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(next: TikPayLocale) {
    setLocale(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={"relative inline-block " + className}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-black/[0.07] bg-white px-3 text-[#4f4f53] shadow-[0_4px_14px_rgba(0,0,0,0.06)] backdrop-blur transition active:scale-[0.98]"
        aria-label="Select language"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {!compact ? <Languages className="h-3.5 w-3.5 text-[#8a8a8e]" /> : null}
        <span className="text-[17px] leading-none" aria-hidden="true">
          {active.flag}
        </span>
        <span className="text-[10px] font-black">
          {compact ? active.short : active.label}
        </span>
        <ChevronDown
          className={
            "h-3.5 w-3.5 text-[#9a9a9f] transition-transform " +
            (open ? "rotate-180" : "")
          }
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+7px)] z-[80] w-[164px] overflow-hidden rounded-[18px] border border-black/[0.07] bg-white p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.14)]"
        >
          {OPTIONS.map((item) => {
            const selected = item.locale === locale;

            return (
              <button
                key={item.locale}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => choose(item.locale)}
                className={
                  "flex w-full items-center gap-2.5 rounded-[13px] px-3 py-2.5 text-left transition " +
                  (selected
                    ? "bg-[#fff0f3] text-[#ff3b5c]"
                    : "text-[#4f4f53] hover:bg-[#f6f6f7]")
                }
              >
                <span className="text-[19px] leading-none" aria-hidden="true">
                  {item.flag}
                </span>
                <span className="min-w-0 flex-1 text-[11px] font-black">
                  {item.label}
                </span>
                {selected ? (
                  <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
