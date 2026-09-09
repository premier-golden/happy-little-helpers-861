import { createFileRoute } from "@tanstack/react-router";
import { TikPayLessonFeed, type TikPayLesson } from "@/components/members/TikPayLessonFeed";

export const Route = createFileRoute("/module/purchase-info")({
  head: () => ({
    meta: [{ title: "Información de compra — Tik Pay" }],
  }),
  component: ModulePurchaseInfoPage,
});

const lessons: TikPayLesson[] = [
  {
    id: "purchase-info-01",
    label: "Información",
    title: "Información importante sobre tu compra",
    embedUrl:
      "https://player.mediadelivery.net/embed/660067/2f7a09f3-3d38-4ec8-9ac6-f2864bdb8916?autoplay=false&preload=true",
  },
];

function ModulePurchaseInfoPage() {
  return <TikPayLessonFeed lessons={lessons} mode="static" />;
}
