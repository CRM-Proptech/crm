import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession, type SessionUser } from "@/lib/session";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, active: true },
  });

  if (!user?.active) return null;
  return user;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return user;
}

export function canManageTeam(role: SessionUser["role"]) {
  return role === "ADMIN" || role === "MANAGER";
}
