"use client";

import { useActionState } from "react";
import { createUser } from "@/actions/users";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/constants";

export function UserForm() {
  const [state, action] = useActionState(createUser, {});

  return (
    <form action={action} className="mt-4 grid max-w-xl gap-4 sm:grid-cols-2">
      <FormMessage error={state.error} success={state.success} />
      <Field label="Name" htmlFor="name" required>
        <Input id="name" name="name" autoComplete="name" required />
      </Field>
      <Field label="Email" htmlFor="email" required>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password" required hint="At least 8 characters">
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>
      <Field label="Role" htmlFor="role" required>
        <Select id="role" name="role" defaultValue="SALES">
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <SubmitButton>Add user</SubmitButton>
    </form>
  );
}
