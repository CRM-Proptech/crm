import { db } from "@/lib/db";

export async function logActivity(input: {
  userId?: string | null;
  customerId?: string | null;
  type: string;
  message: string;
}) {
  await db.activity.create({
    data: {
      userId: input.userId ?? null,
      customerId: input.customerId ?? null,
      type: input.type,
      message: input.message,
    },
  });
}
