"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageTeam, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addMilliseconds, VISIT_FOLLOW_UP_MS } from "@/lib/sales-policy";
import { visitSchema, visitUpdateSchema, type ActionState } from "@/lib/validators";

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
  if (!canManageTeam(user.role) && parsed.data.hostedById !== user.id) return { error: "You can only schedule your own visits" };

  const [customer, project, unit, opportunity, host] = await Promise.all([
    db.customer.findUnique({ where: { id: parsed.data.customerId } }),
    db.project.findUnique({ where: { id: parsed.data.projectId } }),
    parsed.data.unitId ? db.unit.findUnique({ where: { id: parsed.data.unitId }, include: { tower: true } }) : null,
    parsed.data.opportunityId ? db.opportunity.findUnique({ where: { id: parsed.data.opportunityId } }) : null,
    db.user.findFirst({ where: { id: parsed.data.hostedById, active: true } }),
  ]);
  if (!customer || !project || !host || (parsed.data.unitId && (!unit || unit.tower.projectId !== project.id)) || (parsed.data.opportunityId && (!opportunity || opportunity.customerId !== customer.id))) {
    return { error: "Customer, property, opportunity, or host is invalid" };
  }

  await db.$transaction(async (tx) => {
    const visit = await tx.siteVisit.create({ data: { customerId: customer.id, projectId: project.id, unitId: unit?.id, opportunityId: opportunity?.id, hostedById: host.id, scheduledAt: new Date(parsed.data.scheduledAt) } });
    await tx.opportunity.updateMany({ where: { customerId: visit.customerId, stage: { in: ["NEW", "QUALIFIED", "MATCHING"] } }, data: { stage: "SITE_VISIT" } });
    await tx.activity.create({ data: { userId: user.id, customerId: customer.id, type: "visit.scheduled", message: `Site visit at ${project.name} for ${customer.name}` } });
  });

  revalidatePath("/visits");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  redirect("/visits");
}

export async function updateVisit(formData: FormData) {
  const user = await requireUser();
  const parsed = visitUpdateSchema.safeParse({ id: formData.get("id"), status: formData.get("status"), feedback: formData.get("feedback") });
  if (!parsed.success) throw new Error("Invalid visit update");
  await db.$transaction(async (tx) => {
    const current = await tx.siteVisit.findUnique({ where: { id: parsed.data.id }, include: { customer: true } });
    if (!current) throw new Error("Visit not found");
    if (!canManageTeam(user.role) && current.hostedById !== user.id) throw new Error("Not authorized");
    const visit = await tx.siteVisit.update({ where: { id: current.id }, data: { status: parsed.data.status, feedback: parsed.data.feedback || undefined } });
    if (parsed.data.status === "COMPLETED") {
      const task = await tx.task.upsert({
        where: { siteVisitId: visit.id },
        create: { title: `Follow up after visit: ${current.customer.name}`, type: "FOLLOW_UP", dueAt: addMilliseconds(new Date(), VISIT_FOLLOW_UP_MS), assigneeId: visit.hostedById, createdById: user.id, customerId: visit.customerId, siteVisitId: visit.id },
        update: {},
      });
      await tx.notification.upsert({ where: { eventKey: `visit-follow-up:${visit.id}` }, create: { userId: visit.hostedById, customerId: visit.customerId, type: "task.assigned", title: "Visit follow-up due", message: task.title, href: "/tasks", eventKey: `visit-follow-up:${visit.id}` }, update: {} });
    }
    await tx.activity.create({ data: { userId: user.id, customerId: visit.customerId, type: "visit.updated", message: `Visit ${parsed.data.status.toLowerCase().replace("_", " ")} for ${current.customer.name}` } });
  });

  revalidatePath("/visits");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}
