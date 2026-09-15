import { describe, expect, it } from "vitest";
import {
  addMilliseconds,
  AUTO_APPROVAL_DISCOUNT_BPS,
  discountBps,
  FIRST_CONTACT_SLA_MS,
  nextRoundRobinUser,
  offerNeedsApproval,
} from "./sales-policy";

describe("discount policy", () => {
  it("auto-approves discounts at or below five percent", () => {
    expect(discountBps(10_000, 9_500)).toBe(AUTO_APPROVAL_DISCOUNT_BPS);
    expect(offerNeedsApproval(10_000, 9_500)).toBe(false);
    expect(offerNeedsApproval(10_000, 9_499)).toBe(true);
  });

  it("does not treat a premium as a discount", () => {
    expect(discountBps(10_000, 10_500)).toBe(0);
  });
});

describe("routing and time policy", () => {
  const users = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("cycles after the prior active sales user", () => {
    expect(nextRoundRobinUser(users, "a")?.id).toBe("b");
    expect(nextRoundRobinUser(users, "c")?.id).toBe("a");
    expect(nextRoundRobinUser(users, "removed")?.id).toBe("a");
  });

  it("applies the first contact SLA exactly", () => {
    const start = new Date("2026-01-01T00:00:00.000Z");
    expect(addMilliseconds(start, FIRST_CONTACT_SLA_MS).toISOString()).toBe("2026-01-01T04:00:00.000Z");
  });
});
