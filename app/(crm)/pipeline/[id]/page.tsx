import { notFound } from "next/navigation";
import { decideOffer, releaseHold } from "@/actions/deals";
import { HoldForm, OfferForm } from "@/app/(crm)/pipeline/[id]/deal-forms";
import { PageHeader } from "@/components/page-header";
import { StageBadge, UnitBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { canManageTeam, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, formatInr } from "@/lib/format";

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const opportunity = await db.opportunity.findUnique({ where: { id }, include: { customer: true, owner: true, unit: { include: { tower: { include: { project: true } } } }, offers: { include: { createdBy: true, decidedBy: true }, orderBy: { createdAt: "desc" } }, holds: { include: { createdBy: true }, orderBy: { createdAt: "desc" } } } });
  if (!opportunity || (!canManageTeam(user.role) && opportunity.ownerId !== user.id)) notFound();
  const activeHold = opportunity.holds.find((hold) => hold.status === "ACTIVE");
  return <div className="space-y-6">
    <PageHeader eyebrow="Opportunity" title={opportunity.customer.name} description={`Owned by ${opportunity.owner.name}`} actions={<StageBadge stage={opportunity.stage} />} />
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-5"><h2 className="font-serif text-xl">Property and offer</h2>{opportunity.unit ? <div className="mt-3"><p className="font-medium">{opportunity.unit.tower.project.name} · {opportunity.unit.tower.name} {opportunity.unit.number}</p><div className="mt-1 flex items-center gap-3"><span className="font-mono">{formatInr(opportunity.unit.price)}</span><UnitBadge status={opportunity.unit.status} /></div><div className="mt-5"><OfferForm opportunityId={opportunity.id} /></div></div> : <p className="mt-3 text-sm text-muted-foreground">Shortlist a unit before negotiating.</p>}</Card>
      <Card className="p-5"><h2 className="font-serif text-xl">Unit hold</h2>{activeHold ? <div className="mt-3"><p className="text-sm">Active until {formatDateTime(activeHold.expiresAt)}</p><p className="text-xs text-muted-foreground">Created by {activeHold.createdBy.name}</p><form action={releaseHold} className="mt-4 flex gap-2"><input type="hidden" name="id" value={activeHold.id} /><Input name="reason" placeholder="Release reason" required /><SubmitButton variant="outline">Release</SubmitButton></form></div> : opportunity.unit?.status === "AVAILABLE" ? <div className="mt-4"><HoldForm opportunityId={opportunity.id} unitId={opportunity.unit.id} /></div> : <p className="mt-3 text-sm text-muted-foreground">The selected unit is not available for a hold.</p>}</Card>
    </div>
    <Card className="p-5"><h2 className="font-serif text-xl">Offer history</h2><div className="mt-4 space-y-4">{opportunity.offers.length === 0 ? <p className="text-sm text-muted-foreground">No offers yet.</p> : opportunity.offers.map((offer) => <div key={offer.id} className="border-b border-border pb-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-medium">{formatInr(offer.offeredPrice)} · {offer.discountBps / 100}% discount</p><p className="text-xs text-muted-foreground">{offer.status.replace("_", " ")} · {offer.createdBy.name} · {formatDateTime(offer.createdAt)}</p>{offer.notes ? <p className="mt-1 text-sm">{offer.notes}</p> : null}</div>{offer.status === "PENDING" && canManageTeam(user.role) && offer.createdById !== user.id ? <div className="flex gap-2"><form action={decideOffer}><input type="hidden" name="id" value={offer.id} /><input type="hidden" name="decision" value="APPROVED" /><SubmitButton variant="outline">Approve</SubmitButton></form><form action={decideOffer}><input type="hidden" name="id" value={offer.id} /><input type="hidden" name="decision" value="REJECTED" /><SubmitButton variant="ghost">Reject</SubmitButton></form></div> : null}</div></div>)}</div></Card>
  </div>;
}
