import Link from "next/link";
import { getContent } from "@/lib/data";

export default async function Home() {
  const c = await getContent();
  return (
    <section className="screen">
      <div className="hero center">
        <div className="script">with Maya Hart</div>
        <h1>{c.headline}</h1>
        <div className="lantern-wrap"><img src="/lantern.svg" alt="A glowing lantern" /></div>
        <p className="sub">{c.intro}</p>
        <div className="paths">
          <Link className="path p1" href="/lantern?path=challenge">
            <span className="free">Free first step</span>
            <h3>Transform a challenge</h3>
            <p>Something is weighing on you. Bring it to the lantern and see the strengths it lights up.</p>
            <div className="go">Begin <span className="arrow" /></div>
          </Link>
          <Link className="path p2" href="/lantern?path=purpose">
            <span className="free">Free first step</span>
            <h3>Find your purpose</h3>
            <p>You have a goal, or you’re searching for direction. Find what keeps you moving.</p>
            <div className="go">Begin <span className="arrow" /></div>
          </Link>
        </div>
      </div>
    </section>
  );
}
