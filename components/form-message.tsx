export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;

  return (
    <p
      role="alert"
      className={
        error
          ? "rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          : "rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
      }
    >
      {error ?? success}
    </p>
  );
}
