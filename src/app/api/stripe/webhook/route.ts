import { NextResponse } from "next/server";
import { getContent, markPaid } from "@/lib/data";
import { stripe, stripeEnabled } from "@/lib/stripe";

export async function POST(req: Request) {
  if (!stripeEnabled() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 400 });
  }
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  let event;
  try {
    event = stripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    const userId = Number(s.metadata?.userId);
    if (userId && s.payment_status === "paid") {
      const plan = (await getContent()).plans.find((p) => p.id === s.metadata?.planId);
      await markPaid({
        userId,
        planId: plan?.id ?? String(s.metadata?.planId),
        amountCents: s.amount_total ?? plan?.priceCents ?? 0,
        provider: "stripe",
        ref: s.id,
      });
    }
  }
  return NextResponse.json({ received: true });
}
