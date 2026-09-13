"use client";

import { useActionState } from "react";
import { createLead } from "@/actions/leads";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CITIES, LEAD_SOURCE_LABELS } from "@/lib/constants";

export function LeadForm({ users }: { users: { id: string; name: string }[] }) {
  const [state, action] = useActionState(createLead, {});

  return (
    <form action={action} className="max-w-xl space-y-4 rounded-lg border border-border bg-card p-5">
      <FormMessage error={state.error} success={state.success} />
      <Field label="Full name" htmlFor="name" required>
        <Input id="name" name="name" autoComplete="name" placeholder="Rohan Kapoor" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone" htmlFor="phone" required hint="Used for deduplication">
          <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98200 12345" required />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="rohan@example.com" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" htmlFor="city" required>
          <Select id="city" name="city" defaultValue="Mumbai" required>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Source" htmlFor="source" required>
          <Select id="source" name="source" defaultValue="WEBSITE" required>
            {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Assign to" htmlFor="assignedToId">
        <Select id="assignedToId" name="assignedToId" defaultValue={users[0]?.id}>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" placeholder="Looking at 3 BHK in Bandra, budget around 4 Cr" />
      </Field>
      <SubmitButton pendingLabel="Checking duplicates…">Save lead</SubmitButton>
    </form>
  );
}
