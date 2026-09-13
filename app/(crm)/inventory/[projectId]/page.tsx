import { notFound } from "next/navigation";
import { updateUnitStatus } from "@/actions/inventory";
import { PageHeader } from "@/components/page-header";
import { UnitBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { requireUser } from "@/lib/auth";
import { UNIT_STATUS_LABELS, UNIT_TYPE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatInr } from "@/lib/format";

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  await requireUser();
  const { projectId } = await params;

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      developer: true,
      towers: {
        include: { units: { orderBy: [{ floor: "asc" }, { number: "asc" }] } },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={project.developer.name}
        title={project.name}
        description={`${project.locality}, ${project.city}${project.amenities ? ` · ${project.amenities}` : ""}`}
      />

      {project.towers.map((tower) => (
        <Card key={tower.id} className="overflow-x-auto">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-serif text-xl">{tower.name}</h2>
            <p className="text-xs text-muted-foreground">{tower.floors} floors · {tower.units.length} units</p>
          </div>
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Floor</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Carpet</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tower.units.map((unit) => (
                <tr key={unit.id}>
                  <td className="px-4 py-3 font-medium">{unit.number}</td>
                  <td className="px-4 py-3 tabular-nums">{unit.floor}</td>
                  <td className="px-4 py-3">{UNIT_TYPE_LABELS[unit.type]}</td>
                  <td className="px-4 py-3 tabular-nums">{unit.carpetSqft} sqft</td>
                  <td className="px-4 py-3 font-mono tabular-nums">{formatInr(unit.price)}</td>
                  <td className="px-4 py-3">
                    <form action={updateUnitStatus} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={unit.id} />
                      <UnitBadge status={unit.status} />
                      <Select name="status" defaultValue={unit.status} className="h-9 w-32">
                        {Object.entries(UNIT_STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                      <SubmitButton variant="ghost" pendingLabel="…">
                        Set
                      </SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  );
}
