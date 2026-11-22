import "server-only";
import { redirect } from "next/navigation";
import { getUser } from "./auth";
import { canOpen, getContent, getProgress } from "./data";
import type { StepKey } from "./content";

export async function stepPage(key: StepKey) {
  const user = await getUser();
  if (!user) redirect(`/signin?next=/journey`);
  const p = await getProgress(user.id);
  if (!canOpen(user, p, key)) redirect(user.paidAt ? "/journey" : "/unlock");
  const content = await getContent();
  return { user, p, content };
}
