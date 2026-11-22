import { stepPage } from "@/lib/gate";
import Voice from "./Voice";

export default async function VoicePage() {
  const { p, content } = await stepPage("voice");
  return <Voice feedback={content.feedback} done={!!p?.steps.includes("voice")} />;
}
