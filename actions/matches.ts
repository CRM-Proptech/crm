"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { matchUpdateSchema } from "@/lib/validators";

export async function updateMatchStatus(formData: FormData) {
  const user = await requireUser();
  const parsed = matchUpdateSchema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) throw new Error("Invalid match update");

  const match = await db.propertyMatch.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
    include: { requirement: true, unit: true },
  });

  if (parsed.data.status === "SHORTLISTED") {
    await db.opportunity.updateMany({
      where: {
        customerId: match.requirement.customerId,
        stage: { in: ["NEW", "QUALIFIED", "MATCHING"] },
      },
      data: {
        stage: "MATCHING",
        unitId: match.unitId,
        value: match.unit.price,
      },
    });
  }
  await db.activity.create({ data: { userId: user.id, customerId: match.requirement.customerId, type: "match.updated", message: `Unit ${match.unit.number} marked ${parsed.data.status.toLowerCase()}` } });

  revalidatePath("/matches");
  revalidatePath("/pipeline");
  revalidatePath(`/customers/${match.requirement.customerId}`);
}
