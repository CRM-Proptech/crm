import { LinkButton } from "@/components/ui/link-button";

export default function NotFound() {
  return (
    <div className="rounded-lg border border-border bg-card px-6 py-12 text-center">
      <h1 className="font-serif text-2xl">That record is not here</h1>
      <p className="mt-2 text-sm text-muted-foreground">It may have been merged or removed.</p>
      <div className="mt-5">
        <LinkButton href="/dashboard">Back to dashboard</LinkButton>
      </div>
    </div>
  );
}
