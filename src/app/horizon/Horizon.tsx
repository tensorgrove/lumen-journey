"use client";

import { useRef, useState } from "react";
import { sparkBurst } from "@/components/fx";
import { openHorizon, restartJourney } from "../actions";

export default function Horizon(props: {
  opened: boolean;
  strengths: string[];
  purpose: string;
  returns: string;
  bookingUrl: string;
  bookingTitle: string;
  bookingText: string;
}) {
  const [open, setOpen] = useState(props.opened);
  const [after, setAfter] = useState(props.opened);
  const scene = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);

  function go() {
    setOpen(true);
    sparkBurst(scene.current, 30);
    openHorizon();
    setTimeout(() => { setAfter(true); setTimeout(() => afterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }, 1300);
  }

  return (
    <section className="screen">
      <div className="lvl-head">
        <div className="eyebrow">Your horizon</div>
        <h2>Look how far you’ve come</h2>
        <p className="sub">Your strengths, your direction and your voice, all pointing the same way.</p>
      </div>
      <div className={"horizon-scene" + (open ? " open" : "")} ref={scene}>
        <img src="/horizon.svg" alt="A path winding through mountains toward a rising sun" />
        <div className="glow" />
        <div className="cover"><button className="btn btn-gold" onClick={go}>Reveal your horizon</button></div>
      </div>
      {after && (
        <div ref={afterRef}>
          <div className="values">Clarity. Courage. Kindness.</div>
          <div className="summary">
            <div><small>Your strengths</small><b>{props.strengths.join(" · ") || "—"}</b></div>
            <div><small>Your direction</small><b>{props.purpose || "—"}</b></div>
            <div><small>What you gained</small><b>{props.returns || "—"}</b></div>
          </div>
          <div className="book">
            <img src="/badge.svg" alt="Lumen Coaching badge" />
            <div>
              <h3>{props.bookingTitle}</h3>
              <p className="small" style={{ fontSize: 16, color: "var(--ink)", marginTop: 6 }}>{props.bookingText}</p>
              <a className="btn btn-primary" href={props.bookingUrl} target="_blank" rel="noopener">Book your free clarity call <span className="arrow" /></a>
            </div>
          </div>
                    <form action={restartJourney}><button className="restart" type="submit">Start the journey again</button></form>
        </div>
      )}
    </section>
  );
}
