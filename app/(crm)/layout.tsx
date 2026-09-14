import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unreadNotifications = await db.notification.count({ where: { userId: user.id, readAt: null } });
  return <AppShell user={user} unreadNotifications={unreadNotifications}>{children}</AppShell>;
}
