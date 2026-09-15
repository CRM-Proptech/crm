"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canManageTeam, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function updateUnitStatus(formData: FormData) {
  const user = await requireUser();
  if (!canManageTeam(user.role)) throw new Error("Not authorized");
  const parsed = z.object({ id: z.string().min(1), status: z.enum(["AVAILABLE", "BOOKED", "SOLD"]) }).safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) throw new Error("HELD status can only be created through a unit hold");
  const activeHold = await db.unitHold.findFirst({ where: { unitId: parsed.data.id, status: "ACTIVE" } });
  if (activeHold) throw new Error("Release or convert the active hold first");
  await db.unit.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
  revalidatePath("/inventory");
  revalidatePath("/matches");
  revalidatePath("/pipeline");
}
