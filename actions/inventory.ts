"use server";

import { revalidatePath } from "next/cache";
import type { UnitStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function updateUnitStatus(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as UnitStatus;
  await db.unit.update({ where: { id }, data: { status } });
  revalidatePath("/inventory");
  revalidatePath("/matches");
  revalidatePath("/pipeline");
}
