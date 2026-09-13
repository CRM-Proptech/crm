import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LeadBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { requireUser } from "@/lib/auth";
import { LEAD_SOURCE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatDate, formatPhone } from "@/lib/format";

export default async function LeadsPage() {
  await requireUser();
  const leads = await db.lead.findMany({
    include: { customer: true, assignedTo: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Demand"
        title="Leads"
        description="New demand comes in here. Duplicate phones attach to the existing customer."
        actions={<LinkButton href="/leads/new">New lead</LinkButton>}
      />

      {leads.length === 0 ? (
        <EmptyState
          title="No leads yet"
          description="Capture the first enquiry and Keystone will keep the customer record clean."
          action={
            <Link href="/leads/new" className="text-sm text-primary hover:underline">
              Add a lead
            </Link>
          }
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Buyer</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-accent/60">
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
                      {lead.customer.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{lead.customer.city}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums">{formatPhone(lead.customer.phone)}</td>
                  <td className="px-4 py-3">{LEAD_SOURCE_LABELS[lead.source]}</td>
                  <td className="px-4 py-3">{lead.assignedTo?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <LeadBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
