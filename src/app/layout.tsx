import type { Metadata } from "next";
import Link from "next/link";
// Fonts are bundled with the app (no requests to Google Fonts), so it works fully offline.
import "@fontsource/playfair-display/700-italic.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/playfair-display/800.css";
import "@fontsource/playfair-display/900.css";
import "./globals.css";
import { getUser } from "@/lib/auth";
import { getProgress } from "@/lib/data";
import { STEPS } from "@/lib/content";
import { isTestMode, stripeEnabled } from "@/lib/stripe";
import { signOut } from "./actions";

export const metadata: Metadata = {
  title: "The Lumen Journey · Lumen Coaching",
  description: "A guided coaching journey: turn what’s weighing on you into what moves you forward, one step at a time.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const p = user ? await getProgress(user.id) : null;
  const done = p?.steps.length ?? 0;
  const payMode = !stripeEnabled() ? "demo" : isTestMode() ? "test" : "live";

  return (
    <html lang="en">
      <body>
        {payMode !== "live" && (
          <div className="testbar">
            {payMode === "demo"
              ? "Preview · payments are simulated, nothing is charged"
              : <>Preview · Stripe test mode, use card <code>4242 4242 4242 4242</code>, nothing is charged</>}
          </div>
        )}
        <header className="top">
          <Link href="/" className="brand">
            <span className="script">Lumen</span>
            <span className="t">The Lumen Journey</span>
          </Link>
          <div className="right">
            {user && !user.isAdmin && (
              <div className="prog">
                <span>{done ? `${done} of ${STEPS.length}` : "Start"}</span>
                <div className="bar"><i style={{ width: `${(done / STEPS.length) * 100}%` }} /></div>
              </div>
            )}
            <nav>
              {user ? (
                <>
                  {user.isAdmin && <Link href="/coach">Coach dashboard</Link>}
                  <Link href="/journey">My journey</Link>
                  <span className="who">{user.name || user.email}</span>
                  <form action={signOut}><button type="submit">Sign out</button></form>
                </>
              ) : (
                <Link href="/signin">Sign in</Link>
              )}
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
