"use server";

import { revalidatePath } from "next/cache";
import type { MatchStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function updateMatchStatus(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as MatchStatus;

  const match = await db.propertyMatch.update({
    where: { id },
    data: { status },
    include: { requirement: true, unit: true },
  });

  if (status === "SHORTLISTED") {
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

  revalidatePath("/matches");
  revalidatePath("/pipeline");
  revalidatePath(`/customers/${match.requirement.customerId}`);
}
