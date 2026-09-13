import Link from "next/link";
import { notFound } from "next/navigation";
import { RequirementForm } from "@/app/(crm)/customers/[id]/requirement-form";
import { PageHeader } from "@/components/page-header";
import { LeadBadge, StageBadge, VisitBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateCustomer } from "@/actions/customers";
import { refreshMatches } from "@/actions/requirements";
import { requireUser } from "@/lib/auth";
import { LEAD_SOURCE_LABELS, UNIT_TYPE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatDate, formatDateTime, formatInr, formatPhone, parseUnitTypes } from "@/lib/format";
import type { UnitType } from "@prisma/client";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      leads: { include: { assignedTo: true }, orderBy: { createdAt: "desc" } },
      requirements: { include: { matches: { include: { unit: { include: { tower: { include: { project: true } } } } } } } },
      opportunities: { include: { owner: true, unit: true }, orderBy: { updatedAt: "desc" } },
      siteVisits: { include: { project: true }, orderBy: { scheduledAt: "desc" } },
      activities: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 8 },
    },
  });

  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer"
        title={customer.name}
        description={`${formatPhone(customer.phone)}${customer.email ? ` · ${customer.email}` : ""}`}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <h2 className="font-serif text-xl">Record</h2>
          <form action={updateCustomer} className="mt-4 grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={customer.id} />
            <Field label="Name" htmlFor="name" required>
              <Input id="name" name="name" defaultValue={customer.name} required />
            </Field>
            <Field label="Phone" htmlFor="phone" required>
              <Input id="phone" name="phone" type="tel" defaultValue={customer.phone} required />
            </Field>
            <Field label="Email" htmlFor="email">
              <Input id="email" name="email" type="email" defaultValue={customer.email ?? ""} />
            </Field>
            <Field label="City" htmlFor="city">
              <Input id="city" name="city" defaultValue={customer.city ?? ""} />
            </Field>
            <Field label="Notes" htmlFor="notes" className="sm:col-span-2">
              <Textarea id="notes" name="notes" defaultValue={customer.notes ?? ""} />
            </Field>
            <SubmitButton>Save customer</SubmitButton>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="font-serif text-xl">What happened</h2>
          <ul className="mt-4 space-y-3">
            {customer.activities.length === 0 ? (
              <li className="text-sm text-muted-foreground">No timeline yet.</li>
            ) : (
              customer.activities.map((item) => (
                <li key={item.id}>
                  <p className="text-sm">{item.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.user.name} · {formatDateTime(item.createdAt)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-serif text-xl">Leads</h2>
        <ul className="mt-4 divide-y divide-border">
          {customer.leads.map((lead) => (
            <li key={lead.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
                {LEAD_SOURCE_LABELS[lead.source]} · {formatDate(lead.createdAt)}
              </Link>
              <LeadBadge status={lead.status} />
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="font-serif text-xl">Buyer requirements</h2>
        {customer.requirements.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nothing captured. Add what they actually want to buy.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {customer.requirements.map((req) => (
              <li key={req.id} className="rounded-md border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {req.city}
                      {req.locality ? ` · ${req.locality}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {parseUnitTypes(req.unitTypes)
                        .map((type) => UNIT_TYPE_LABELS[type as UnitType] ?? type)
                        .join(", ")}{" "}
                      · {formatInr(req.budgetMin)}–{formatInr(req.budgetMax)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{req.matches.length} property matches</p>
                  </div>
                  <form action={refreshMatches}>
                    <input type="hidden" name="requirementId" value={req.id} />
                    <SubmitButton variant="outline" pendingLabel="Matching…">
                      Run matching
                    </SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 border-t border-border pt-5">
          <h3 className="text-sm font-medium">New requirement</h3>
          <RequirementForm customerId={customer.id} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-serif text-xl">Pipeline</h2>
          <ul className="mt-4 divide-y divide-border">
            {customer.opportunities.length === 0 ? (
              <li className="py-3 text-sm text-muted-foreground">Qualify a lead to open a deal.</li>
            ) : (
              customer.opportunities.map((opp) => (
                <li key={opp.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{opp.owner.name}</p>
                    <p className="text-xs text-muted-foreground">{opp.value ? formatInr(opp.value) : "No value yet"}</p>
                  </div>
                  <StageBadge stage={opp.stage} />
                </li>
              ))
            )}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="font-serif text-xl">Site visits</h2>
          <ul className="mt-4 divide-y divide-border">
            {customer.siteVisits.length === 0 ? (
              <li className="py-3 text-sm text-muted-foreground">
                <Link href="/visits/new" className="text-primary hover:underline">
                  Schedule a visit
                </Link>
              </li>
            ) : (
              customer.siteVisits.map((visit) => (
                <li key={visit.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{visit.project.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(visit.scheduledAt)}</p>
                  </div>
                  <VisitBadge status={visit.status} />
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
