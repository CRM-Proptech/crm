import Link from "next/link";
import { cancelTask, completeTask } from "@/actions/tasks";
import { TaskForm } from "@/app/(crm)/tasks/task-form";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { Card } from "@/components/ui/card";
import { canManageTeam, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const user = await requireUser();
  const team = canManageTeam(user.role) && (await searchParams).scope === "team";
  const [tasks, users, customers] = await Promise.all([
    db.task.findMany({ where: { assigneeId: team ? undefined : user.id }, include: { assignee: true, customer: true }, orderBy: [{ status: "asc" }, { dueAt: "asc" }] }),
    db.user.findMany({ where: canManageTeam(user.role) ? { active: true } : { id: user.id }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const now = new Date();
  return <div className="space-y-6">
    <PageHeader eyebrow="Sales operations" title="Tasks" description="Follow-ups and SLA work, ordered by due time." actions={canManageTeam(user.role) ? <Link href={team ? "/tasks" : "/tasks?scope=team"} className="text-sm text-primary hover:underline">{team ? "My tasks" : "Team tasks"}</Link> : undefined} />
    <Card className="p-5"><h2 className="font-serif text-xl">New follow-up</h2><div className="mt-4"><TaskForm users={users} customers={customers} currentUserId={user.id} /></div></Card>
    <div className="space-y-3">{tasks.map((task) => <Card key={task.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{task.title}</p><p className={`text-xs ${task.status === "OPEN" && task.dueAt < now ? "text-destructive" : "text-muted-foreground"}`}>{task.status} · {formatDateTime(task.dueAt)} · {task.assignee.name}</p>{task.customer ? <Link href={`/customers/${task.customer.id}`} className="text-xs text-primary hover:underline">{task.customer.name}</Link> : null}{task.description ? <p className="mt-1 text-sm">{task.description}</p> : null}</div>{task.status === "OPEN" ? <div className="flex gap-2"><form action={completeTask}><input type="hidden" name="id" value={task.id} /><SubmitButton variant="outline">Complete</SubmitButton></form><form action={cancelTask}><input type="hidden" name="id" value={task.id} /><SubmitButton variant="ghost">Cancel</SubmitButton></form></div> : null}</Card>)}</div>
  </div>;
}
