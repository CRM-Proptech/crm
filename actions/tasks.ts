"use server";

import { revalidatePath } from "next/cache";
import { canManageTeam, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { taskMutationSchema, taskSchema, type ActionState } from "@/lib/validators";

export async function createTask(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    dueAt: formData.get("dueAt"),
    assigneeId: formData.get("assigneeId") || user.id,
    customerId: formData.get("customerId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the task" };
  if (!canManageTeam(user.role) && parsed.data.assigneeId !== user.id) return { error: "You can only assign tasks to yourself" };

  const [assignee, customer] = await Promise.all([
    db.user.findFirst({ where: { id: parsed.data.assigneeId, active: true } }),
    parsed.data.customerId ? db.customer.findUnique({ where: { id: parsed.data.customerId } }) : null,
  ]);
  if (!assignee || (parsed.data.customerId && !customer)) return { error: "Assignee or customer not found" };

  await db.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        dueAt: new Date(parsed.data.dueAt),
        assigneeId: assignee.id,
        createdById: user.id,
        customerId: customer?.id,
      },
    });
    if (customer) await tx.activity.create({ data: { userId: user.id, customerId: customer.id, type: "task.created", message: `Task created: ${task.title}` } });
  });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: "Task created" };
}

async function changeTask(formData: FormData, status: "COMPLETED" | "CANCELLED") {
  const user = await requireUser();
  const parsed = taskMutationSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) throw new Error("Invalid task");
  await db.$transaction(async (tx) => {
    const task = await tx.task.findUnique({ where: { id: parsed.data.id } });
    if (!task || task.status !== "OPEN") throw new Error("Open task not found");
    if (!canManageTeam(user.role) && task.assigneeId !== user.id) throw new Error("Not authorized");
    const changed = await tx.task.update({
      where: { id: task.id },
      data: status === "COMPLETED" ? { status, completedAt: new Date() } : { status, cancelledAt: new Date() },
    });
    if (changed.customerId) await tx.activity.create({ data: { userId: user.id, customerId: changed.customerId, type: `task.${status.toLowerCase()}`, message: `${changed.title} ${status.toLowerCase()}` } });
  });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function completeTask(formData: FormData) {
  return changeTask(formData, "COMPLETED");
}

export async function cancelTask(formData: FormData) {
  return changeTask(formData, "CANCELLED");
}
