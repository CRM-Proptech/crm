"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeEmail, normalizePhone } from "@/lib/format";

export async function updateCustomer(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const email = normalizeEmail(String(formData.get("email") ?? ""));

  if (!id || name.length < 2 || phone.length < 10) {
    return;
  }

  await db.customer.update({
    where: { id },
    data: { name, phone, email, city, notes },
  });

  revalidatePath(`/customers/${id}`);
  revalidatePath("/customers");
}
