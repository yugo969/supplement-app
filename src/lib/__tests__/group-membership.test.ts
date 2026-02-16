import { describe, expect, it } from "vitest";
import { toggleGroupMembershipInList } from "@/lib/group-membership";

type MockItem = {
  id: string;
  groupIds?: string[];
  name: string;
};

describe("toggleGroupMembershipInList", () => {
  it("adds target group when not assigned", () => {
    const items: MockItem[] = [
      { id: "a", name: "A", groupIds: ["g1"] },
      { id: "b", name: "B", groupIds: ["g2"] },
    ];

    const next = toggleGroupMembershipInList(items, "a", "g3");

    expect(next[0].groupIds).toEqual(["g1", "g3"]);
  });

  it("removes target group when already assigned", () => {
    const items: MockItem[] = [{ id: "a", name: "A", groupIds: ["g1", "g2"] }];

    const next = toggleGroupMembershipInList(items, "a", "g2");

    expect(next[0].groupIds).toEqual(["g1"]);
  });

  it("handles undefined groupIds", () => {
    const items: MockItem[] = [{ id: "a", name: "A" }];

    const next = toggleGroupMembershipInList(items, "a", "g1");

    expect(next[0].groupIds).toEqual(["g1"]);
  });

  it("keeps non-target items unchanged", () => {
    const items: MockItem[] = [
      { id: "a", name: "A", groupIds: ["g1"] },
      { id: "b", name: "B", groupIds: ["g2"] },
    ];

    const next = toggleGroupMembershipInList(items, "a", "g3");

    expect(next[1]).toEqual(items[1]);
  });

  it("returns original array when target id does not exist", () => {
    const items: MockItem[] = [{ id: "a", name: "A", groupIds: ["g1"] }];

    const next = toggleGroupMembershipInList(items, "missing", "g2");

    expect(next).toBe(items);
  });
});
