import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LeadBadge, StageBadge, VisitBadge } from "@/components/status-badge";
import { canManageTeam, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, formatInr } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const stale = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5);

  const [
    uncontacted,
    highFit,
    upcomingVisits,
    blocking,
    likelyClose,
    recentActivity,
    leadCount,
    availableUnits,
    openTasks,
    pendingApprovals,
    activeHolds,
  ] = await Promise.all([
    db.lead.findMany({
      where: { status: "NEW" },
      include: { customer: true, assignedTo: true },
      orderBy: { createdAt: "asc" },
      take: 6,
    }),
    db.propertyMatch.findMany({
      where: { status: { in: ["SUGGESTED", "SHORTLISTED"] }, score: { gte: 70 } },
      include: {
        requirement: { include: { customer: true } },
        unit: { include: { tower: { include: { project: true } } } },
      },
      orderBy: { score: "desc" },
      take: 6,
    }),
    db.siteVisit.findMany({
      where: { status: "SCHEDULED", scheduledAt: { gte: now } },
      include: { customer: true, project: true },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
    db.opportunity.findMany({
      where: { stage: { in: ["QUALIFIED", "MATCHING", "SITE_VISIT"] }, updatedAt: { lt: stale } },
      include: { customer: true },
      orderBy: { updatedAt: "asc" },
      take: 5,
    }),
    db.opportunity.findMany({
      where: { stage: "NEGOTIATION" },
      include: { customer: true, unit: { include: { tower: { include: { project: true } } } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.activity.findMany({
      include: { user: true, customer: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.lead.count({ where: { status: { in: ["NEW", "CONTACTED", "QUALIFIED"] } } }),
    db.unit.count({ where: { status: "AVAILABLE" } }),
    db.task.count({ where: { status: "OPEN", assigneeId: canManageTeam(user.role) ? undefined : user.id } }),
    db.offer.count({ where: { status: "PENDING" } }),
    db.unitHold.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Today"
        title={`Good to see you, ${user.name.split(" ")[0]}`}
        description="Who to contact, what to show, and what is blocking a booking."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Open leads" value={leadCount} href="/leads" />
        <Stat label="Units on the floor" value={availableUnits} href="/inventory" />
        <Stat label="High-fit matches" value={highFit.length} href="/matches" />
        <Stat label="In negotiation" value={likelyClose.length} href="/pipeline" />
        <Stat label="Open tasks" value={openTasks} href="/tasks" />
        {canManageTeam(user.role) ? <Stat label="Pending approvals" value={pendingApprovals} href="/pipeline" /> : null}
        <Stat label="Active holds" value={activeHolds} href="/pipeline" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <SectionTitle href="/leads" title="Who should I contact?" />
          {uncontacted.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">No uncontacted leads. The floor is current.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {uncontacted.map((lead) => (
                <li key={lead.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
                      {lead.customer.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {lead.customer.city ?? "City unknown"} · {lead.assignedTo?.name ?? "Unassigned"}
                    </p>
                  </div>
                  <LeadBadge status={lead.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle href="/matches" title="What should I show them?" />
          {highFit.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">No high-fit matches yet. Capture a requirement.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {highFit.map((match) => (
                <li key={match.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{match.requirement.customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {match.unit.tower.project.name} · {match.unit.number} · {formatInr(match.unit.price)}
                    </p>
                  </div>
                  <span className="font-mono text-sm tabular-nums text-primary">{match.score}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle href="/visits" title="What happened?" />
          {recentActivity.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Activity will land here as the team works.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recentActivity.map((item) => (
                <li key={item.id}>
                  <p className="text-sm">{item.message}</p>
                  <p className="text-xs text-muted-foreground">
                     {item.user?.name ?? "Keystone automation"} · {formatDateTime(item.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle href="/pipeline" title="What is blocking the deal?" />
          {blocking.length === 0 && upcomingVisits.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Nothing stale. Keep pushing negotiation.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {upcomingVisits.map((visit) => (
                <li key={visit.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{visit.customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {visit.project.name} · {formatDateTime(visit.scheduledAt)}
                    </p>
                  </div>
                  <VisitBadge status={visit.status} />
                </li>
              ))}
              {blocking.map((opp) => (
                <li key={opp.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{opp.customer.name}</p>
                    <p className="text-xs text-muted-foreground">Quiet for 5+ days</p>
                  </div>
                  <StageBadge stage={opp.stage} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle href="/pipeline" title="What is likely to close?" />
        {likelyClose.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Nothing in negotiation"
              description="Move a matched visit into negotiation when pricing talks start."
            />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {likelyClose.map((opp) => (
              <li key={opp.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{opp.customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {opp.unit
                      ? `${opp.unit.tower.project.name} ${opp.unit.number}`
                      : "No unit attached"}
                  </p>
                </div>
                <p className="font-mono text-sm tabular-nums">{opp.value ? formatInr(opp.value) : "—"}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-lg border border-border bg-card p-4 transition-colors duration-150 hover:bg-accent">
      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-3xl tabular-nums">{value}</p>
    </Link>
  );
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-serif text-xl">{title}</h2>
      <Link href={href} className="text-sm text-primary hover:underline">
        Open
      </Link>
    </div>
  );
}
