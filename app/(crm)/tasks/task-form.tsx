"use client";

import { useActionState } from "react";
import { createTask } from "@/actions/tasks";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function TaskForm({ users, customers, currentUserId }: { users: { id: string; name: string }[]; customers: { id: string; name: string }[]; currentUserId: string }) {
  const [state, action] = useActionState(createTask, {});
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><FormMessage error={state.error} success={state.success} /></div>
      <Field label="Task" htmlFor="title" required><Input id="title" name="title" required /></Field>
      <Field label="Due" htmlFor="dueAt" required><Input id="dueAt" name="dueAt" type="datetime-local" required /></Field>
      <Field label="Assignee" htmlFor="assigneeId"><Select id="assigneeId" name="assigneeId" defaultValue={currentUserId}>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</Select></Field>
      <Field label="Customer" htmlFor="customerId"><Select id="customerId" name="customerId" defaultValue=""><option value="">None</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</Select></Field>
      <Field label="Notes" htmlFor="description" className="sm:col-span-2"><Textarea id="description" name="description" /></Field>
      <SubmitButton pendingLabel="Creating…">Create task</SubmitButton>
    </form>
  );
}
