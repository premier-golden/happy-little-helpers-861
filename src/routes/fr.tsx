import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { setTikPayLocale } from "@/lib/tikpay-i18n";

export const Route = createFileRoute("/fr")({
  component: LocaleEntry,
});

function LocaleEntry() {
  useEffect(() => {
    setTikPayLocale("fr");
    window.location.replace("/login?lang=fr");
  }, []);

  return null;
}
