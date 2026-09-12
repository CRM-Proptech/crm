# PropTech CRM --- Product Development Docs

## Product Goal

Build a property-native CRM connecting **buyers, requirements,
inventory, sales activity, and transactions** from lead to booking.

## Core Data Model

-   Customer
-   Lead
-   Buyer Requirement
-   Developer
-   Project
-   Tower / Floor / Unit
-   Property Match
-   Opportunity
-   Site Visit
-   Offer / Negotiation
-   Booking
-   Payment
-   Broker / Channel Partner
-   Activity / Communication

## Product Roadmap

### Phase 1 --- Core CRM

-   Authentication, users, roles
-   Customer & lead management
-   Lead deduplication
-   Buyer requirement capture
-   Project + tower + unit inventory
-   Basic sales pipeline
-   Property matching
-   Site visit tracking
-   Basic dashboard

### Phase 2 --- Sales Operations

-   Round-robin lead routing
-   Rule-based + sticky lead routing
-   Follow-ups, tasks & SLA
-   Unified customer activity timeline
-   Site visit scheduling & reminders
-   Property shortlist/comparison
-   Negotiation & discount approvals
-   Unit hold/reservation

### Phase 3 --- Transaction

-   Booking workflow
-   Payment milestones & collections
-   KYC/document tracking
-   Quotations/offers
-   Booking status & audit trail

### Phase 4 --- PropTech Integrations

-   WhatsApp
-   Email
-   Telephony/call logging
-   Website & property-portal lead capture
-   Broker/channel partner management
-   Campaign/source attribution

### Phase 5 --- Intelligence

-   AI lead summaries
-   AI requirement extraction
-   AI lead scoring
-   AI property recommendations
-   AI call summaries
-   Next-best-action
-   Deal-risk detection
-   Revenue forecasting

## Core Workflow

Lead → Qualification → Requirement → Property Match → Site Visit →
Evaluation → Negotiation → Unit Hold → Booking → Payment → Post-Sales

## Key Automations

-   New lead → assign salesperson
-   Uncontacted lead → SLA escalation
-   Qualified lead → property matching
-   High-fit property → notify salesperson
-   Visit scheduled → reminder
-   Visit completed → follow-up task
-   High discount → approval request
-   Hold expiring → alert
-   Missing booking documents → task
-   Payment overdue → collection task

## Product Principle

**Property is a first-class CRM object, not a field on a lead.**

The system should always answer: 1. Who should I contact? 2. What
property should I show them? 3. What happened with this customer? 4.
What is blocking the deal? 5. What is likely to close?
