import AuthForm from "../AuthForm";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <section className="screen">
      <div className="lvl-head" style={{ marginBottom: 6 }}>
        <p className="sub">Create a free account to save your journey and pick up where you left off, on any device.</p>
      </div>
      <AuthForm mode="signup" next={next ?? "/journey"} />
    </section>
  );
}
