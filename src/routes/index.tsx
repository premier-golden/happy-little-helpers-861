import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TikTok Rewards | Home" },
      {
        name: "description",
        content: "Entry point for the TikTok Rewards balance withdrawal flow.",
      },
      { property: "og:title", content: "TikTok Rewards | Home" },
      {
        property: "og:description",
        content: "Entry point for the TikTok Rewards balance withdrawal flow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    window.location.replace("/pressel/index.html");
  }, []);

  // The initial route is just a pass-through to the pressel page.
  // We don't render technical messages to avoid any flash before redirecting.
  return null;
}
