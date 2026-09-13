import { updateVisit } from "@/actions/visits";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { VisitBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LinkButton } from "@/components/ui/link-button";
import { requireUser } from "@/lib/auth";
import { VISIT_STATUS_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export default async function VisitsPage() {
  await requireUser();
  const visits = await db.siteVisit.findMany({
    include: {
      customer: true,
      project: true,
      unit: true,
      hostedBy: true,
    },
    orderBy: { scheduledAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="On site"
        title="Site visits"
        description="A visit is how inventory becomes a deal. Log the outcome before the trail goes cold."
        actions={<LinkButton href="/visits/new">Schedule visit</LinkButton>}
      />

      {visits.length === 0 ? (
        <EmptyState
          title="No visits booked"
          description="Schedule the first walkthrough against a project, not a generic calendar note."
        />
      ) : (
        <div className="space-y-3">
          {visits.map((visit) => (
            <Card key={visit.id} className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="font-medium">{visit.customer.name}</p>
                  <p className="text-sm">
                    {visit.project.name}
                    {visit.unit ? ` · ${visit.unit.number}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(visit.scheduledAt)} · {visit.hostedBy.name}
                  </p>
                  {visit.feedback ? <p className="mt-2 text-sm">{visit.feedback}</p> : null}
                </div>
                <form action={updateVisit} className="w-full max-w-sm space-y-2">
                  <input type="hidden" name="id" value={visit.id} />
                  <div className="flex items-center gap-2">
                    <VisitBadge status={visit.status} />
                    <Select name="status" defaultValue={visit.status}>
                      {Object.entries(VISIT_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Field label="Outcome notes" htmlFor={`feedback-${visit.id}`}>
                    <Textarea
                      id={`feedback-${visit.id}`}
                      name="feedback"
                      defaultValue={visit.feedback ?? ""}
                      className="min-h-20"
                    />
                  </Field>
                  <SubmitButton variant="outline">Save visit</SubmitButton>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
