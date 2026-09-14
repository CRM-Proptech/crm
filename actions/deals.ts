"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { canManageTeam, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { discountBps, offerNeedsApproval } from "@/lib/sales-policy";
import { holdReleaseSchema, holdSchema, offerDecisionSchema, offerSchema, type ActionState } from "@/lib/validators";

function canAccessOpportunity(user: { id: string; role: "ADMIN" | "MANAGER" | "SALES" }, ownerId: string) {
  return canManageTeam(user.role) || user.id === ownerId;
}

export async function createOffer(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = offerSchema.safeParse({ opportunityId: formData.get("opportunityId"), offeredPrice: formData.get("offeredPrice"), notes: formData.get("notes") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the offer" };
  const opportunity = await db.opportunity.findUnique({ where: { id: parsed.data.opportunityId }, include: { unit: true, customer: true } });
  if (!opportunity?.unit) return { error: "Attach a unit before making an offer" };
  if (!canAccessOpportunity(user, opportunity.ownerId)) return { error: "Not authorized" };
  if (["WON", "LOST"].includes(opportunity.stage)) return { error: "This deal is closed" };

  const bps = discountBps(opportunity.unit.price, parsed.data.offeredPrice);
  const pending = offerNeedsApproval(opportunity.unit.price, parsed.data.offeredPrice);
  await db.$transaction(async (tx) => {
    const offer = await tx.offer.create({ data: { opportunityId: opportunity.id, listPrice: opportunity.unit!.price, offeredPrice: parsed.data.offeredPrice, discountBps: bps, status: pending ? "PENDING" : "AUTO_APPROVED", notes: parsed.data.notes, createdById: user.id } });
    await tx.opportunity.update({
      where: { id: opportunity.id },
      data: {
        stage: "NEGOTIATION",
        ...(pending ? {} : { value: parsed.data.offeredPrice }),
      },
    });
    await tx.activity.create({ data: { userId: user.id, customerId: opportunity.customerId, type: "offer.created", message: `${user.name} offered ${bps / 100}% below list price${pending ? "; approval requested" : "; auto-approved"}` } });
    if (pending) {
      const approvers = await tx.user.findMany({ where: { active: true, role: { in: ["MANAGER", "ADMIN"] } } });
      await tx.notification.createMany({ data: approvers.map((approver) => ({ userId: approver.id, customerId: opportunity.customerId, type: "offer.approval", title: "Discount approval required", message: `${opportunity.customer.name}: ${bps / 100}% discount requested by ${user.name}.`, href: `/pipeline/${opportunity.id}`, eventKey: `offer-pending:${offer.id}:${approver.id}` })) });
    }
  });
  revalidatePath(`/pipeline/${opportunity.id}`);
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { success: pending ? "Offer submitted for approval" : "Offer auto-approved" };
}

export async function decideOffer(formData: FormData) {
  const user = await requireUser();
  if (!canManageTeam(user.role)) throw new Error("Not authorized");
  const parsed = offerDecisionSchema.safeParse({ id: formData.get("id"), decision: formData.get("decision"), decisionNotes: formData.get("decisionNotes") });
  if (!parsed.success) throw new Error("Invalid decision");
  const offer = await db.offer.findUnique({ where: { id: parsed.data.id }, include: { opportunity: { include: { customer: true } }, createdBy: true } });
  if (!offer || offer.status !== "PENDING") throw new Error("Pending offer not found");
  if (offer.createdById === user.id) throw new Error("You cannot approve your own offer");
  await db.$transaction(async (tx) => {
    const changed = await tx.offer.updateMany({ where: { id: offer.id, status: "PENDING" }, data: { status: parsed.data.decision, decidedById: user.id, decidedAt: new Date(), decisionNotes: parsed.data.decisionNotes } });
    if (!changed.count) throw new Error("This offer was already decided");
    if (parsed.data.decision === "APPROVED") {
      await tx.opportunity.update({
        where: { id: offer.opportunityId },
        data: { value: offer.offeredPrice },
      });
    }
    await tx.notification.create({ data: { userId: offer.createdById, customerId: offer.opportunity.customerId, type: "offer.decision", title: `Offer ${parsed.data.decision.toLowerCase()}`, message: `${user.name} ${parsed.data.decision.toLowerCase()} the ${offer.discountBps / 100}% discount.`, href: `/pipeline/${offer.opportunityId}`, eventKey: `offer-decision:${offer.id}` } });
    await tx.activity.create({ data: { userId: user.id, customerId: offer.opportunity.customerId, type: "offer.decided", message: `${user.name} ${parsed.data.decision.toLowerCase()} the ${offer.discountBps / 100}% discount requested by ${offer.createdBy.name}` } });
  });
  revalidatePath(`/pipeline/${offer.opportunityId}`);
  revalidatePath("/dashboard");
}

export async function createHold(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = holdSchema.safeParse({ opportunityId: formData.get("opportunityId"), unitId: formData.get("unitId"), expiresAt: formData.get("expiresAt") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the hold" };
  const expiresAt = new Date(parsed.data.expiresAt);
  if (expiresAt <= new Date()) return { error: "Hold expiry must be in the future" };
  const opportunity = await db.opportunity.findUnique({ where: { id: parsed.data.opportunityId }, include: { customer: true } });
  if (!opportunity || !canAccessOpportunity(user, opportunity.ownerId)) return { error: "Opportunity not found or not authorized" };
  if (opportunity.unitId !== parsed.data.unitId) return { error: "Hold must use the opportunity unit" };

  try {
    await db.$transaction(async (tx) => {
      const claimed = await tx.unit.updateMany({ where: { id: parsed.data.unitId, status: "AVAILABLE" }, data: { status: "HELD" } });
      if (claimed.count !== 1) throw new Error("Unit is not available");
      const hold = await tx.unitHold.create({ data: { opportunityId: opportunity.id, unitId: parsed.data.unitId, expiresAt, createdById: user.id, activeUnitKey: parsed.data.unitId, activeOpportunityKey: opportunity.id } });
      await tx.activity.create({ data: { userId: user.id, customerId: opportunity.customerId, type: "hold.created", message: `Unit placed on hold until ${expiresAt.toLocaleString("en-IN")}` } });
      await tx.notification.create({ data: { userId: opportunity.ownerId, customerId: opportunity.customerId, type: "hold.created", title: "Unit hold active", message: `Hold expires ${expiresAt.toLocaleString("en-IN")}.`, href: `/pipeline/${opportunity.id}`, eventKey: `hold-created:${hold.id}` } });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "The unit or opportunity already has an active hold" };
    return { error: error instanceof Error ? error.message : "Unable to create hold" };
  }
  revalidatePath(`/pipeline/${opportunity.id}`);
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: "Unit held" };
}

export async function releaseHold(formData: FormData) {
  const user = await requireUser();
  const parsed = holdReleaseSchema.safeParse({ id: formData.get("id"), reason: formData.get("reason") });
  if (!parsed.success) throw new Error("Invalid hold release");
  const hold = await db.unitHold.findUnique({ where: { id: parsed.data.id }, include: { opportunity: true } });
  if (!hold || hold.status !== "ACTIVE") throw new Error("Active hold not found");
  if (!canAccessOpportunity(user, hold.opportunity.ownerId)) throw new Error("Not authorized");
  await db.$transaction(async (tx) => {
    const changed = await tx.unitHold.updateMany({ where: { id: hold.id, status: "ACTIVE" }, data: { status: "RELEASED", releasedAt: new Date(), releaseReason: parsed.data.reason, activeUnitKey: null, activeOpportunityKey: null } });
    if (!changed.count) throw new Error("This hold is no longer active");
    await tx.unit.updateMany({ where: { id: hold.unitId, status: "HELD" }, data: { status: "AVAILABLE" } });
    await tx.activity.create({ data: { userId: user.id, customerId: hold.opportunity.customerId, type: "hold.released", message: `Unit hold released: ${parsed.data.reason}` } });
  });
  revalidatePath(`/pipeline/${hold.opportunityId}`);
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}
