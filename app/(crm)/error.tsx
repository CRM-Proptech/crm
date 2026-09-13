"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-6 py-12 text-center">
      <h1 className="font-serif text-2xl">Something on this page failed</h1>
      <p className="mt-2 text-sm text-muted-foreground">Try again. If it keeps happening, sign out and back in.</p>
      <Button className="mt-5" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
