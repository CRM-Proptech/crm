"use server";

import { revalidatePath } from "next/cache";
import { canManageTeam, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { idSchema, opportunityStageSchema } from "@/lib/validators";

export async function moveOpportunity(formData: FormData) {
  const user = await requireUser();
  const id = idSchema.safeParse(formData.get("id"));
  const stage = opportunityStageSchema.safeParse(formData.get("stage"));
  if (!id.success || !stage.success) throw new Error("Invalid pipeline update");
  await db.$transaction(async (tx) => {
    const opportunity = await tx.opportunity.findUnique({ where: { id: id.data }, include: { customer: true } });
    if (!opportunity) throw new Error("Opportunity not found");
    if (!canManageTeam(user.role) && opportunity.ownerId !== user.id) throw new Error("Not authorized");
    if (stage.data === "WON") {
      if (!opportunity.unitId) throw new Error("A unit and active hold are required to win a deal");
      const latestOffer = await tx.offer.findFirst({ where: { opportunityId: opportunity.id }, orderBy: { createdAt: "desc" } });
      if (latestOffer && !["AUTO_APPROVED", "APPROVED"].includes(latestOffer.status)) throw new Error("The latest offer must be approved before winning the deal");
      const hold = await tx.unitHold.findFirst({ where: { opportunityId: opportunity.id, unitId: opportunity.unitId, status: "ACTIVE", expiresAt: { gt: new Date() } } });
      if (!hold) throw new Error("A live hold is required to win a deal");
      await tx.unitHold.update({ where: { id: hold.id }, data: { status: "CONVERTED", activeUnitKey: null, activeOpportunityKey: null } });
      await tx.unit.update({ where: { id: opportunity.unitId }, data: { status: "BOOKED" } });
      await tx.lead.updateMany({ where: { customerId: opportunity.customerId, status: { not: "UNQUALIFIED" } }, data: { status: "CONVERTED" } });
    }
    if (stage.data === "LOST") {
      const holds = await tx.unitHold.findMany({ where: { opportunityId: opportunity.id, status: "ACTIVE" } });
      for (const hold of holds) {
        await tx.unitHold.update({ where: { id: hold.id }, data: { status: "RELEASED", releasedAt: new Date(), releaseReason: "Opportunity lost", activeUnitKey: null, activeOpportunityKey: null } });
        await tx.unit.updateMany({ where: { id: hold.unitId, status: "HELD" }, data: { status: "AVAILABLE" } });
      }
    }
    await tx.opportunity.update({ where: { id: opportunity.id }, data: { stage: stage.data } });
    await tx.activity.create({ data: { userId: user.id, customerId: opportunity.customerId, type: "opportunity.moved", message: `${opportunity.customer.name} moved to ${stage.data.toLowerCase().replace("_", " ")}` } });
  });

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath("/inventory");
  revalidatePath(`/pipeline/${id.data}`);
}
