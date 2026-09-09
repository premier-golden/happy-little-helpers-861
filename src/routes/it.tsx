import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { setTikPayLocale } from "@/lib/tikpay-i18n";

export const Route = createFileRoute("/it")({
  component: LocaleEntry,
});

function LocaleEntry() {
  useEffect(() => {
    setTikPayLocale("it");
    window.location.replace("/login?lang=it");
  }, []);

  return null;
}
