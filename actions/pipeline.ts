"use server";

import { revalidatePath } from "next/cache";
import type { OpportunityStage } from "@prisma/client";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function moveOpportunity(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const stage = String(formData.get("stage") ?? "") as OpportunityStage;

  const opportunity = await db.opportunity.update({
    where: { id },
    data: { stage },
    include: { customer: true },
  });

  if (stage === "WON") {
    await db.lead.updateMany({
      where: { customerId: opportunity.customerId, status: { not: "UNQUALIFIED" } },
      data: { status: "CONVERTED" },
    });
    if (opportunity.unitId) {
      await db.unit.update({
        where: { id: opportunity.unitId },
        data: { status: "BOOKED" },
      });
    }
  }

  await logActivity({
    userId: user.id,
    customerId: opportunity.customerId,
    type: "opportunity.moved",
    message: `${opportunity.customer.name} moved to ${stage.toLowerCase().replace("_", " ")}`,
  });

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath("/inventory");
}
