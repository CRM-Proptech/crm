"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { runMatching } from "@/lib/matching";
import { requirementSchema, type ActionState } from "@/lib/validators";

export async function createRequirement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = requirementSchema.safeParse({
    customerId: formData.get("customerId"),
    city: formData.get("city"),
    locality: formData.get("locality"),
    unitTypes: formData.getAll("unitTypes"),
    budgetMin: formData.get("budgetMin"),
    budgetMax: formData.get("budgetMax"),
    possessionBy: formData.get("possessionBy"),
    purpose: formData.get("purpose"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the requirement" };
  }

  if (parsed.data.budgetMax < parsed.data.budgetMin) {
    return { error: "Max budget must be higher than min budget" };
  }

  const requirement = await db.buyerRequirement.create({
    data: {
      customerId: parsed.data.customerId,
      city: parsed.data.city,
      locality: parsed.data.locality,
      unitTypes: JSON.stringify(parsed.data.unitTypes),
      budgetMin: parsed.data.budgetMin,
      budgetMax: parsed.data.budgetMax,
      possessionBy: parsed.data.possessionBy,
      purpose: parsed.data.purpose,
      notes: parsed.data.notes,
    },
    include: { customer: true },
  });

  const matches = await runMatching(requirement.id);

  await db.opportunity.updateMany({
    where: {
      customerId: requirement.customerId,
      stage: { in: ["NEW", "QUALIFIED"] },
    },
    data: { stage: "MATCHING" },
  });

  await logActivity({
    userId: user.id,
    customerId: requirement.customerId,
    type: "requirement.created",
    message: `Requirement captured for ${requirement.customer.name} — ${matches.length} matches`,
  });

  revalidatePath(`/customers/${requirement.customerId}`);
  revalidatePath("/matches");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { success: `${matches.length} properties matched` };
}

export async function refreshMatches(formData: FormData) {
  await requireUser();
  const requirementId = String(formData.get("requirementId") ?? "");
  await runMatching(requirementId);
  revalidatePath("/matches");
  revalidatePath("/dashboard");
  revalidatePath("/customers");
}
