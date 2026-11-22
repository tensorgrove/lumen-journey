import { stepPage } from "@/lib/gate";
import Horizon from "./Horizon";

export default async function HorizonPage() {
  const { p, content } = await stepPage("horizon");
  const ch = content.challenges.find((c) => c.id === p?.challengeId);
  return (
    <Horizon
      opened={!!p?.steps.includes("horizon")}
      strengths={p?.strengths ?? []}
      purpose={p?.purpose ?? ""}
      returns={ch ? ch.out.join(" · ") : ""}
      bookingUrl={content.bookingUrl}
      bookingTitle={content.bookingTitle}
      bookingText={content.bookingText}
    />
  );
}
