import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/pages/index";
import { useAuth } from "@/hooks/useAuth";

const getSupplementsMock = vi.fn();
const getSupplementGroupsMock = vi.fn();
const resetTimingsIfDateChangedMock = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/useNotificationHandling", () => ({
  useNotificationHandling: () => ({
    showFeedback: false,
    feedbackTimingId: null,
    animatingIds: [],
    setShowFeedback: vi.fn(),
    setFeedbackTimingId: vi.fn(),
    setAnimatingIds: vi.fn(),
    handleTakeDose: vi.fn(),
    handleFeedbackComplete: vi.fn(),
  }),
}));

vi.mock("@/hooks/useSupplementOperations", () => ({
  useSupplementOperations: () => ({
    resetForm: vi.fn(),
    handleAddOrUpdateSupplement: vi.fn(),
    handleOpenUpdateModal: vi.fn(),
    handleDeleteSupplement: vi.fn(),
    handleImageChange: vi.fn(),
    handleImageDelete: vi.fn(),
    handleImageUpdate: vi.fn(),
    handleUnitChange: vi.fn(),
    handleIncreaseDosageCount: vi.fn(),
    handleDecreaseDosageCount: vi.fn(),
  }),
}));

vi.mock("@/hooks/useScrollManagement", () => ({
  useScrollManagement: vi.fn(),
}));

vi.mock("@/lib/useNotification", () => ({
  useNotification: () => ({
    showNotification: vi.fn(),
  }),
}));

vi.mock("@/lib/firestore", () => ({
  addSupplementGroup: vi.fn(),
  deleteSupplementGroup: vi.fn(),
  getSupplements: (...args: unknown[]) => getSupplementsMock(...args),
  getSupplementGroups: (...args: unknown[]) => getSupplementGroupsMock(...args),
  toggleSupplementGroupMembership: vi.fn(),
  resetTimingsIfDateChanged: (...args: unknown[]) =>
    resetTimingsIfDateChangedMock(...args),
  getCurrentDate: vi.fn(() => "2026/02/28"),
}));

vi.mock("@/components/HeaderSection", () => ({
  default: () => <div data-testid="header-section" />,
}));

vi.mock("@/components/SupplementList", () => ({
  default: () => <div data-testid="supplement-list" />,
}));

vi.mock("@/components/FloatingAddButton", () => ({
  default: () => <button data-testid="floating-add-button" type="button" />,
}));

vi.mock("@/components/AnimatedFeedback", () => ({
  default: () => null,
}));

vi.mock("@/components/SupplementForm", () => ({
  default: () => null,
}));

vi.mock("@/components/LoadingState", () => ({
  default: () => <div data-testid="loading-state">loading</div>,
}));

vi.mock("@/components/EmptyStateCard", () => ({
  default: () => <section data-testid="empty-state-card">empty</section>,
}));

const mockedUseAuth = vi.mocked(useAuth);

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("Home empty-state regression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: { uid: "user-1" } as any,
      loading: false,
    });
    getSupplementGroupsMock.mockResolvedValue([]);
    resetTimingsIfDateChangedMock.mockResolvedValue(undefined);
  });

  it("does not render Empty State before initial supplements loading finishes", async () => {
    const deferred = createDeferred<any[]>();
    getSupplementsMock.mockReturnValue(deferred.promise);

    render(<Home />);

    expect(screen.getByTestId("loading-state")).toBeInTheDocument();
    expect(screen.queryByTestId("empty-state-card")).not.toBeInTheDocument();

    deferred.resolve([]);

    await waitFor(() => {
      expect(screen.getByTestId("empty-state-card")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
  });
});
