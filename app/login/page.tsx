import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      <section className="hidden bg-sidebar px-10 py-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <p className="font-serif text-3xl tracking-tight">Keystone</p>
        <div className="max-w-md space-y-4">
          <h1 className="font-serif text-5xl leading-tight">The floor book, finally in one place.</h1>
          <p className="text-sm leading-6 text-sidebar-muted">
            Who to call. What to show. What is blocking the deal. Property stays a first-class object — not a field on a lead.
          </p>
        </div>
        <p className="text-xs text-sidebar-muted">Phase 1 · Core CRM</p>
      </section>
      <section className="login-paper flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <p className="font-serif text-3xl lg:hidden">Keystone</p>
            <h2 className="mt-2 font-serif text-3xl tracking-tight">Sign in to the floor book</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Demo: <span className="font-mono">ananya@keystone.local</span> / <span className="font-mono">keystone</span>
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
