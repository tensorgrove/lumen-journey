import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getContent, getProgress, stepStates } from "@/lib/data";
import { STEPS } from "@/lib/content";

export default async function JourneyPage() {
  const user = await getUser();
  if (!user) redirect("/signup?next=/journey");
  const [p, content] = await Promise.all([getProgress(user.id), getContent()]);
  const states = stepStates(user, p);
  const ch = content.challenges.find((c) => c.id === p?.challengeId);
  const lanternHref = `/lantern?path=${p?.path ?? "challenge"}`;

  return (
    <section className="screen">
      <div className="lvl-head">
        <div className="eyebrow">Your journey{user.name ? ` · ${user.name}` : ""}</div>
        <h2>Your three-step path</h2>
        <p className="sub">Name your strengths, turn them into a clear direction, then find your voice. At the end, your horizon.</p>
      </div>
      <div className="map">
        {STEPS.map((s, i) => {
          const st = states[s.key];
          const href = st === "locked" ? (user.paidAt ? "/journey" : "/unlock") : s.key === "lantern" ? lanternHref : s.href;
          const badge = st === "done" ? "✓" : i === 0 ? "✦" : s.key === "horizon" ? "✧" : i;
          const label =
            st === "done" ? "Done" : st === "open" ? "Start" : user.paidAt ? "Next" : "Locked";
          const desc = s.key === "lantern" && ch && st === "done" ? `${ch.name} → ${ch.out.join(" · ")}` : s.desc;
          return (
            <Link key={s.key} href={href} className={`node ${st}${s.key === "horizon" ? " horizon" : ""}`}>
              <span className="badge">{badge}</span>
              <span className="txt"><b>{s.name}</b><small>{desc}</small></span>
              <span className="state">{st === "locked" && <span className="lock" />}{label}</span>
            </Link>
          );
        })}
      </div>
      <div className="center">
        {!user.paidAt ? (
          <Link className="btn btn-gold" href="/unlock" style={{ marginTop: 8 }}>Unlock your progress</Link>
        ) : (
          <a className="restart" href={content.bookingUrl} target="_blank" rel="noopener">Prefer to talk it through? Book a free clarity call</a>
        )}
      </div>
    </section>
  );
}
