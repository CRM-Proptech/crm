import type {
  LeadSource,
  LeadStatus,
  MatchStatus,
  OpportunityStage,
  Role,
  UnitStatus,
  UnitType,
  VisitStatus,
} from "@prisma/client";

export const SESSION_COOKIE = "keystone_session";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  SALES: "Sales",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  UNQUALIFIED: "Unqualified",
  CONVERTED: "Converted",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE: "Website",
  PORTAL: "Portal",
  REFERRAL: "Referral",
  WALK_IN: "Walk-in",
  BROKER: "Broker",
  CAMPAIGN: "Campaign",
  OTHER: "Other",
};

export const STAGE_LABELS: Record<OpportunityStage, string> = {
  NEW: "New",
  QUALIFIED: "Qualified",
  MATCHING: "Matching",
  SITE_VISIT: "Site visit",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export const PIPELINE_STAGES: OpportunityStage[] = [
  "NEW",
  "QUALIFIED",
  "MATCHING",
  "SITE_VISIT",
  "NEGOTIATION",
  "WON",
  "LOST",
];

export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  STUDIO: "Studio",
  ONE_BHK: "1 BHK",
  TWO_BHK: "2 BHK",
  THREE_BHK: "3 BHK",
  FOUR_BHK: "4 BHK",
  PENTHOUSE: "Penthouse",
  VILLA: "Villa",
  PLOT: "Plot",
};

export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  AVAILABLE: "Available",
  HELD: "Held",
  BOOKED: "Booked",
  SOLD: "Sold",
};

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  NO_SHOW: "No-show",
  CANCELLED: "Cancelled",
};

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  SUGGESTED: "Suggested",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
  VISITED: "Visited",
};

export const CITIES = ["Mumbai", "Pune", "Bengaluru", "Hyderabad", "Delhi NCR"] as const;
