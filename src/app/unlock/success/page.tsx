import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getContent, markPaid } from "@/lib/data";
import { stripe, stripeEnabled } from "@/lib/stripe";

export default async function UnlockSuccess({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const user = await getUser();
  if (!user) redirect("/signin?next=/journey");
  const { session_id } = await searchParams;

  // Confirm a real Stripe payment right here (the webhook does the same, whichever comes first).
  if (session_id && stripeEnabled() && !user.paidAt) {
    const s = await stripe().checkout.sessions.retrieve(session_id);
    if (s.payment_status === "paid" && s.metadata?.userId === String(user.id)) {
      const plan = (await getContent()).plans.find((p) => p.id === s.metadata?.planId);
      await markPaid({
        userId: user.id,
        planId: plan?.id ?? String(s.metadata?.planId),
        amountCents: s.amount_total ?? plan?.priceCents ?? 0,
        provider: "stripe",
        ref: s.id,
      });
      redirect("/unlock/success");
    }
  }
  if (!user.paidAt) {
    return (
      <section className="screen center">
        <h2>Confirming your payment…</h2>
        <p className="sub" style={{ marginTop: 10 }}>This usually takes a few seconds.</p>
        <Link className="btn btn-primary" href="/unlock/success" style={{ marginTop: 18 }}>Check again</Link>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="auth">
        <div className="sheet ok">
          <div className="tick" />
          <h3>Your journey is unlocked</h3>
          <p className="small" style={{ marginTop: 6 }}>
            Welcome{user.name ? `, ${user.name}` : ""}. Your progress is saved, so you can come back any time, on any device.
          </p>
          <div className="row">
            <Link className="btn btn-primary" href="/step/strengths">Start step 1 <span className="arrow" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
