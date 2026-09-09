import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { setTikPayLocale } from "@/lib/tikpay-i18n";

export const Route = createFileRoute("/es")({
  component: LocaleEntry,
});

function LocaleEntry() {
  useEffect(() => {
    setTikPayLocale("es");
    window.location.replace("/login?lang=es");
  }, []);

  return null;
}
