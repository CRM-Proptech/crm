"use client";

import { useActionState } from "react";
import { createVisit } from "@/actions/visits";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function VisitForm({
  customers,
  projects,
  units,
  users,
  opportunities,
  defaultHostId,
}: {
  customers: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  units: { id: string; label: string; projectId: string }[];
  users: { id: string; name: string }[];
  opportunities: { id: string; label: string }[];
  defaultHostId: string;
}) {
  const [state, action] = useActionState(createVisit, {});

  return (
    <form action={action} className="max-w-xl space-y-4 rounded-lg border border-border bg-card p-5">
      <FormMessage error={state.error} />
      <Field label="Customer" htmlFor="customerId" required>
        <Select id="customerId" name="customerId" required defaultValue={customers[0]?.id}>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Project" htmlFor="projectId" required>
        <Select id="projectId" name="projectId" required defaultValue={projects[0]?.id}>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Unit" htmlFor="unitId" hint="Optional">
        <Select id="unitId" name="unitId" defaultValue="">
          <option value="">Any unit in the project</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Opportunity" htmlFor="opportunityId">
        <Select id="opportunityId" name="opportunityId" defaultValue="">
          <option value="">None</option>
          {opportunities.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="When" htmlFor="scheduledAt" required>
        <Input id="scheduledAt" name="scheduledAt" type="datetime-local" required />
      </Field>
      <Field label="Host" htmlFor="hostedById" required>
        <Select id="hostedById" name="hostedById" defaultValue={defaultHostId} required>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </Select>
      </Field>
      <SubmitButton pendingLabel="Booking…">Schedule visit</SubmitButton>
    </form>
  );
}
