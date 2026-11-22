import "server-only";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "./db";
import { mergeContent, STEPS, type SiteContent, type StepKey } from "./content";
import type { Progress, User } from "./schema";

export async function getContent(): Promise<SiteContent> {
  const db = await getDb();
  const [row] = await db.select().from(schema.content).where(eq(schema.content.key, "site")).limit(1);
  return mergeContent(row?.value);
}

export async function getProgress(userId: number): Promise<Progress | null> {
  const db = await getDb();
  const [p] = await db.select().from(schema.progress).where(eq(schema.progress.userId, userId)).limit(1);
  return p ?? null;
}

export async function ensureProgress(userId: number): Promise<Progress> {
  const db = await getDb();
  await db.insert(schema.progress).values({ userId }).onConflictDoNothing();
  return (await getProgress(userId))!;
}

export async function updateProgress(userId: number, patch: Partial<Omit<Progress, "userId">>) {
  const db = await getDb();
  await ensureProgress(userId);
  await db
    .update(schema.progress)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(schema.progress.userId, userId));
}

export async function addStep(userId: number, step: StepKey) {
  const p = await ensureProgress(userId);
  if (!p.steps.includes(step)) {
    await updateProgress(userId, { steps: [...p.steps, step] });
    revalidatePath("/", "layout"); // refresh the progress bar in the header
  }
}

export type StepState = "done" | "open" | "locked";

export function stepStates(user: User | null, p: Progress | null): Record<StepKey, StepState> {
  const done = new Set(p?.steps ?? []);
  const paid = !!user?.paidAt;
  const out = {} as Record<StepKey, StepState>;
  STEPS.forEach((s, i) => {
    if (done.has(s.key)) out[s.key] = "done";
    else if (i === 0) out[s.key] = "open";
    else if (!paid) out[s.key] = "locked";
    else out[s.key] = done.has(STEPS[i - 1].key) ? "open" : "locked";
  });
  return out;
}

/** May this user open this step right now? (done steps can be revisited) */
export function canOpen(user: User | null, p: Progress | null, key: StepKey) {
  return stepStates(user, p)[key] !== "locked";
}

export async function markPaid(opts: {
  userId: number;
  planId: string;
  amountCents: number;
  provider: "stripe" | "demo";
  ref: string;
}) {
  const db = await getDb();
  await db
    .insert(schema.payments)
    .values({ ...opts, status: "paid" })
    .onConflictDoNothing({ target: schema.payments.ref });
  await db
    .update(schema.users)
    .set({ paidAt: new Date(), planId: opts.planId })
    .where(eq(schema.users.id, opts.userId));
}
