import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getContent } from "@/lib/data";
import { formatPrice } from "@/lib/content";
import { stripeEnabled } from "@/lib/stripe";
import { startCheckout } from "../actions";

export default async function UnlockPage() {
  const user = await getUser();
  if (!user) redirect("/signup?next=/unlock");
  if (user.paidAt) redirect("/journey");
  const content = await getContent();
  const live = stripeEnabled();

  return (
    <section className="screen">
      <div className="lvl-head">
        <div className="eyebrow">Unlock your progress</div>
        <h2>Keep going on the path</h2>
        <p className="sub">You’ve taken the first step. Choose how you’d like to continue.</p>
      </div>
      <div className="plans">
        {content.plans.map((p) => (
          <form key={p.id} action={startCheckout} className={"plan" + (p.style === "primary" ? " best" : "")}>
            {p.tag && <span className="tag">{p.tag}</span>}
            <h3>{p.name}</h3>
            <div className="price">{formatPrice(p.priceCents)} <small>{p.priceNote}</small></div>
            <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
            <input type="hidden" name="plan" value={p.id} />
            <button className={`btn btn-${p.style}`} type="submit">Choose</button>
          </form>
        ))}
      </div>
      <p className="note">
        {live ? "Secure checkout by Stripe." : "Preview checkout. No card is needed and nothing is charged."}
      </p>
    </section>
  );
}
