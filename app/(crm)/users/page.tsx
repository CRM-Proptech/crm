import { redirect } from "next/navigation";
import { UserForm } from "@/app/(crm)/users/user-form";
import { toggleUserActive, updateUserRole } from "@/actions/users";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { canManageTeam, requireUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";

export default async function UsersPage() {
  const current = await requireUser();
  if (!canManageTeam(current.role)) {
    redirect("/dashboard");
  }

  const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Access"
        title="Team"
        description="Roles: admin runs the book, managers see the floor, sales own their pipeline."
      />

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  {current.role === "ADMIN" ? (
                    <form action={updateUserRole} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={user.id} />
                      <Select name="role" defaultValue={user.role} className="w-32">
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                      <SubmitButton variant="ghost">Save</SubmitButton>
                    </form>
                  ) : (
                    ROLE_LABELS[user.role]
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Badge tone={user.active ? "success" : "danger"}>{user.active ? "Active" : "Disabled"}</Badge>
                    {current.role === "ADMIN" && user.id !== current.id ? (
                      <form action={toggleUserActive}>
                        <input type="hidden" name="id" value={user.id} />
                        <SubmitButton variant="outline">{user.active ? "Disable" : "Enable"}</SubmitButton>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {current.role === "ADMIN" ? (
        <Card className="p-5">
          <h2 className="font-serif text-xl">Invite teammate</h2>
          <UserForm />
        </Card>
      ) : null}
    </div>
  );
}
