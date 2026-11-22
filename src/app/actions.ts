"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, isNull, desc, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDb, schema } from "@/lib/db";
import { createSession, destroySession, getUser, getVisitorId } from "@/lib/auth";
import { addStep, canOpen, ensureProgress, getContent, getProgress, markPaid, updateProgress } from "@/lib/data";
import { mergeContent, type PathId, type SiteContent } from "@/lib/content";
import { siteUrl, stripe, stripeEnabled } from "@/lib/stripe";

function safeNext(next: unknown, fallback = "/journey") {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : fallback;
}

/* ---------------- Lantern (free, no account needed) ---------------- */

export async function recordLantern(path: PathId | null, challengeId: string) {
  const content = await getContent();
  const ch = content.challenges.find((c) => c.id === challengeId);
  if (!ch) return { ok: false };
  const visitorId = (await getVisitorId(true))!;
  const user = await getUser();
  const db = await getDb();
  await db.insert(schema.lanternRuns).values({
    visitorId,
    userId: user?.id ?? null,
    path: path ?? ch.path,
    challengeId: ch.id,
  });
  if (user) {
    await updateProgress(user.id, { path: path ?? ch.path, challengeId: ch.id });
    await addStep(user.id, "lantern");
  }
  return { ok: true, signedIn: !!user };
}

/* ---------------- Accounts ---------------- */

async function linkVisitorRuns(userId: number) {
  const vid = await getVisitorId(false);
  if (!vid) return;
  const db = await getDb();
  await db
    .update(schema.lanternRuns)
    .set({ userId })
    .where(and(eq(schema.lanternRuns.visitorId, vid), isNull(schema.lanternRuns.userId)));
  const [last] = await db
    .select()
    .from(schema.lanternRuns)
    .where(eq(schema.lanternRuns.userId, userId))
    .orderBy(desc(schema.lanternRuns.createdAt))
    .limit(1);
  if (last) {
    const p = await getProgress(userId);
    if (!p?.challengeId) await updateProgress(userId, { path: last.path, challengeId: last.challengeId });
    await addStep(userId, "lantern");
  }
}

export type FormState = { error?: string } | undefined;

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Please enter a valid email." };
  if (password.length < 8) return { error: "Please choose a password of at least 8 characters." };
  const db = await getDb();
  const [exists] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email));
  if (exists) return { error: "There’s already an account with that email. Try signing in." };
  const [u] = await db
    .insert(schema.users)
    .values({ name, email, passwordHash: await bcrypt.hash(password, 10) })
    .returning();
  await ensureProgress(u.id);
  await linkVisitorRuns(u.id);
  await createSession(u.id);
  redirect(safeNext(form.get("next")));
}

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const db = await getDb();
  const [u] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!u || !(await bcrypt.compare(password, u.passwordHash))) {
    return { error: "That email and password don’t match." };
  }
  await linkVisitorRuns(u.id);
  await createSession(u.id);
  redirect(safeNext(form.get("next"), u.isAdmin ? "/coach" : "/journey"));
}

export async function signOut() {
  await destroySession();
  redirect("/");
}

/* ---------------- Unlock ---------------- */

export async function startCheckout(form: FormData) {
  const user = await getUser();
  if (!user) redirect("/signup?next=/unlock");
  const content = await getContent();
  const plan = content.plans.find((p) => p.id === form.get("plan"));
  if (!plan) redirect("/unlock");

  if (!stripeEnabled()) redirect(`/checkout/demo?plan=${encodeURIComponent(plan.id)}`);

  const recurring = plan.interval === "month";
  const session = await stripe().checkout.sessions.create({
    mode: recurring ? "subscription" : "payment",
    customer_email: user.email,
    client_reference_id: String(user.id),
    metadata: { userId: String(user.id), planId: plan.id },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: plan.priceCents,
          product_data: { name: plan.name, description: plan.features.join(" · ") },
          ...(recurring ? { recurring: { interval: "month" as const } } : {}),
        },
      },
    ],
    success_url: `${siteUrl()}/unlock/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/unlock`,
  });
  redirect(session.url!);
}

export async function completeDemoCheckout(form: FormData) {
  const user = await getUser();
  if (!user) redirect("/signup?next=/unlock");
  if (stripeEnabled()) redirect("/unlock"); // real checkout is configured; no shortcut
  const content = await getContent();
  const plan = content.plans.find((p) => p.id === form.get("plan"));
  if (!plan) redirect("/unlock");
  await markPaid({
    userId: user.id,
    planId: plan.id,
    amountCents: plan.priceCents,
    provider: "demo",
    ref: `demo_${user.id}_${Date.now()}`,
  });
  redirect("/unlock/success?demo=1");
}

/* ---------------- Steps ---------------- */

async function requireStep(key: Parameters<typeof canOpen>[2]) {
  const user = await getUser();
  if (!user) redirect("/signin");
  const p = await getProgress(user.id);
  if (!canOpen(user, p, key)) redirect("/journey");
  return user;
}

export async function saveStrengths(list: string[]) {
  const user = await requireStep("strengths");
  const content = await getContent();
  const clean = list.filter((q) => content.qualities.includes(q)).slice(0, 3);
  if (clean.length !== 3) return { ok: false };
  await updateProgress(user.id, { strengths: clean });
  await addStep(user.id, "strengths");
  return { ok: true };
}

export async function savePurpose(stand: string, soThat: string) {
  const user = await requireStep("purpose");
  const text = `I’m building toward ${stand.trim().slice(0, 60)} so that ${soThat.trim().slice(0, 100)}.`;
  await updateProgress(user.id, { purpose: text });
  await addStep(user.id, "purpose");
  return { ok: true, text };
}

