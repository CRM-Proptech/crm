import { VisitForm } from "@/app/(crm)/visits/new/visit-form";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function NewVisitPage() {
  const user = await requireUser();
  const [customers, projects, users, opportunities] = await Promise.all([
    db.customer.findMany({ orderBy: { name: "asc" } }),
    db.project.findMany({
      include: { towers: { include: { units: true } } },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.opportunity.findMany({
      where: { stage: { notIn: ["WON", "LOST"] } },
      include: { customer: true },
    }),
  ]);

  const units = projects.flatMap((project) =>
    project.towers.flatMap((tower) =>
      tower.units.map((unit) => ({
        id: unit.id,
        label: `${project.name} · ${tower.name} ${unit.number}`,
        projectId: project.id,
      })),
    ),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="On site"
        title="Schedule a visit"
        description="Attach the buyer to a project — and a unit if you already know which door."
      />
      <VisitForm
        customers={customers}
        projects={projects.map((project) => ({ id: project.id, name: project.name }))}
        units={units}
        users={users}
        opportunities={opportunities.map((item) => ({
          id: item.id,
          label: `${item.customer.name} · ${item.stage.toLowerCase()}`,
        }))}
        defaultHostId={user.id}
      />
    </div>
  );
}
