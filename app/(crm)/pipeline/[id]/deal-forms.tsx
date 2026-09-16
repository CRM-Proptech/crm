"use client";

import { useActionState } from "react";
import { createHold, createOffer } from "@/actions/deals";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function OfferForm({ opportunityId }: { opportunityId: string }) {
  const [state, action] = useActionState(createOffer, {});
  return <form action={action} className="space-y-3"><FormMessage error={state.error} success={state.success} /><input type="hidden" name="opportunityId" value={opportunityId} /><Field label="Offered price (INR)" htmlFor="offeredPrice" required><Input id="offeredPrice" name="offeredPrice" type="number" min="1" required /></Field><Field label="Notes" htmlFor="offerNotes"><Textarea id="offerNotes" name="notes" /></Field><SubmitButton pendingLabel="Submitting…">Submit offer</SubmitButton></form>;
}

export function HoldForm({ opportunityId, unitId }: { opportunityId: string; unitId: string }) {
  const [state, action] = useActionState(createHold, {});
  return <form action={action} className="space-y-3"><FormMessage error={state.error} success={state.success} /><input type="hidden" name="opportunityId" value={opportunityId} /><input type="hidden" name="unitId" value={unitId} /><Field label="Hold expires" htmlFor="expiresAt" required><Input id="expiresAt" name="expiresAt" type="datetime-local" required /></Field><SubmitButton pendingLabel="Holding…">Place hold</SubmitButton></form>;
}
