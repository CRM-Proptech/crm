"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { LeadStatus } from "@prisma/client";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeEmail, normalizePhone } from "@/lib/format";
import { leadSchema, type ActionState } from "@/lib/validators";

export async function createLead(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    city: formData.get("city"),
    source: formData.get("source"),
    notes: formData.get("notes"),
    assignedToId: formData.get("assignedToId") || user.id,
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

  const customer =
    existing ??
    (await db.customer.create({
      data: {
        name: parsed.data.name,
        phone,
        email,
        city: parsed.data.city,
      },
    }));

  const lead = await db.lead.create({
    data: {
      customerId: customer.id,
      source: parsed.data.source,
      assignedToId: parsed.data.assignedToId || user.id,
      notes: parsed.data.notes,
    },
  });

  await logActivity({
    userId: user.id,
    customerId: customer.id,
    type: "lead.created",
    message: existing
      ? `New ${parsed.data.source.toLowerCase()} lead attached to existing customer ${customer.name}`
      : `New lead captured for ${customer.name}`,
  });

  revalidatePath("/leads");
  revalidatePath("/customers");
  revalidatePath("/dashboard");

  if (existing) {
    redirect(`/leads/${lead.id}?merged=1`);
  }

  redirect(`/leads/${lead.id}`);
}

export async function updateLeadStatus(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as LeadStatus;

  const lead = await db.lead.update({
    where: { id },
    data: { status },
    include: { customer: true },
  });

  if (status === "QUALIFIED") {
    const existing = await db.opportunity.findFirst({
      where: { customerId: lead.customerId, stage: { notIn: ["WON", "LOST"] } },
    });
    if (!existing) {
      await db.opportunity.create({
        data: {
          customerId: lead.customerId,
          ownerId: lead.assignedToId ?? user.id,
          stage: "QUALIFIED",
        },
      });
    }
  }

  await logActivity({
    userId: user.id,
    customerId: lead.customerId,
    type: "lead.status",
    message: `${lead.customer.name} marked ${status.toLowerCase()}`,
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
}

export async function assignLead(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const assignedToId = String(formData.get("assignedToId") ?? "");

  await db.lead.update({
    where: { id },
    data: { assignedToId: assignedToId || null },
  });

  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
}
