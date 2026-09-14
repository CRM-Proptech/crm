import Link from "next/link";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/notifications";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return <div className="space-y-6"><PageHeader eyebrow="Inbox" title="Notifications" description="Assignments, SLA escalations, approvals, reminders, and hold changes." actions={<form action={markAllNotificationsRead}><SubmitButton variant="outline">Mark all read</SubmitButton></form>} /><div className="space-y-3">{notifications.length === 0 ? <Card className="p-5 text-sm text-muted-foreground">No notifications.</Card> : notifications.map((item) => <Card key={item.id} className={`flex items-start justify-between gap-4 p-4 ${item.readAt ? "opacity-70" : "border-primary/40"}`}><div>{item.href ? <Link href={item.href} className="font-medium hover:underline">{item.title}</Link> : <p className="font-medium">{item.title}</p>}<p className="mt-1 text-sm">{item.message}</p><p className="mt-1 text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p></div>{!item.readAt ? <form action={markNotificationRead}><input type="hidden" name="id" value={item.id} /><SubmitButton variant="ghost">Read</SubmitButton></form> : null}</Card>)}</div></div>;
}
