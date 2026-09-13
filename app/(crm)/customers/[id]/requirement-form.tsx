"use client";

import { useActionState } from "react";
import { createRequirement } from "@/actions/requirements";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CITIES, UNIT_TYPE_LABELS } from "@/lib/constants";

export function RequirementForm({ customerId }: { customerId: string }) {
  const [state, action] = useActionState(createRequirement, {});

  return (
    <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="customerId" value={customerId} />
      <FormMessage error={state.error} success={state.success} />
      <Field label="City" htmlFor="city" required>
        <Select id="city" name="city" defaultValue="Mumbai" required>
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Locality" htmlFor="locality">
        <Input id="locality" name="locality" placeholder="Bandra, Kharadi…" />
      </Field>
      <fieldset className="sm:col-span-2 space-y-2">
        <legend className="text-sm font-medium">
          Configurations <span className="text-destructive">*</span>
        </legend>
        <div className="flex flex-wrap gap-3">
          {Object.entries(UNIT_TYPE_LABELS).map(([value, label]) => (
            <label key={value} className="flex min-h-10 items-center gap-2 text-sm">
              <input type="checkbox" name="unitTypes" value={value} className="size-4 accent-primary" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Budget min (INR)" htmlFor="budgetMin" required>
        <Input id="budgetMin" name="budgetMin" inputMode="numeric" placeholder="20000000" required />
      </Field>
      <Field label="Budget max (INR)" htmlFor="budgetMax" required>
        <Input id="budgetMax" name="budgetMax" inputMode="numeric" placeholder="45000000" required />
      </Field>
      <Field label="Possession" htmlFor="possessionBy">
        <Input id="possessionBy" name="possessionBy" placeholder="Ready / 2027" />
      </Field>
      <Field label="Purpose" htmlFor="purpose">
        <Input id="purpose" name="purpose" placeholder="End use / Investment" />
      </Field>
      <Field label="Notes" htmlFor="req-notes" className="sm:col-span-2">
        <Textarea id="req-notes" name="notes" />
      </Field>
      <SubmitButton pendingLabel="Matching inventory…">Save and match</SubmitButton>
    </form>
  );
}
