import { LeadForm } from "@/app/(crm)/leads/new/lead-form";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";

export default async function NewLeadPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Demand"
        title="New lead"
        description="If the phone or email already exists, this enquiry attaches to that customer."
      />
       <LeadForm />
    </div>
  );
}
