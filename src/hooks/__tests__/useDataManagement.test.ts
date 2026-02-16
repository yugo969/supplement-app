import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDataManagement } from "../useDataManagement";

vi.mock("@/lib/firestore", () => ({
  getSupplements: vi.fn(),
  resetTimingsIfDateChanged: vi.fn(),
  getCurrentDate: vi.fn(() => "2026/02/16"),
}));

import { getSupplements, resetTimingsIfDateChanged } from "@/lib/firestore";

const mockedGetSupplements = vi.mocked(getSupplements);
const mockedResetTimingsIfDateChanged = vi.mocked(resetTimingsIfDateChanged);

const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe("useDataManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("supplement data processing完了後にloadingをfalseへ戻す", async () => {
    const deferred = createDeferred<void>();

    mockedGetSupplements.mockResolvedValue([
      {
        id: "supp-1",
        shouldResetTimings: true,
        dosage_method: "count",
        takenCount: 3,
        dosageHistory: ["2026/02/15"],
      } as any,
    ]);
    mockedResetTimingsIfDateChanged.mockImplementation(() => deferred.promise);

    const setSupplements = vi.fn();
    const setIsSupplementsLoading = vi.fn();

    const { unmount } = renderHook(() =>
      useDataManagement({
        user: { uid: "user-1" },
        setSupplements,
        setIsSupplementsLoading,
      })
    );

    await waitFor(() => {
      expect(mockedGetSupplements).toHaveBeenCalledTimes(1);
    });

    expect(setIsSupplementsLoading).toHaveBeenCalledWith(true);
    expect(setSupplements).not.toHaveBeenCalled();
    expect(setIsSupplementsLoading).not.toHaveBeenCalledWith(false);

    deferred.resolve();

    await waitFor(() => {
      expect(setSupplements).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(setIsSupplementsLoading).toHaveBeenLastCalledWith(false);
    });

    unmount();
  });
});
