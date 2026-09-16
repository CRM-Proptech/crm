import Link from "next/link";
import { moveOpportunity } from "@/actions/pipeline";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SubmitButton } from "@/components/submit-button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { requireUser } from "@/lib/auth";
import { PIPELINE_STAGES, STAGE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatInr } from "@/lib/format";

export default async function PipelinePage() {
  await requireUser();
  const opportunities = await db.opportunity.findMany({
    include: {
      customer: true,
      owner: true,
      unit: { include: { tower: { include: { project: true } } } },
      _count: { select: { offers: { where: { status: "PENDING" } }, holds: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Deals"
        title="Pipeline"
        description="A deal is a customer moving toward a specific unit — not a renamed lead."
      />

      {opportunities.length === 0 ? (
        <EmptyState
          title="Pipeline is empty"
          description="Qualify a lead and Keystone opens an opportunity on that customer."
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const cards = opportunities.filter((item) => item.stage === stage);
            return (
              <section key={stage} className="w-72 shrink-0">
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="text-sm font-medium">{STAGE_LABELS[stage]}</h2>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">{cards.length}</span>
                </div>
                <div className="space-y-3">
                  {cards.map((opp) => (
                    <Card key={opp.id} className="p-4">
                      <Link href={`/pipeline/${opp.id}`} className="font-medium hover:underline">{opp.customer.name}</Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {opp.unit
                          ? `${opp.unit.tower.project.name} ${opp.unit.number}`
                          : "No unit yet"}
                      </p>
                      <p className="mt-2 font-mono text-sm tabular-nums">
                        {opp.value ? formatInr(opp.value) : "—"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{opp.owner.name}</p>
                      {opp._count.offers ? <p className="mt-2 text-xs font-medium text-warning">Approval pending</p> : null}
                      {opp._count.holds ? <p className="mt-1 text-xs font-medium text-primary">Active unit hold</p> : null}
                      <form action={moveOpportunity} className="mt-3 space-y-2">
                        <input type="hidden" name="id" value={opp.id} />
                        <label htmlFor={`stage-${opp.id}`} className="sr-only">
                          Move {opp.customer.name}
                        </label>
                        <Select id={`stage-${opp.id}`} name="stage" defaultValue={opp.stage}>
                          {PIPELINE_STAGES.map((value) => (
                            <option key={value} value={value}>
                              {STAGE_LABELS[value]}
                            </option>
                          ))}
                        </Select>
                        <SubmitButton variant="outline" pendingLabel="Moving…">
                          Move
                        </SubmitButton>
                      </form>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
