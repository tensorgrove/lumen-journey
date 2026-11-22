import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getContent } from "@/lib/data";
import { formatPrice } from "@/lib/content";
import { stripeEnabled } from "@/lib/stripe";
import { completeDemoCheckout } from "../../actions";

export default async function DemoCheckout({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const user = await getUser();
  if (!user) redirect("/signup?next=/unlock");
  if (stripeEnabled()) redirect("/unlock");
  const { plan: planId } = await searchParams;
  const plan = (await getContent()).plans.find((p) => p.id === planId);
  if (!plan) redirect("/unlock");

  return (
    <section className="screen">
      <div className="auth">
        <form className="sheet" action={completeDemoCheckout}>
          <div className="eyebrow">Checkout</div>
          <h3>{plan.name} · {formatPrice(plan.priceCents)}{plan.interval === "month" ? "/month" : ""}</h3>
          <input type="hidden" name="plan" value={plan.id} />
          <label className="field"><span>Name</span><input defaultValue={user.name} readOnly /></label>
          <label className="field"><span>Email</span><input defaultValue={user.email} readOnly /></label>
          <div className="sim">Preview checkout. Nothing is charged. With Stripe keys added, this becomes a real Stripe Checkout page.</div>
          <div className="row">
            <Link className="btn btn-ghost" href="/unlock">Back</Link>
            <button className="btn btn-primary" type="submit">Unlock</button>
          </div>
        </form>
      </div>
    </section>
  );
}
