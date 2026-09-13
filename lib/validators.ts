import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  phone: z.string().trim().min(10, "Enter a valid phone"),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required"),
  source: z.enum(["WEBSITE", "PORTAL", "REFERRAL", "WALK_IN", "BROKER", "CAMPAIGN", "OTHER"]),
  notes: z.string().trim().optional(),
  assignedToId: z.string().optional(),
});

export const requirementSchema = z.object({
  customerId: z.string().min(1),
  city: z.string().trim().min(1, "City is required"),
  locality: z.string().trim().optional(),
  unitTypes: z.array(z.string()).min(1, "Pick at least one configuration"),
  budgetMin: z.coerce.number().min(0, "Minimum budget is required"),
  budgetMax: z.coerce.number().min(1, "Maximum budget is required"),
  possessionBy: z.string().trim().optional(),
  purpose: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const visitSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  projectId: z.string().min(1, "Project is required"),
  unitId: z.string().optional(),
  opportunityId: z.string().optional(),
  scheduledAt: z.string().min(1, "Schedule a time"),
  hostedById: z.string().min(1, "Host is required"),
});

export const userSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
  role: z.enum(["ADMIN", "MANAGER", "SALES"]),
});

export type ActionState = {
  error?: string;
  success?: string;
  duplicate?: {
    customerName: string;
    customerId: string;
  };
};
