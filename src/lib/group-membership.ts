type GroupAssignable = {
  id: string;
  groupIds?: string[];
};

export const toggleGroupMembershipInList = <T extends GroupAssignable>(
  items: T[],
  itemId: string,
  targetGroupId: string
): T[] => {
  if (!items.some((item) => item.id === itemId)) {
    return items;
  }

  return items.map((item) => {
    if (item.id !== itemId) return item;

    const isAssigned = (item.groupIds || []).includes(targetGroupId);
    const nextGroupIds = isAssigned
      ? (item.groupIds || []).filter((id) => id !== targetGroupId)
      : Array.from(new Set([...(item.groupIds || []), targetGroupId]));

    return { ...item, groupIds: nextGroupIds };
  });
};
