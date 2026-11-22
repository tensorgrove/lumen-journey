"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Challenge, PathId } from "@/lib/content";
import { CloudShape } from "@/components/Cloud";
import { pop } from "@/components/fx";
import { recordLantern } from "../actions";

export default function LanternLevel({
  path,
  challenges,
  signedIn,
}: {
  path: PathId;
  challenges: Challenge[];
  signedIn: boolean;
}) {
  const mine = challenges.filter((c) => c.path === path);
  const others = challenges.filter((c) => c.path !== path);
  // alternate placement left/right; own path first and full strength
  const ordered = [...mine.map((c) => ({ c, other: false })), ...others.map((c) => ({ c, other: true }))];
  const left = ordered.filter((_, i) => i % 2 === 0);
  const right = ordered.filter((_, i) => i % 2 === 1);

  const [hidden, setHidden] = useState<string | null>(null);
  const [result, setResult] = useState<Challenge | null>(null);
  const busy = useRef(false);
  const potRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  function drop(ch: Challenge, el: HTMLButtonElement) {
    if (busy.current) return;
    busy.current = true;
    setResult(null);
    setHidden(ch.id);
    const save = recordLantern(path, ch.id).catch(() => null);

    const r = el.getBoundingClientRect();
    const pot = potRef.current!.getBoundingClientRect();
    const fly = el.cloneNode(true) as HTMLElement;
    fly.classList.add("flying");
    fly.classList.remove("other");
    Object.assign(fly.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", margin: "0", visibility: "visible" });
    document.body.appendChild(fly);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        fly.style.left = pot.left + pot.width / 2 - r.width / 2 + "px";
        fly.style.top = pot.top + pot.height * 0.12 - r.height / 2 + "px";
        fly.style.transform = "scale(.12)";
        fly.style.opacity = "0";
      }),
    );
    setTimeout(() => {
      fly.remove();
      pop(potRef.current, flashRef.current);
      setTimeout(async () => {
        setResult(ch);
        await save;
        busy.current = false;
      }, 380);
    }, 860);
  }

  const cloud = ({ c, other }: { c: Challenge; other: boolean }) => (
    <button
      key={c.id}
      className={"cloud" + (other ? " other" : "")}
      style={{ visibility: hidden === c.id ? "hidden" : undefined }}
      onClick={(e) => drop(c, e.currentTarget)}
      data-id={c.id}
    >
      <CloudShape ch={c} />
      <span>{c.name}</span>
    </button>
  );

  return (
    <section className="screen">
      <div className="lvl-head">
        <div className="eyebrow">Free step · The Lantern</div>
        <h2>{path === "purpose" ? "Bring what you’re reaching for" : "Bring what’s weighing on you"}</h2>
        <p className="sub">and see what it lights up. Tap one to place it in the lantern.</p>
      </div>
      <div className="arena">
        <div className="clouds">{left.map(cloud)}</div>
        <div className="lantern-wrap" ref={potRef}>
          <div className="flash" ref={flashRef} />
          <img src="/lantern.svg" alt="A glowing lantern" />
        </div>
        <div className="clouds right">{right.map(cloud)}</div>
      </div>
      <div className="results">
        {result?.out.map((o) => <span className="pill" key={o}>{o}</span>)}
      </div>
      <div className={"insight" + (result ? " on" : "")}>
        {result && (
          <>
            <q>{result.quote}</q>
            <div className="who">Maya Hart</div>
            {signedIn ? (
              <Link className="btn btn-primary" href="/journey">Continue your journey <span className="arrow" /></Link>
            ) : (
              <>
                <Link className="btn btn-primary" href="/signup?next=/journey">Save my journey and continue <span className="arrow" /></Link>
                <p className="hint">Free account. Your result is saved so you can pick up where you left off.</p>
              </>
            )}
            <div>
              <button className="restart" onClick={() => { setResult(null); setHidden(null); scrollTo({ top: 0, behavior: "smooth" }); }}>
                Try another one
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
