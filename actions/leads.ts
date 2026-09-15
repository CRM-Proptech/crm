"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageTeam, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeEmail, normalizePhone } from "@/lib/format";
import { addMilliseconds, FIRST_CONTACT_SLA_MS, nextRoundRobinUser } from "@/lib/sales-policy";
import { idSchema, leadSchema, leadStatusSchema, type ActionState } from "@/lib/validators";

export async function createLead(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    city: formData.get("city"),
    source: formData.get("source"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the lead details" };
  }

  const phone = normalizePhone(parsed.data.phone);
  const email = normalizeEmail(parsed.data.email);

  const existing = await db.customer.findFirst({
    where: {
      OR: [{ phone }, ...(email ? [{ email }] : [])],
    },
  });

  const result = await db.$transaction(async (tx) => {
    const salesUsers = await tx.user.findMany({
      where: { active: true, role: "SALES" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    if (salesUsers.length === 0) throw new Error("No active sales users are available for routing");

    const stickyOwner = existing?.ownerId
      ? salesUsers.find((salesUser) => salesUser.id === existing.ownerId)
      : null;
    const routing = await tx.routingState.findUnique({ where: { id: "sales" } });
    const owner = stickyOwner ?? nextRoundRobinUser(salesUsers, routing?.lastAssignedUserId);
    if (!owner) throw new Error("No active sales users are available for routing");

    const customer = existing
      ? await tx.customer.update({ where: { id: existing.id }, data: { ownerId: owner.id } })
      : await tx.customer.create({
          data: { name: parsed.data.name, phone, email, city: parsed.data.city, ownerId: owner.id },
        });
    if (!stickyOwner) {
      await tx.routingState.upsert({
        where: { id: "sales" },
        create: { id: "sales", lastAssignedUserId: owner.id },
        update: { lastAssignedUserId: owner.id },
      });
    }
    const lead = await tx.lead.create({
      data: { customerId: customer.id, source: parsed.data.source, assignedToId: owner.id, notes: parsed.data.notes },
    });
    await tx.task.create({
      data: {
        title: `First contact: ${customer.name}`,
        type: "FIRST_CONTACT",
        dueAt: addMilliseconds(lead.createdAt, FIRST_CONTACT_SLA_MS),
        assigneeId: owner.id,
        createdById: user.id,
        customerId: customer.id,
      },
    });
    await tx.notification.create({
      data: {
        userId: owner.id,
        customerId: customer.id,
        type: "lead.assigned",
        title: "New lead assigned",
        message: `${customer.name} was routed to you. First contact is due in 4 hours.`,
        href: `/leads/${lead.id}`,
        eventKey: `lead-assigned:${lead.id}`,
      },
    });
    await tx.activity.create({
      data: {
        userId: user.id,
        customerId: customer.id,
        type: "lead.created",
        message: existing
          ? `New ${parsed.data.source.toLowerCase()} lead attached to ${customer.name} and routed to ${owner.name}`
          : `New lead captured for ${customer.name} and routed to ${owner.name}`,
      },
    });
    return { customer, lead };
  });

  revalidatePath("/leads");
  revalidatePath("/customers");
  revalidatePath("/dashboard");

  if (existing) {
    redirect(`/leads/${result.lead.id}?merged=1`);
  }

  redirect(`/leads/${result.lead.id}`);
}

export async function updateLeadStatus(formData: FormData) {
  const user = await requireUser();
  const parsed = leadStatusSchema.safeParse(formData.get("status"));
  const id = idSchema.safeParse(formData.get("id"));
  if (!parsed.success || !id.success) throw new Error("Invalid lead update");

  await db.$transaction(async (tx) => {
    const current = await tx.lead.findUnique({ where: { id: id.data }, include: { customer: true } });
    if (!current) throw new Error("Lead not found");
    if (!canManageTeam(user.role) && current.assignedToId !== user.id) throw new Error("Not authorized");
    const lead = await tx.lead.update({ where: { id: id.data }, data: { status: parsed.data } });
    if (parsed.data === "CONTACTED" || parsed.data === "QUALIFIED") {
      await tx.task.updateMany({
        where: { customerId: lead.customerId, type: "FIRST_CONTACT", status: "OPEN" },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
    }
    if (parsed.data === "QUALIFIED") {
      const open = await tx.opportunity.findFirst({ where: { customerId: lead.customerId, stage: { notIn: ["WON", "LOST"] } } });
      if (!open) await tx.opportunity.create({ data: { customerId: lead.customerId, ownerId: lead.assignedToId ?? user.id, stage: "QUALIFIED" } });
    }
    await tx.activity.create({
      data: { userId: user.id, customerId: lead.customerId, type: "lead.status", message: `${current.customer.name} marked ${parsed.data.toLowerCase()}` },
    });
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${id.data}`);
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
}

export async function assignLead(formData: FormData) {
  const actor = await requireUser();
  if (!canManageTeam(actor.role)) throw new Error("Not authorized");
  const parsed = idSchema.safeParse(formData.get("id"));
  const assigned = idSchema.safeParse(formData.get("assignedToId"));
  if (!parsed.success || !assigned.success) throw new Error("Invalid assignment");
  await db.$transaction(async (tx) => {
    const owner = await tx.user.findFirst({ where: { id: assigned.data, active: true, role: "SALES" } });
    const lead = await tx.lead.findUnique({ where: { id: parsed.data }, include: { customer: true } });
    if (!owner || !lead) throw new Error("Lead or active sales owner not found");
    await tx.lead.update({ where: { id: lead.id }, data: { assignedToId: owner.id } });
    await tx.customer.update({ where: { id: lead.customerId }, data: { ownerId: owner.id } });
    await tx.task.updateMany({ where: { customerId: lead.customerId, type: "FIRST_CONTACT", status: "OPEN" }, data: { assigneeId: owner.id } });
    await tx.notification.create({ data: { userId: owner.id, customerId: lead.customerId, type: "lead.assigned", title: "Lead reassigned", message: `${lead.customer.name} was assigned to you.`, href: `/leads/${lead.id}`, eventKey: `lead-reassigned:${lead.id}:${owner.id}:${Date.now()}` } });
    await tx.activity.create({ data: { userId: actor.id, customerId: lead.customerId, type: "lead.assigned", message: `${lead.customer.name} assigned to ${owner.name}` } });
  });

  revalidatePath(`/leads/${parsed.data}`);
  revalidatePath("/leads");
}
