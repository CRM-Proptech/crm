export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 rounded-md bg-muted animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
      <div className="h-72 rounded-lg bg-muted animate-pulse" />
    </div>
  );
}