export async function completeVoice() {
  const user = await requireStep("voice");
  await addStep(user.id, "voice");
  return { ok: true };
}

export async function openHorizon() {
  const user = await requireStep("horizon");
  await addStep(user.id, "horizon");
  return { ok: true };
}

export async function restartJourney() {
  const user = await getUser();
  if (!user) redirect("/");
  await updateProgress(user.id, { steps: [], strengths: [], purpose: null, challengeId: null, path: null });
  redirect("/");
}

/* ---------------- Coach (admin) ---------------- */

async function requireAdmin() {
  const user = await getUser();
  if (!user?.isAdmin) redirect("/signin?next=/coach");
  return user;
}

export async function saveContent(next: SiteContent) {
  await requireAdmin();
  const clean = mergeContent(next);
  // light validation
  clean.challenges = clean.challenges
    .filter((c) => c.name.trim())
    .map((c, i) => ({
      ...c,
      id: c.id || `c${Date.now()}${i}`,
      name: c.name.trim(),
      out: [c.out[0]?.trim() || "Strength", c.out[1]?.trim() || "Clarity"],
      quote: c.quote.trim(),
      path: c.path === "purpose" ? "purpose" : "challenge",
    }));
  clean.plans = clean.plans.map((p) => ({
    ...p,
    priceCents: Math.max(0, Math.round(Number(p.priceCents) || 0)),
    features: p.features.map((f) => f.trim()).filter(Boolean),
  }));
  clean.qualities = clean.qualities.map((q) => q.trim()).filter(Boolean);
  const db = await getDb();
  await db
    .insert(schema.content)
    .values({ key: "site", value: clean })
    .onConflictDoUpdate({ target: schema.content.key, set: { value: clean, updatedAt: new Date() } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function resetContent() {
  await requireAdmin();
  const db = await getDb();
  await db.delete(schema.content).where(eq(schema.content.key, "site"));
  revalidatePath("/", "layout");
}

const SAMPLE_NAMES = [
  "Maria Lopez", "David Chen", "Sarah Johnson", "James Carter", "Aisha Bello", "Tom Becker",
  "Linda Park", "Marcus Hill", "Rachel Green", "Omar Haddad", "Grace Kim", "Peter Novak",
  "Hannah Wright", "Luis Ortega", "Emily Stone", "Daniel Brooks", "Nadia Rahman", "Paul Dixon",
];

export async function loadSampleData() {
  await requireAdmin();
  const db = await getDb();
  const content = await getContent();
  const ch = content.challenges;
  const now = Date.now();
  const day = 86400000;
  const hash = await bcrypt.hash(crypto.randomUUID(), 4);
  // anonymous visitors who only tried the lantern
  for (let i = 0; i < 46; i++) {
    const c = ch[(i * 7 + 3) % ch.length];
    await db.insert(schema.lanternRuns).values({
      visitorId: `sample-anon-${i}`,
      path: c.path,
      challengeId: c.id,
      isSample: true,
      createdAt: new Date(now - ((i * 37) % 13) * day - i * 3600000),
    });
  }
  // people who created accounts, some of whom unlocked and progressed
  for (let i = 0; i < SAMPLE_NAMES.length; i++) {
    const name = SAMPLE_NAMES[i];
    const email = name.toLowerCase().replace(/\s+/g, ".") + "@sample.test";
    const c = ch[(i * 5 + 1) % ch.length];
    const joined = new Date(now - ((i * 23) % 13) * day - i * 5400000);
    const paid = i % 3 !== 2 && i < 13;
    const plan = content.plans[i % 4 === 0 ? 2 : i % 2 === 0 ? 1 : 0];
    const [u] = await db
      .insert(schema.users)
      .values({ name, email, passwordHash: hash, isSample: true, createdAt: joined, paidAt: paid ? joined : null, planId: paid ? plan.id : null })
      .onConflictDoNothing()
      .returning();
    if (!u) continue;
    await db.insert(schema.lanternRuns).values({ visitorId: `sample-u-${i}`, userId: u.id, path: c.path, challengeId: c.id, isSample: true, createdAt: joined });
    const order = ["lantern", "strengths", "purpose", "voice", "horizon"];
    const depth = paid ? 1 + ((i * 3) % 5) : 1;
    const goods = [content.qualities[i % content.qualities.length], content.qualities[(i + 4) % content.qualities.length], content.qualities[(i + 7) % content.qualities.length]];
    await db.insert(schema.progress).values({
      userId: u.id,
      path: c.path,
      challengeId: c.id,
      steps: order.slice(0, depth),
      strengths: depth >= 2 ? goods : [],
      purpose: depth >= 3 ? `I’m building toward ${["a healthier life", "meaningful work", "a stronger family", "my own business"][i % 4]} so that ${["I have energy for what matters", "my work makes a difference", "the people I love can thrive", "my goal becomes real"][i % 4]}.` : null,
      updatedAt: joined,
    });
    if (paid) {
      await db.insert(schema.payments).values({ userId: u.id, planId: plan.id, amountCents: plan.priceCents, provider: "demo", status: "paid", ref: `sample_${u.id}`, isSample: true, createdAt: joined });
    }
  }
  revalidatePath("/coach");
}

export async function clearSampleData() {
  await requireAdmin();
  const db = await getDb();
  await db.delete(schema.payments).where(eq(schema.payments.isSample, true));
  await db.delete(schema.lanternRuns).where(eq(schema.lanternRuns.isSample, true));
  const sampleUsers = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.isSample, true));
  if (sampleUsers.length) await db.delete(schema.users).where(inArray(schema.users.id, sampleUsers.map((u) => u.id)));
  revalidatePath("/coach");
}
