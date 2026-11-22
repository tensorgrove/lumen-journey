import { stepPage } from "@/lib/gate";
import Strengths from "./Strengths";

export default async function StrengthsPage() {
  const { p, content } = await stepPage("strengths");
  return <Strengths qualities={content.qualities} initial={p?.strengths ?? []} />;
}
