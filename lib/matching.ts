import type { BuyerRequirement, Unit, UnitType } from "@prisma/client";
import { db } from "./db";
import { parseUnitTypes } from "./format";

type ScoreInput = {
  requirement: BuyerRequirement;
  unit: Unit & { tower: { project: { city: string; locality: string; possession: string | null } } };
};

export function scoreUnit({ requirement, unit }: ScoreInput) {
  const reasons: string[] = [];
  let score = 0;
  const types = parseUnitTypes(requirement.unitTypes) as UnitType[];
  const project = unit.tower.project;

  if (project.city.toLowerCase() === requirement.city.toLowerCase()) {
    score += 25;
    reasons.push(`City match: ${project.city}`);
  } else {
    return { score: 0, reasons: ["Different city"] };
  }

  if (
    requirement.locality &&
    project.locality.toLowerCase().includes(requirement.locality.toLowerCase())
  ) {
    score += 15;
    reasons.push(`Locality match: ${project.locality}`);
  }

  if (types.includes(unit.type)) {
    score += 25;
    reasons.push("Configuration matches");
  }

  if (unit.price >= requirement.budgetMin && unit.price <= requirement.budgetMax) {
    score += 25;
    reasons.push("Inside budget");
  } else {
    const cushion = requirement.budgetMax * 0.1;
    if (unit.price <= requirement.budgetMax + cushion && unit.price >= requirement.budgetMin - cushion) {
      score += 12;
      reasons.push("Within 10% of budget");
    }
  }

  if (unit.status === "AVAILABLE") {
    score += 10;
    reasons.push("Available now");
  }

  if (
    requirement.possessionBy &&
    project.possession &&
    (project.possession.toLowerCase().includes(requirement.possessionBy.toLowerCase()) ||
      requirement.possessionBy.toLowerCase().includes("ready") &&
        project.possession.toLowerCase().includes("ready"))
  ) {
    score += 10;
    reasons.push(`Possession: ${project.possession}`);
  }

  return { score, reasons };
}

export async function runMatching(requirementId: string) {
  const requirement = await db.buyerRequirement.findUnique({
    where: { id: requirementId },
  });
  if (!requirement) {
    throw new Error("Requirement not found");
  }

  const units = await db.unit.findMany({
    where: { status: { in: ["AVAILABLE", "HELD"] } },
    include: { tower: { include: { project: true } } },
  });

  const results = [];
  for (const unit of units) {
    const { score, reasons } = scoreUnit({ requirement, unit });
    if (score < 40) continue;

    const match = await db.propertyMatch.upsert({
      where: {
        requirementId_unitId: { requirementId, unitId: unit.id },
      },
      create: {
        requirementId,
        unitId: unit.id,
        score,
        reasons: JSON.stringify(reasons),
      },
      update: {
        score,
        reasons: JSON.stringify(reasons),
      },
    });
    results.push(match);
  }

  return results.sort((a, b) => b.score - a.score);
}
