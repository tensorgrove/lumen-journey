"use client";

import { useState, useTransition } from "react";
import type { Challenge, Plan, SiteContent } from "@/lib/content";
import { resetContent, saveContent } from "../../actions";

const PALETTES: [string, string][] = [
  ["#FF9DBD", "#E0457B"], ["#A566D9", "#582E91"], ["#C795F0", "#8A4CCB"], ["#74E0CF", "#2FA898"],
  ["#FFD58E", "#E59A2B"], ["#8FC9FF", "#3A7BD5"],
];

export default function ContentEditor({ initial }: { initial: SiteContent }) {
  const [c, setC] = useState<SiteContent>(initial);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  const set = (patch: Partial<SiteContent>) => { setC((x) => ({ ...x, ...patch })); setDirty(true); setMsg(""); };
  const setCh = (i: number, patch: Partial<Challenge>) =>
    set({ challenges: c.challenges.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const setPlan = (i: number, patch: Partial<Plan>) =>
    set({ plans: c.plans.map((x, j) => (j === i ? { ...x, ...patch } : x)) });

  function addChallenge() {
    const pal = PALETTES[c.challenges.length % PALETTES.length];
    set({
      challenges: [
        ...c.challenges,
        { id: `c${Date.now()}`, name: "", path: "challenge", out: ["", ""], quote: "", colors: pal },
      ],
    });
  }

  return (
    <div className="editor">
      <div className="panel">
        <h3>Opening page</h3>
        <label><span>Headline</span><input value={c.headline} onChange={(e) => set({ headline: e.target.value })} /></label>
        <label><span>Introduction</span><textarea value={c.intro} onChange={(e) => set({ intro: e.target.value })} /></label>
      </div>

      <div className="panel">
        <h3>The Lantern: what goes in, what it lights up</h3>
        {c.challenges.map((ch, i) => (
          <div className="ch-edit" key={ch.id}>
            <div className="hd">
              <b><i className="dotc" style={{ background: ch.colors[1] }} />{ch.name || "New challenge"}</b>
              <button className="linkbtn" onClick={() => set({ challenges: c.challenges.filter((_, j) => j !== i) })}>Remove</button>
            </div>
            <div className="grid2">
              <label><span>What goes in</span><input value={ch.name} onChange={(e) => setCh(i, { name: e.target.value })} placeholder="e.g. Self-doubt" /></label>
              <label>
                <span>Path</span>
                <select value={ch.path} onChange={(e) => setCh(i, { path: e.target.value as Challenge["path"] })}>
                  <option value="challenge">Transform a challenge</option>
                  <option value="purpose">Find your purpose</option>
                </select>
              </label>
              <label><span>What it lights up (1)</span><input value={ch.out[0]} onChange={(e) => setCh(i, { out: [e.target.value, ch.out[1]] })} /></label>
              <label><span>What it lights up (2)</span><input value={ch.out[1]} onChange={(e) => setCh(i, { out: [ch.out[0], e.target.value] })} /></label>
            </div>
            <label><span>Your words after the lantern</span><textarea value={ch.quote} onChange={(e) => setCh(i, { quote: e.target.value })} /></label>
          </div>
        ))}
        <div className="actions" style={{ justifyContent: "flex-start" }}>
          <button className="btn btn-ghost btn-sm" onClick={addChallenge}>+ Add a challenge</button>
        </div>
      </div>

      <div className="panel">
        <h3>Step 1: the qualities people choose from</h3>
        <label><span>One per line</span>
          <textarea style={{ minHeight: 160 }} value={c.qualities.join("\n")} onChange={(e) => set({ qualities: e.target.value.split("\n") })} />
        </label>
      </div>

      <div className="panel">
        <h3>Step 3: what people read after each response</h3>
        <label><span>After the aggressive response</span><textarea value={c.feedback.aggressive} onChange={(e) => set({ feedback: { ...c.feedback, aggressive: e.target.value } })} /></label>
        <label><span>After the passive response</span><textarea value={c.feedback.passive} onChange={(e) => set({ feedback: { ...c.feedback, passive: e.target.value } })} /></label>
        <label><span>After the assertive response</span><textarea value={c.feedback.assertive} onChange={(e) => set({ feedback: { ...c.feedback, assertive: e.target.value } })} /></label>
      </div>

      <div className="panel">
        <h3>Plans and prices</h3>
        <div className="grid3">
          {c.plans.map((p, i) => (
            <div className="ch-edit" key={p.id} style={{ marginTop: 0 }}>
              <label><span>Name</span><input value={p.name} onChange={(e) => setPlan(i, { name: e.target.value })} /></label>
              <div className="grid2">
                <label><span>Price ($)</span>
                  <input type="number" min={0} step="1" value={p.priceCents / 100} onChange={(e) => setPlan(i, { priceCents: Math.round(Number(e.target.value) * 100) })} />
                </label>
                <label><span>Billing</span>
                  <select value={p.interval} onChange={(e) => setPlan(i, { interval: e.target.value as Plan["interval"], priceNote: e.target.value === "month" ? "/ month" : p.priceNote === "/ month" ? "one time" : p.priceNote })}>
                    <option value="one_time">One time</option>
                    <option value="month">Monthly</option>
                  </select>
                </label>
              </div>
              <label><span>Note beside the price</span><input value={p.priceNote} onChange={(e) => setPlan(i, { priceNote: e.target.value })} /></label>
              <label><span>What’s included (one per line)</span>
                <textarea value={p.features.join("\n")} onChange={(e) => setPlan(i, { features: e.target.value.split("\n") })} />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Your Horizon: booking</h3>
        <label><span>Booking link</span><input value={c.bookingUrl} onChange={(e) => set({ bookingUrl: e.target.value })} placeholder="https://" /></label>
        <label><span>Title</span><input value={c.bookingTitle} onChange={(e) => set({ bookingTitle: e.target.value })} /></label>
        <label><span>Text</span><textarea value={c.bookingText} onChange={(e) => set({ bookingText: e.target.value })} /></label>
      </div>

      <div className="savebar">
        <span>{msg || (dirty ? "You have unsaved changes" : "Everything is saved")}</span>
        <button
          className="linkbtn"
          onClick={() => start(async () => { await resetContent(); location.reload(); })}
        >
          Restore originals
        </button>
        <button
          className="btn btn-primary btn-sm"
          disabled={!dirty || pending}
          onClick={() => start(async () => { await saveContent(c); setDirty(false); setMsg("Saved. Visitors see your changes now."); })}
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
