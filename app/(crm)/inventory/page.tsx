import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function InventoryPage() {
  await requireUser();
  const projects = await db.project.findMany({
    include: {
      developer: true,
      towers: { include: { units: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Stock"
        title="Inventory"
        description="Projects, towers, and units are first-class — not a dropdown on a lead."
      />

      {projects.length === 0 ? (
        <EmptyState title="No stock loaded" description="Seed the database to load the sample floor book." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => {
            const units = project.towers.flatMap((tower) => tower.units);
            const available = units.filter((unit) => unit.status === "AVAILABLE").length;
            const held = units.filter((unit) => unit.status === "HELD").length;
            const sold = units.filter((unit) => unit.status === "SOLD" || unit.status === "BOOKED").length;

            return (
              <Link key={project.id} href={`/inventory/${project.id}`}>
                <Card className="h-full p-5 transition-colors duration-150 hover:bg-accent">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{project.developer.name}</p>
                  <h2 className="mt-2 font-serif text-2xl">{project.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {project.locality}, {project.city} · {project.possession ?? "Possession TBC"}
                  </p>
                  <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Available</dt>
                      <dd className="font-mono text-lg tabular-nums">{available}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Held</dt>
                      <dd className="font-mono text-lg tabular-nums">{held}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Booked</dt>
                      <dd className="font-mono text-lg tabular-nums">{sold}</dd>
                    </div>
                  </dl>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
