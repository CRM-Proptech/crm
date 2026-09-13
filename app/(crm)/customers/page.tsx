import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPhone } from "@/lib/format";

export default async function CustomersPage() {
  await requireUser();
  const customers = await db.customer.findMany({
    include: {
      _count: { select: { leads: true, requirements: true, opportunities: true, siteVisits: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="People"
        title="Customers"
        description="One buyer record. Every lead, requirement, visit, and deal sits on it."
        actions={<LinkButton href="/leads/new">Add from a lead</LinkButton>}
      />

      {customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Customers are created when you take a lead — we do not keep a separate orphan list."
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Leads</th>
                <th className="px-4 py-3 font-medium">Requirements</th>
                <th className="px-4 py-3 font-medium">Deals</th>
                <th className="px-4 py-3 font-medium">Visits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-accent/60">
                  <td className="px-4 py-3">
                    <Link href={`/customers/${customer.id}`} className="font-medium hover:underline">
                      {customer.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{customer.city}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{formatPhone(customer.phone)}</td>
                  <td className="px-4 py-3 tabular-nums">{customer._count.leads}</td>
                  <td className="px-4 py-3 tabular-nums">{customer._count.requirements}</td>
                  <td className="px-4 py-3 tabular-nums">{customer._count.opportunities}</td>
                  <td className="px-4 py-3 tabular-nums">{customer._count.siteVisits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
