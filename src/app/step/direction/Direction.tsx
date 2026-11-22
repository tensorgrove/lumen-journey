"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { pop } from "@/components/fx";
import { savePurpose } from "../../actions";

const STANDS = ["a healthier life", "meaningful work", "a stronger family", "my own business", "creative freedom", "more confidence"];
const SO_THAT = [
  "I have energy for what matters",
  "my work makes a difference",
  "the people I love can thrive",
  "I feel proud of my days",
  "my goal becomes real",
];

export default function Direction({ strengths, saved }: { strengths: string[]; saved: string | null }) {
  const [phase, setPhase] = useState<"kindle" | "build" | "done">(saved ? "done" : "kindle");
  const [melt, setMelt] = useState(false);
  const [text, setText] = useState(saved ?? "");
  const [a, setA] = useState(STANDS[0]);
  const [b, setB] = useState(SO_THAT[0]);
  const [pending, start] = useTransition();
  const pot = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);

  function kindle() {
    setMelt(true);
    setTimeout(() => { pop(pot.current, flash.current); setPhase("build"); }, 700);
  }

  return (
    <section className="screen">
      <div className="lvl-head">
        <div className="eyebrow">Step 2 of 3</div>
        <h2>Set your direction</h2>
        <p className="sub">A clear direction keeps you going long after motivation fades. Place your strengths in the lantern and see where they point.</p>
      </div>
      <div className="step-card">
        <div className="kindle">
          <div className="left">
            {strengths.slice(0, 2).map((g) => (
              <span key={g} className={"mini" + (melt ? " melt" : "")} style={{ ["--dx" as string]: "120px" }}>{g}</span>
            ))}
          </div>
          <div className="lantern-wrap" ref={pot}><div className="flash" ref={flash} /><img src="/lantern.svg" alt="A glowing lantern" /></div>
          <div className="right">
            {strengths.slice(2).map((g) => (
              <span key={g} className={"mini" + (melt ? " melt" : "")} style={{ ["--dx" as string]: "-120px" }}>{g}</span>
            ))}
          </div>
        </div>

        {phase === "kindle" && (
          <div className="actions"><button className="btn btn-gold" onClick={kindle}>Light my direction</button></div>
        )}

        {phase === "build" && (
          <>
            <div className="sentence">
              I’m building toward
              <select value={a} onChange={(e) => setA(e.target.value)}>{STANDS.map((s) => <option key={s}>{s}</option>)}</select>
              so that
              <select value={b} onChange={(e) => setB(e.target.value)}>{SO_THAT.map((s) => <option key={s}>{s}</option>)}</select>
            </div>
            <div className="actions">
              <button
                className="btn btn-primary"
                disabled={pending}
                onClick={() => start(async () => { const r = await savePurpose(a, b); if (r.ok) { setText(r.text); setPhase("done"); } })}
              >
                {pending ? "Saving…" : "This is my direction"} <span className="arrow" />
              </button>
            </div>
          </>
        )}

        {phase === "done" && (
          <div className="purpose-out on">
            <div className="eyebrow">Your direction</div>
            <h3 style={{ marginTop: 8 }}>{text}</h3>
            <div className="actions">
              <Link className="btn btn-primary" href="/step/voice">On to step 3 <span className="arrow" /></Link>
              <button className="btn btn-ghost" onClick={() => { setMelt(false); setPhase("kindle"); }}>Try again</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
