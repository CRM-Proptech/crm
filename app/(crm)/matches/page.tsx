import Link from "next/link";
import { updateMatchStatus } from "@/actions/matches";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { MatchBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { requireUser } from "@/lib/auth";
import { MATCH_STATUS_LABELS, UNIT_TYPE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatInr } from "@/lib/format";

export default async function MatchesPage() {
  await requireUser();
  const matches = await db.propertyMatch.findMany({
    include: {
      requirement: { include: { customer: true } },
      unit: { include: { tower: { include: { project: true } } } },
    },
    orderBy: { score: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fit"
        title="Property matches"
        description="Scored against city, configuration, budget, availability, and possession."
      />

      {matches.length === 0 ? (
        <EmptyState
          title="No matches yet"
          description="Capture a buyer requirement and Keystone will score the floor book."
        />
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const reasons: string[] = JSON.parse(match.reasons);
            return (
              <Card key={match.id} className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <Link
                      href={`/customers/${match.requirement.customerId}`}
                      className="font-medium hover:underline"
                    >
                      {match.requirement.customer.name}
                    </Link>
                    <p className="mt-1 text-sm">
                      {match.unit.tower.project.name} · {match.unit.tower.name} {match.unit.number} ·{" "}
                      {UNIT_TYPE_LABELS[match.unit.type]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {match.unit.tower.project.locality}, {match.unit.tower.project.city} ·{" "}
                      {formatInr(match.unit.price)}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {reasons.map((reason) => (
                        <li key={reason} className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-mono text-3xl tabular-nums text-primary">{match.score}</p>
                    <form action={updateMatchStatus} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={match.id} />
                      <MatchBadge status={match.status} />
                      <Select name="status" defaultValue={match.status} className="w-36">
                        {Object.entries(MATCH_STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                      <SubmitButton variant="outline">Update</SubmitButton>
                    </form>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
