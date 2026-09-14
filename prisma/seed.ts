import {
  LeadSource,
  LeadStatus,
  OpportunityStage,
  PrismaClient,
  Role,
  UnitStatus,
  UnitType,
  VisitStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { scoreUnit } from "../lib/matching";

const db = new PrismaClient();

async function main() {
  await db.notification.deleteMany();
  await db.task.deleteMany();
  await db.offer.deleteMany();
  await db.unitHold.deleteMany();
  await db.propertyMatch.deleteMany();
  await db.siteVisit.deleteMany();
  await db.opportunity.deleteMany();
  await db.buyerRequirement.deleteMany();
  await db.lead.deleteMany();
  await db.activity.deleteMany();
  await db.unit.deleteMany();
  await db.tower.deleteMany();
  await db.project.deleteMany();
  await db.developer.deleteMany();
  await db.customer.deleteMany();
  await db.user.deleteMany();
  await db.routingState.deleteMany();

  const passwordHash = await bcrypt.hash("keystone", 10);

  const [ananya, vikram, arjun, meera] = await Promise.all([
    db.user.create({
      data: {
        id: "user-ananya",
        name: "Ananya Rao",
        email: "ananya@keystone.local",
        role: Role.ADMIN,
        passwordHash,
      },
    }),
    db.user.create({
      data: {
        id: "user-vikram",
        name: "Vikram Shah",
        email: "vikram@keystone.local",
        role: Role.MANAGER,
        passwordHash,
      },
    }),
    db.user.create({
      data: {
        id: "user-arjun",
        name: "Arjun Mehta",
        email: "arjun@keystone.local",
        role: Role.SALES,
        passwordHash,
      },
    }),
    db.user.create({
      data: {
        id: "user-meera",
        name: "Meera Iyer",
        email: "meera@keystone.local",
        role: Role.SALES,
        passwordHash,
      },
    }),
  ]);

  const lodha = await db.developer.create({ data: { name: "Northline Estates", city: "Mumbai" } });
  const prestige = await db.developer.create({ data: { name: "Groveworks", city: "Bengaluru" } });
  const godrej = await db.developer.create({ data: { name: "Riverfold", city: "Pune" } });

  const meridian = await db.project.create({
    data: {
      id: "proj-meridian",
      developerId: lodha.id,
      name: "Meridian Heights",
      city: "Mumbai",
      locality: "Bandra East",
      possession: "Ready",
      amenities: "Clubhouse, pool, 4-level parking",
    },
  });
  const harbour = await db.project.create({
    data: {
      id: "proj-harbour",
      developerId: lodha.id,
      name: "Harbour House",
      city: "Mumbai",
      locality: "Worli",
      possession: "2027",
      amenities: "Bay deck, concierge",
    },
  });
  const grove = await db.project.create({
    data: {
      id: "proj-grove",
      developerId: prestige.id,
      name: "Grove Residences",
      city: "Bengaluru",
      locality: "Whitefield",
      possession: "Ready",
      amenities: "Park, creche, coworking",
    },
  });
  const riverline = await db.project.create({
    data: {
      id: "proj-river",
      developerId: godrej.id,
      name: "Riverline",
      city: "Pune",
      locality: "Kharadi",
      possession: "2026",
      amenities: "River walk, sports court",
    },
  });

  const towerA = await db.tower.create({
    data: { id: "tower-a", projectId: meridian.id, name: "Tower A", floors: 32 },
  });
  const towerB = await db.tower.create({
    data: { id: "tower-b", projectId: harbour.id, name: "Tower West", floors: 45 },
  });
  const grove1 = await db.tower.create({
    data: { id: "tower-g", projectId: grove.id, name: "Cedar", floors: 18 },
  });
  const river1 = await db.tower.create({
    data: { id: "tower-r", projectId: riverline.id, name: "Block 2", floors: 22 },
  });

  const units = [
    { id: "u1", towerId: towerA.id, number: "1203", floor: 12, type: UnitType.TWO_BHK, carpetSqft: 842, price: 3_40_00_000, status: UnitStatus.AVAILABLE },
    { id: "u2", towerId: towerA.id, number: "1801", floor: 18, type: UnitType.THREE_BHK, carpetSqft: 1180, price: 4_85_00_000, status: UnitStatus.HELD },
    { id: "u3", towerId: towerA.id, number: "2104", floor: 21, type: UnitType.THREE_BHK, carpetSqft: 1210, price: 5_10_00_000, status: UnitStatus.AVAILABLE },
    { id: "u4", towerId: towerA.id, number: "0702", floor: 7, type: UnitType.TWO_BHK, carpetSqft: 810, price: 3_15_00_000, status: UnitStatus.SOLD },
    { id: "u5", towerId: towerB.id, number: "3301", floor: 33, type: UnitType.FOUR_BHK, carpetSqft: 1860, price: 9_40_00_000, status: UnitStatus.AVAILABLE },
    { id: "u6", towerId: towerB.id, number: "1408", floor: 14, type: UnitType.THREE_BHK, carpetSqft: 1420, price: 7_20_00_000, status: UnitStatus.AVAILABLE },
    { id: "u7", towerId: grove1.id, number: "0504", floor: 5, type: UnitType.TWO_BHK, carpetSqft: 1088, price: 1_45_00_000, status: UnitStatus.AVAILABLE },
    { id: "u8", towerId: grove1.id, number: "1102", floor: 11, type: UnitType.THREE_BHK, carpetSqft: 1540, price: 1_92_00_000, status: UnitStatus.AVAILABLE },
    { id: "u9", towerId: grove1.id, number: "0306", floor: 3, type: UnitType.ONE_BHK, carpetSqft: 640, price: 92_00_000, status: UnitStatus.BOOKED },
    { id: "u10", towerId: river1.id, number: "0901", floor: 9, type: UnitType.TWO_BHK, carpetSqft: 980, price: 1_18_00_000, status: UnitStatus.AVAILABLE },
    { id: "u11", towerId: river1.id, number: "1603", floor: 16, type: UnitType.THREE_BHK, carpetSqft: 1360, price: 1_56_00_000, status: UnitStatus.AVAILABLE },
    { id: "u12", towerId: river1.id, number: "0205", floor: 2, type: UnitType.TWO_BHK, carpetSqft: 940, price: 1_08_00_000, status: UnitStatus.AVAILABLE },
  ];

  for (const unit of units) {
    await db.unit.create({ data: unit });
  }

  const rohan = await db.customer.create({
    data: {
      id: "cust-rohan",
      name: "Rohan Kapoor",
      phone: "919820011001",
      email: "rohan.kapoor@example.com",
      city: "Mumbai",
      notes: "End-use, wants school access and a high floor.",
      ownerId: arjun.id,
    },
  });
  const neha = await db.customer.create({
    data: {
      id: "cust-neha",
      name: "Neha Kulkarni",
      phone: "919822233344",
      email: "neha.k@example.com",
      city: "Pune",
      ownerId: meera.id,
    },
  });
  const kabir = await db.customer.create({
    data: {
      id: "cust-kabir",
      name: "Kabir Menon",
      phone: "919845566778",
      email: "kabir.menon@example.com",
      city: "Bengaluru",
      ownerId: meera.id,
    },
  });
  const isha = await db.customer.create({
    data: {
      id: "cust-isha",
      name: "Isha Banerjee",
      phone: "919811122233",
      email: "isha.b@example.com",
      city: "Mumbai",
      ownerId: arjun.id,
    },
  });
  const sameer = await db.customer.create({
    data: {
      id: "cust-sameer",
      name: "Sameer Desai",
      phone: "919900112233",
      city: "Mumbai",
      ownerId: arjun.id,
    },
  });

  await db.lead.createMany({
    data: [
      { id: "lead-1", customerId: rohan.id, source: LeadSource.WEBSITE, status: LeadStatus.QUALIFIED, assignedToId: arjun.id, notes: "Saw Meridian ads, 3 BHK" },
      { id: "lead-2", customerId: rohan.id, source: LeadSource.PORTAL, status: LeadStatus.CONTACTED, assignedToId: arjun.id, notes: "99acres enquiry, same buyer" },
      { id: "lead-3", customerId: neha.id, source: LeadSource.REFERRAL, status: LeadStatus.QUALIFIED, assignedToId: meera.id },
      { id: "lead-4", customerId: kabir.id, source: LeadSource.CAMPAIGN, status: LeadStatus.NEW, assignedToId: meera.id },
      { id: "lead-5", customerId: isha.id, source: LeadSource.WALK_IN, status: LeadStatus.NEW, assignedToId: arjun.id },
      { id: "lead-6", customerId: sameer.id, source: LeadSource.BROKER, status: LeadStatus.CONTACTED, assignedToId: vikram.id },
    ],
  });

  const reqRohan = await db.buyerRequirement.create({
    data: {
      id: "req-rohan",
      customerId: rohan.id,
      city: "Mumbai",
      locality: "Bandra",
      unitTypes: JSON.stringify([UnitType.TWO_BHK, UnitType.THREE_BHK]),
      budgetMin: 3_00_00_000,
      budgetMax: 5_20_00_000,
      possessionBy: "Ready",
      purpose: "End use",
    },
  });
  const reqNeha = await db.buyerRequirement.create({
    data: {
      id: "req-neha",
      customerId: neha.id,
      city: "Pune",
      locality: "Kharadi",
      unitTypes: JSON.stringify([UnitType.TWO_BHK, UnitType.THREE_BHK]),
      budgetMin: 1_00_00_000,
      budgetMax: 1_70_00_000,
      possessionBy: "2026",
      purpose: "Investment",
    },
  });
  const reqKabir = await db.buyerRequirement.create({
    data: {
      id: "req-kabir",
      customerId: kabir.id,
      city: "Bengaluru",
      locality: "Whitefield",
      unitTypes: JSON.stringify([UnitType.TWO_BHK, UnitType.THREE_BHK]),
      budgetMin: 1_20_00_000,
      budgetMax: 2_10_00_000,
      possessionBy: "Ready",
      purpose: "End use",
    },
  });

  const unitRows = await db.unit.findMany({
    include: { tower: { include: { project: true } } },
  });

  for (const requirement of [reqRohan, reqNeha, reqKabir]) {
    for (const unit of unitRows) {
      const { score, reasons } = scoreUnit({ requirement, unit });
      if (score < 40) continue;
      await db.propertyMatch.create({
        data: {
          requirementId: requirement.id,
          unitId: unit.id,
          score,
          reasons: JSON.stringify(reasons),
          status: score >= 80 ? "SHORTLISTED" : "SUGGESTED",
        },
      });
    }
  }

  await db.opportunity.createMany({
    data: [
      {
        id: "opp-rohan",
        customerId: rohan.id,
        ownerId: arjun.id,
        unitId: "u2",
        stage: OpportunityStage.NEGOTIATION,
        value: 4_85_00_000,
      },
      {
        id: "opp-neha",
        customerId: neha.id,
        ownerId: meera.id,
        unitId: "u11",
        stage: OpportunityStage.SITE_VISIT,
        value: 1_56_00_000,
      },
      {
        id: "opp-kabir",
        customerId: kabir.id,
        ownerId: meera.id,
        unitId: "u8",
        stage: OpportunityStage.MATCHING,
        value: 1_92_00_000,
      },
      {
        id: "opp-isha",
        customerId: isha.id,
        ownerId: arjun.id,
        stage: OpportunityStage.NEW,
      },
    ],
  });

  const holdExpiry = new Date(Date.now() + 36 * 60 * 60 * 1000);
  await db.unitHold.create({ data: { id: "hold-rohan", opportunityId: "opp-rohan", unitId: "u2", status: "ACTIVE", expiresAt: holdExpiry, createdById: arjun.id, activeUnitKey: "u2", activeOpportunityKey: "opp-rohan" } });
  await db.offer.createMany({ data: [
    { id: "offer-rohan-auto", opportunityId: "opp-rohan", listPrice: 4_85_00_000, offeredPrice: 4_70_00_000, discountBps: 309, status: "AUTO_APPROVED", createdById: arjun.id, notes: "Initial buyer offer" },
    { id: "offer-rohan-pending", opportunityId: "opp-rohan", listPrice: 4_85_00_000, offeredPrice: 4_50_00_000, discountBps: 722, status: "PENDING", createdById: arjun.id, notes: "Buyer requested a final close price" },
  ] });
  await db.routingState.create({ data: { id: "sales", lastAssignedUserId: arjun.id } });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 6);
  lastWeek.setHours(16, 0, 0, 0);

  await db.siteVisit.createMany({
    data: [
      {
        id: "visit-neha-upcoming",
        customerId: neha.id,
        opportunityId: "opp-neha",
        projectId: riverline.id,
        unitId: "u11",
        hostedById: meera.id,
        scheduledAt: tomorrow,
        status: VisitStatus.SCHEDULED,
      },
      {
        id: "visit-rohan-completed",
        customerId: rohan.id,
        opportunityId: "opp-rohan",
        projectId: meridian.id,
        unitId: "u2",
        hostedById: arjun.id,
        scheduledAt: lastWeek,
        status: VisitStatus.COMPLETED,
        feedback: "Liked the stack and light. Asked for a 2% discount on 1801.",
      },
    ],
  });

  const firstContactDue = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const followUpDue = new Date(Date.now() + 18 * 60 * 60 * 1000);
  await db.task.createMany({ data: [
    { title: "First contact: Isha Banerjee", type: "FIRST_CONTACT", dueAt: firstContactDue, assigneeId: arjun.id, createdById: ananya.id, customerId: isha.id },
    { title: "Follow up after visit: Rohan Kapoor", type: "FOLLOW_UP", dueAt: followUpDue, assigneeId: arjun.id, createdById: arjun.id, customerId: rohan.id, siteVisitId: "visit-rohan-completed" },
  ] });
  await db.notification.createMany({ data: [
    { userId: arjun.id, customerId: isha.id, type: "lead.assigned", title: "New lead assigned", message: "Isha Banerjee was routed to you.", href: "/leads/lead-5", eventKey: "seed:lead-5" },
    { userId: vikram.id, customerId: rohan.id, type: "offer.approval", title: "Discount approval required", message: "Rohan Kapoor: 7.22% discount requested by Arjun Mehta.", href: "/pipeline/opp-rohan", eventKey: "seed:offer-rohan-pending:vikram" },
    { userId: ananya.id, customerId: rohan.id, type: "offer.approval", title: "Discount approval required", message: "Rohan Kapoor: 7.22% discount requested by Arjun Mehta.", href: "/pipeline/opp-rohan", eventKey: "seed:offer-rohan-pending:ananya" },
  ] });

  await db.activity.createMany({
    data: [
      { userId: arjun.id, customerId: rohan.id, type: "lead.created", message: "Website lead captured for Rohan Kapoor" },
      { userId: arjun.id, customerId: rohan.id, type: "requirement.created", message: "Requirement captured for Rohan Kapoor — 3 matches" },
      { userId: arjun.id, customerId: rohan.id, type: "visit.updated", message: "Visit completed for Rohan Kapoor" },
      { userId: meera.id, customerId: neha.id, type: "visit.scheduled", message: "Site visit at Riverline for Neha Kulkarni" },
      { userId: meera.id, customerId: kabir.id, type: "lead.created", message: "Campaign lead captured for Kabir Menon" },
    ],
  });

  console.log("Seeded Keystone Phase 2. Sign in as ananya@keystone.local / keystone");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
