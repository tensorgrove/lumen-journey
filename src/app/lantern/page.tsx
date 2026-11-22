import { getContent } from "@/lib/data";
import { getUser } from "@/lib/auth";
import type { PathId } from "@/lib/content";
import LanternLevel from "./LanternLevel";

export default async function LanternPage({ searchParams }: { searchParams: Promise<{ path?: string }> }) {
  const sp = await searchParams;
  const path: PathId = sp.path === "purpose" ? "purpose" : "challenge";
  const [content, user] = await Promise.all([getContent(), getUser()]);
  return <LanternLevel path={path} challenges={content.challenges} signedIn={!!user} />;
}
