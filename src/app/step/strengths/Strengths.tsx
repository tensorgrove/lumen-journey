"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveStrengths } from "../../actions";

export default function Strengths({ qualities, initial }: { qualities: string[]; initial: string[] }) {
  const [sel, setSel] = useState<string[]>(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toggle = (q: string) =>
    setSel((s) => (s.includes(q) ? s.filter((x) => x !== q) : s.length < 3 ? [...s, q] : s));

  return (
    <section className="screen">
      <div className="lvl-head">
        <div className="eyebrow">Step 1 of 3</div>
        <h2>Name your strengths</h2>
        <p className="sub">You already carry more than you think. Choose the three qualities that feel most like you.</p>
      </div>
      <div className="step-card">
        <div className="chips">
          {qualities.map((q) => (
            <button key={q} className={"chip" + (sel.includes(q) ? " sel" : "")} onClick={() => toggle(q)}>{q}</button>
          ))}
        </div>
        <div className="counter">{sel.length} of 3 chosen</div>
        <div className="actions">
          <button
            className="btn btn-primary"
            disabled={sel.length !== 3 || pending}
            onClick={() => start(async () => { const r = await saveStrengths(sel); if (r.ok) router.push("/step/direction"); })}
          >
            {pending ? "Saving…" : "These are my strengths"} <span className="arrow" />
          </button>
        </div>
      </div>
    </section>
  );
}
