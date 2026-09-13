import Link from "next/link";
import { notFound } from "next/navigation";
import { assignLead, updateLeadStatus } from "@/actions/leads";
import { PageHeader } from "@/components/page-header";
import { LeadBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { LinkButton } from "@/components/ui/link-button";
import { requireUser } from "@/lib/auth";
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatDate, formatPhone } from "@/lib/format";

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ merged?: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const { merged } = await searchParams;

  const [lead, users] = await Promise.all([
    db.lead.findUnique({
      where: { id },
      include: { customer: { include: { leads: true, requirements: true } }, assignedTo: true },
    }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lead"
        title={lead.customer.name}
        description={`${LEAD_SOURCE_LABELS[lead.source]} · ${formatDate(lead.createdAt)}`}
        actions={
          <>
            <LinkButton href={`/customers/${lead.customerId}`} variant="outline">
              Open customer
            </LinkButton>
            <LeadBadge status={lead.status} />
          </>
        }
      />

      {merged ? (
        <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
          Same phone or email was already on file. This enquiry is attached to {lead.customer.name}
          {lead.customer.leads.length > 1 ? ` (${lead.customer.leads.length} leads)` : ""}.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-serif text-xl">Buyer</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-mono">{formatPhone(lead.customer.phone)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd>{lead.customer.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">City</dt>
              <dd>{lead.customer.city ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Prior enquiries</dt>
              <dd>{lead.customer.leads.length}</dd>
            </div>
          </dl>
          {lead.notes ? <p className="mt-4 text-sm">{lead.notes}</p> : null}
        </Card>

        <Card className="space-y-5 p-5">
          <form action={updateLeadStatus} className="space-y-3">
            <input type="hidden" name="id" value={lead.id} />
            <Field label="Status" htmlFor="status">
              <Select id="status" name="status" defaultValue={lead.status}>
                {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <SubmitButton pendingLabel="Updating…">Update status</SubmitButton>
          </form>
          <form action={assignLead} className="space-y-3">
            <input type="hidden" name="id" value={lead.id} />
            <Field label="Owner" htmlFor="assignedToId">
              <Select id="assignedToId" name="assignedToId" defaultValue={lead.assignedToId ?? ""}>
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            </Field>
            <SubmitButton variant="outline" pendingLabel="Assigning…">
              Assign
            </SubmitButton>
          </form>
          {lead.customer.requirements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No requirement yet.{" "}
              <Link href={`/customers/${lead.customerId}`} className="text-primary hover:underline">
                Capture one
              </Link>{" "}
              after qualifying.
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
