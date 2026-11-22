import { stepPage } from "@/lib/gate";
import Direction from "./Direction";

export default async function PurposePage() {
  const { p } = await stepPage("purpose");
  const g = p?.strengths?.length ? p.strengths : ["Honesty", "Kindness", "Courage"];
  return <Direction strengths={g} saved={p?.purpose ?? null} />;
}
