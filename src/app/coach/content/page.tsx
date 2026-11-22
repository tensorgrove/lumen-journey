import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getContent } from "@/lib/data";
import ContentEditor from "./ContentEditor";

export default async function ContentPage() {
  const me = await getUser();
  if (!me?.isAdmin) redirect("/signin?next=/coach/content");
  const content = await getContent();
  return (
    <section className="screen admin">
      <div className="admin-head">
        <div>
          <div className="eyebrow">Coach view</div>
          <h2>Your words &amp; prices</h2>
          <p className="sub" style={{ marginTop: 6 }}>Change anything here and press Save. Visitors see it right away.</p>
        </div>
        <Link className="btn btn-ghost btn-sm" href="/" target="_blank">See it as a visitor ↗</Link>
      </div>
      <div className="tabs">
        <Link href="/coach">Overview</Link>
        <Link href="/coach/content" className="on">Your words &amp; prices</Link>
      </div>
      <ContentEditor initial={content} />
    </section>
  );
}
