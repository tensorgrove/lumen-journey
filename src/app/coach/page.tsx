import Link from "next/link";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { getContent } from "@/lib/data";
import { formatPrice, STEPS } from "@/lib/content";
import { clearSampleData, loadSampleData } from "../actions";

function ago(d: Date) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  const days = Math.floor(s / 86400);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

export default async function CoachDashboard() {
  const me = await getUser();
  if (!me?.isAdmin) redirect("/signin?next=/coach");
  const db = await getDb();
  const content = await getContent();

  const [users, runs, progress, payments] = await Promise.all([
    db.select().from(schema.users).orderBy(desc(schema.users.createdAt)),
    db.select().from(schema.lanternRuns),
    db.select().from(schema.progress),
    db.select().from(schema.payments),
  ]);
  const people = users.filter((u) => !u.isAdmin);
  const progBy = new Map(progress.map((p) => [p.userId, p]));
  const sampleCount = people.filter((u) => u.isSample).length;

  const visitors = new Set(runs.map((r) => r.visitorId)).size;
  const signups = people.length;
  const paid = people.filter((u) => u.paidAt).length;
  const revenue = payments.filter((p) => p.status === "paid").reduce((a, p) => a + p.amountCents, 0);
  const reached = (k: string) => people.filter((u) => progBy.get(u.id)?.steps.includes(k)).length;

  const funnel = [
    { label: "Tried the lantern", n: visitors },
    { label: "Created an account", n: signups },
    { label: "Unlocked the journey", n: paid },
    { label: "Named their strengths", n: reached("strengths") },
    { label: "Set a direction", n: reached("purpose") },
    { label: "Found their voice", n: reached("voice") },
    { label: "Reached their horizon", n: reached("horizon") },
  ];
  const top = Math.max(1, ...funnel.map((f) => f.n));

  const byChallenge = content.challenges
    .map((c) => ({ c, n: runs.filter((r) => r.challengeId === c.id).length }))
    .sort((a, b) => b.n - a.n);
  const totalRuns = Math.max(1, runs.length);
  const byPath = {
    challenge: runs.filter((r) => r.path === "challenge").length,
    purpose: runs.filter((r) => r.path === "purpose").length,
  };
  const planName = (id: string | null) => content.plans.find((p) => p.id === id)?.name ?? id ?? "";

  return (
    <section className="screen admin">
      <div className="admin-head">
        <div>
          <div className="eyebrow">Coach view</div>
          <h2>Your Lumen Journey</h2>
          <p className="sub" style={{ marginTop: 6 }}>Who is taking the journey, how far they get, and what they bring to the lantern.</p>
        </div>
        <Link className="btn btn-ghost btn-sm" href="/" target="_blank">See it as a visitor ↗</Link>
      </div>

      <div className="tabs">
        <Link href="/coach" className="on">Overview</Link>
        <Link href="/coach/content">Your words &amp; prices</Link>
      </div>

      <div className="sample-bar">
        <span>
          {sampleCount
            ? `Showing ${sampleCount} sample people so you can see how this looks when it’s busy. They’re marked “sample”.`
            : "No visitors yet? Load sample people to see how the dashboard looks when it’s busy."}
        </span>
        {sampleCount ? (
          <form action={clearSampleData}><button className="btn btn-ghost btn-sm" type="submit">Remove sample people</button></form>
        ) : (
          <form action={loadSampleData}><button className="btn btn-gold btn-sm" type="submit">Load sample people</button></form>
        )}
      </div>

      <div className="kpis">
        <div className="kpi"><small>Visitors</small><b>{visitors}</b><span>tried the lantern</span></div>
        <div className="kpi"><small>Accounts</small><b>{signups}</b><span>{visitors ? Math.round((signups / visitors) * 100) : 0}% of visitors</span></div>
        <div className="kpi"><small>Members</small><b>{paid}</b><span>unlocked the journey</span></div>
        <div className="kpi"><small>Revenue</small><b>{formatPrice(revenue)}</b><span>{payments.length} payments</span></div>
        <div className="kpi"><small>Horizon</small><b>{reached("horizon")}</b><span>completed the journey</span></div>
      </div>

      <div className="panels">
        <div className="panel">
          <h3>How far people get</h3>
          {funnel.map((f) => (
            <div className="frow" key={f.label}>
              <span>{f.label}</span>
              <div className="ftrack"><i style={{ width: `${(f.n / top) * 100}%` }} /></div>
              <em>{f.n}</em>
            </div>
          ))}
        </div>
        <div className="panel">
          <h3>What people bring to the lantern</h3>
          {byChallenge.map(({ c, n }) => (
            <div className="frow" key={c.id}>
              <span><i className="dotc" style={{ background: c.colors[1] }} />{c.name}</span>
              <div className="ftrack"><i style={{ width: `${(n / totalRuns) * 100}%`, background: `linear-gradient(90deg, ${c.colors[0]}, ${c.colors[1]})` }} /></div>
              <em>{n}</em>
            </div>
          ))}
          <p className="small" style={{ marginTop: 14 }}>
            Paths chosen: <b>Transform a challenge</b> {byPath.challenge} · <b>Find your purpose</b> {byPath.purpose}
          </p>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3>People</h3>
        {people.length === 0 ? (
          <div className="empty">When someone creates an account, they’ll appear here with their progress.</div>
        ) : (
          <table className="ctable">
            <thead>
              <tr>
                <th>Name</th><th className="hide-sm">Brought to the lantern</th><th>Progress</th><th>Status</th><th className="hide-sm">Direction</th><th className="hide-sm">Joined</th>
              </tr>
            </thead>
            <tbody>
              {people.slice(0, 50).map((u) => {
                const p = progBy.get(u.id);
                const ch = content.challenges.find((c) => c.id === p?.challengeId);
                return (
                  <tr key={u.id}>
                    <td><b>{u.name || "—"}</b><br /><span className="small">{u.email}</span></td>
                    <td className="hide-sm">{ch ? <><i className="dotc" style={{ background: ch.colors[1] }} />{ch.name}</> : "—"}</td>
                    <td>
                      <div className="steps-mini">{STEPS.map((s) => <i key={s.key} className={p?.steps.includes(s.key) ? "on" : ""} />)}</div>
                      <span className="small">{p?.steps.length ?? 0} of {STEPS.length}</span>
                    </td>
                    <td>
                      {u.paidAt ? <span className="tagp paid">{planName(u.planId)}</span> : <span className="tagp free">Free</span>}{" "}
                      {u.isSample && <span className="tagp sample">sample</span>}
                    </td>
                    <td className="hide-sm small">{p?.purpose ?? "—"}</td>
                    <td className="hide-sm small">{ago(u.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
