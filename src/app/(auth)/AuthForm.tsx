"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type FormState } from "../actions";

export default function AuthForm({ mode, next }: { mode: "signin" | "signup"; next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "signup" ? signUp : signIn, undefined);
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <div className="auth">
      <form className="sheet" action={action}>
        <div className="eyebrow">{mode === "signup" ? "Save your journey" : "Welcome back"}</div>
        <h3>{mode === "signup" ? "Create your free account" : "Sign in"}</h3>
        <input type="hidden" name="next" value={next} />
        {mode === "signup" && (
          <label className="field"><span>Name</span><input name="name" placeholder="Your name" autoComplete="name" /></label>
        )}
        <label className="field"><span>Email</span><input name="email" type="email" required placeholder="you@example.com" autoComplete="email" /></label>
        <label className="field">
          <span>Password</span>
          <input name="password" type="password" required minLength={mode === "signup" ? 8 : 1} placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
        </label>
        {state?.error && <div className="err">{state.error}</div>}
        <div className="row">
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? "One moment…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </div>
        <p className="switch">
          {mode === "signup" ? (
            <>Already have an account? <Link href={`/signin${q}`}>Sign in</Link></>
          ) : (
            <>New here? <Link href={`/signup${q}`}>Create a free account</Link></>
          )}
        </p>
      </form>
    </div>
  );
}
