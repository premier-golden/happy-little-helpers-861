import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { setTikPayLocale } from "@/lib/tikpay-i18n";

export const Route = createFileRoute("/en")({
  component: LocaleEntry,
});

function LocaleEntry() {
  useEffect(() => {
    setTikPayLocale("en");
    window.location.replace("/login?lang=en");
  }, []);

  return null;
}
