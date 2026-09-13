import { LeadForm } from "@/app/(crm)/leads/new/lead-form";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function NewLeadPage() {
  await requireUser();
  const users = await db.user.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Demand"
        title="New lead"
        description="If the phone or email already exists, this enquiry attaches to that customer."
      />
      <LeadForm users={users} />
    </div>
  );
}
