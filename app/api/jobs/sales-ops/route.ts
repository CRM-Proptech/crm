import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addMilliseconds, JOB_WARNING_WINDOW_MS } from "@/lib/sales-policy";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const warningEnd = addMilliseconds(now, JOB_WARNING_WINDOW_MS);
  const [overdueTasks, visits, warningHolds, expiredHolds] = await Promise.all([
    db.task.findMany({ where: { status: "OPEN", dueAt: { lt: now }, escalatedAt: null }, include: { customer: true, assignee: true } }),
    db.siteVisit.findMany({ where: { status: "SCHEDULED", scheduledAt: { gte: now, lte: warningEnd } }, include: { customer: true, project: true } }),
    db.unitHold.findMany({ where: { status: "ACTIVE", expiresAt: { gt: now, lte: warningEnd } }, include: { opportunity: { include: { customer: true } }, unit: true } }),
    db.unitHold.findMany({ where: { status: "ACTIVE", expiresAt: { lte: now } }, include: { opportunity: { include: { customer: true } }, unit: true } }),
  ]);

  let escalated = 0;
  let expired = 0;
  for (const task of overdueTasks) {
    await db.$transaction(async (tx) => {
      const changed = await tx.task.updateMany({ where: { id: task.id, status: "OPEN", escalatedAt: null }, data: { escalatedAt: now } });
      if (!changed.count) return;
      escalated += 1;
      await tx.notification.create({ data: { userId: task.assigneeId, customerId: task.customerId, type: "task.overdue", title: "Task overdue", message: task.title, href: "/tasks", eventKey: `task-overdue:${task.id}` } });
      const managers = await tx.user.findMany({ where: { active: true, role: { in: ["MANAGER", "ADMIN"] } } });
      await tx.notification.createMany({ data: managers.map((manager) => ({ userId: manager.id, customerId: task.customerId, type: "task.escalation", title: "Task SLA breached", message: `${task.assignee.name}: ${task.title}`, href: "/tasks?scope=team", eventKey: `task-escalation:${task.id}:${manager.id}` })) });
      await tx.activity.create({ data: { customerId: task.customerId, type: "task.escalated", message: `Overdue task escalated: ${task.title}` } });
    });
  }

  for (const visit of visits) {
    await db.$transaction(async (tx) => {
      await tx.notification.upsert({ where: { eventKey: `visit-reminder:${visit.id}` }, create: { userId: visit.hostedById, customerId: visit.customerId, type: "visit.reminder", title: "Site visit within 24 hours", message: `${visit.customer.name} at ${visit.project.name}.`, href: "/visits", eventKey: `visit-reminder:${visit.id}` }, update: {} });
      await tx.activity.upsert({ where: { eventKey: `visit-reminder:${visit.id}` }, create: { customerId: visit.customerId, type: "visit.reminder", message: `Visit reminder sent for ${visit.project.name}`, eventKey: `visit-reminder:${visit.id}` }, update: {} });
    });
  }

  for (const hold of warningHolds) {
    await db.$transaction(async (tx) => {
      await tx.notification.upsert({ where: { eventKey: `hold-warning:${hold.id}` }, create: { userId: hold.opportunity.ownerId, customerId: hold.opportunity.customerId, type: "hold.warning", title: "Unit hold expiring", message: `Unit ${hold.unit.number} expires within 24 hours.`, href: `/pipeline/${hold.opportunityId}`, eventKey: `hold-warning:${hold.id}` }, update: {} });
      await tx.activity.upsert({ where: { eventKey: `hold-warning:${hold.id}` }, create: { customerId: hold.opportunity.customerId, type: "hold.warning", message: `Hold warning sent for unit ${hold.unit.number}`, eventKey: `hold-warning:${hold.id}` }, update: {} });
    });
  }

  for (const hold of expiredHolds) {
    await db.$transaction(async (tx) => {
      const changed = await tx.unitHold.updateMany({ where: { id: hold.id, status: "ACTIVE" }, data: { status: "EXPIRED", releasedAt: now, releaseReason: "Hold expired", activeUnitKey: null, activeOpportunityKey: null } });
      if (!changed.count) return;
      expired += 1;
      await tx.unit.updateMany({ where: { id: hold.unitId, status: "HELD" }, data: { status: "AVAILABLE" } });
      await tx.notification.create({ data: { userId: hold.opportunity.ownerId, customerId: hold.opportunity.customerId, type: "hold.expired", title: "Unit hold expired", message: `Unit ${hold.unit.number} is available again.`, href: `/pipeline/${hold.opportunityId}`, eventKey: `hold-expired:${hold.id}` } });
      await tx.activity.create({ data: { customerId: hold.opportunity.customerId, type: "hold.expired", message: `Hold expired for unit ${hold.unit.number}` } });
    });
  }

  return NextResponse.json({ escalated, visitReminders: visits.length, holdWarnings: warningHolds.length, expired });
}
