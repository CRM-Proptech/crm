"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { VisitStatus } from "@prisma/client";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { visitSchema, type ActionState } from "@/lib/validators";

export async function createVisit(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = visitSchema.safeParse({
    customerId: formData.get("customerId"),
    projectId: formData.get("projectId"),
    unitId: formData.get("unitId") || undefined,
    opportunityId: formData.get("opportunityId") || undefined,
    scheduledAt: formData.get("scheduledAt"),
    hostedById: formData.get("hostedById") || user.id,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the visit details" };
  }

  const visit = await db.siteVisit.create({
    data: {
      customerId: parsed.data.customerId,
      projectId: parsed.data.projectId,
      unitId: parsed.data.unitId || null,
      opportunityId: parsed.data.opportunityId || null,
      hostedById: parsed.data.hostedById,
      scheduledAt: new Date(parsed.data.scheduledAt),
    },
    include: { customer: true, project: true },
  });

  await db.opportunity.updateMany({
    where: {
      customerId: visit.customerId,
      stage: { in: ["NEW", "QUALIFIED", "MATCHING"] },
    },
    data: { stage: "SITE_VISIT" },
  });

  await logActivity({
    userId: user.id,
    customerId: visit.customerId,
    type: "visit.scheduled",
    message: `Site visit at ${visit.project.name} for ${visit.customer.name}`,
  });

  revalidatePath("/visits");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  redirect("/visits");
}

export async function updateVisit(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as VisitStatus;
  const feedback = String(formData.get("feedback") ?? "").trim();

  const visit = await db.siteVisit.update({
    where: { id },
    data: { status, feedback: feedback || undefined },
    include: { customer: true },
  });

  await logActivity({
    userId: user.id,
    customerId: visit.customerId,
    type: "visit.updated",
    message: `Visit ${status.toLowerCase().replace("_", " ")} for ${visit.customer.name}`,
  });

  revalidatePath("/visits");
  revalidatePath("/dashboard");
}
