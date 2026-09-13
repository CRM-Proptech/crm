import type {
  LeadStatus,
  MatchStatus,
  OpportunityStage,
  UnitStatus,
  VisitStatus,
} from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  LEAD_STATUS_LABELS,
  MATCH_STATUS_LABELS,
  STAGE_LABELS,
  UNIT_STATUS_LABELS,
  VISIT_STATUS_LABELS,
} from "@/lib/constants";

const leadTone: Record<LeadStatus, "neutral" | "primary" | "success" | "warning" | "danger"> = {
  NEW: "primary",
  CONTACTED: "warning",
  QUALIFIED: "success",
  UNQUALIFIED: "danger",
  CONVERTED: "success",
};

const stageTone: Record<OpportunityStage, "neutral" | "primary" | "success" | "warning" | "danger"> = {
  NEW: "neutral",
  QUALIFIED: "primary",
  MATCHING: "primary",
  SITE_VISIT: "warning",
  NEGOTIATION: "warning",
  WON: "success",
  LOST: "danger",
};

const unitTone: Record<UnitStatus, "neutral" | "primary" | "success" | "warning" | "danger"> = {
  AVAILABLE: "success",
  HELD: "warning",
  BOOKED: "primary",
  SOLD: "neutral",
};

export function LeadBadge({ status }: { status: LeadStatus }) {
  return <Badge tone={leadTone[status]}>{LEAD_STATUS_LABELS[status]}</Badge>;
}

export function StageBadge({ stage }: { stage: OpportunityStage }) {
  return <Badge tone={stageTone[stage]}>{STAGE_LABELS[stage]}</Badge>;
}

export function UnitBadge({ status }: { status: UnitStatus }) {
  return <Badge tone={unitTone[status]}>{UNIT_STATUS_LABELS[status]}</Badge>;
}

export function VisitBadge({ status }: { status: VisitStatus }) {
  const tone =
    status === "COMPLETED" ? "success" : status === "SCHEDULED" ? "primary" : status === "NO_SHOW" ? "danger" : "neutral";
  return <Badge tone={tone}>{VISIT_STATUS_LABELS[status]}</Badge>;
}

export function MatchBadge({ status }: { status: MatchStatus }) {
  const tone =
    status === "SHORTLISTED" ? "success" : status === "REJECTED" ? "danger" : status === "VISITED" ? "primary" : "neutral";
  return <Badge tone={tone}>{MATCH_STATUS_LABELS[status]}</Badge>;
}
