import AuthForm from "../AuthForm";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <section className="screen">
      <AuthForm mode="signin" next={next ?? ""} />
    </section>
  );
}
