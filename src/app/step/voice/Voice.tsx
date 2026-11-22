"use client";

import Link from "next/link";
import { useState } from "react";
import type { SiteContent } from "@/lib/content";
import { sparkBurst } from "@/components/fx";
import { completeVoice } from "../../actions";

type K = "bad" | "meh" | "good";
const OPTS: { k: K; label: string; text: string }[] = [
  { k: "bad", label: "Response A", text: "“That was MY idea. You always do this, and everyone here knows it.”" },
  { k: "meh", label: "Response B", text: "Say nothing. Let it go, and stew about it on the drive home." },
  { k: "good", label: "Response C", text: "“I’d like to finish my point. That idea came from my proposal on Tuesday, and I’m glad it’s landing. Here’s the next piece of it.”" },
];

export default function Voice({ feedback, done }: { feedback: SiteContent["feedback"]; done: boolean }) {
  const [pick, setPick] = useState<K | null>(done ? "good" : null);
  const fb = { bad: feedback.aggressive, meh: feedback.passive, good: feedback.assertive };

  async function choose(k: K, el: HTMLElement) {
    setPick(k);
    if (k === "good") { sparkBurst(el, 14); await completeVoice(); }
  }

  return (
    <section className="screen">
      <div className="lvl-head">
        <div className="eyebrow">Step 3 of 3</div>
        <h2>Find your voice</h2>
        <p className="sub">When something feels unfair, most of us either push back hard or go quiet. Practice the calm, clear middle path.</p>
      </div>
      <div className="step-card">
        <div className="scenario">
          <div className="eyebrow">The moment</div>
          <p>In a meeting, a colleague talks over you and presents your idea as their own.</p>
        </div>
        <div className="opts">
          {OPTS.map((o) => (
            <button key={o.k} className={"opt" + (pick === o.k ? " " + o.k : "")} onClick={(e) => choose(o.k, e.currentTarget)}>
              <b>{o.label}</b>{o.text}
            </button>
          ))}
        </div>
        {pick && <div className={`fb on ${pick}`}>{fb[pick]}</div>}
        {pick === "good" && (
          <div className="actions"><Link className="btn btn-gold" href="/horizon">See your horizon <span className="arrow" /></Link></div>
        )}
      </div>
    </section>
  );
}
