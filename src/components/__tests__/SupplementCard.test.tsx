import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SupplementCard from "../SupplementCard";
import { SupplementData } from "@/schemas/supplement";

// Mock the useNotification hook
vi.mock("@/lib/useNotification", () => ({
  useNotification: () => ({
    showNotification: vi.fn(),
  }),
}));

const mockSupplement: SupplementData = {
  id: "test-1",
  supplement_name: "ビタミンC",
  dosage: 100,
  dosage_unit: "錠",
  dosage_left: 90,
  intake_amount: 2,
  intake_unit: "錠",
  dosage_method: "timing",
  timing_morning: true,
  timing_noon: true,
  timing_night: true,
  timing_before_meal: false,
  timing_after_meal: false,
  timing_empty_stomach: false,
  timing_bedtime: false,
  timing_as_needed: false,
  takenTimings: {
    morning: false,
    noon: false,
    night: true,
    before_meal: false,
    after_meal: false,
    empty_stomach: false,
    bedtime: false,
  },
  imageUrl: "https://example.com/image.jpg",
};

const mockCountBasedSupplement: SupplementData = {
  id: "test-2",
  supplement_name: "オメガ3",
  dosage: 60,
  dosage_unit: "錠",
  dosage_left: 50,
  intake_amount: 1,
  intake_unit: "錠",
  dosage_method: "count",
  timing_morning: false,
  timing_noon: false,
  timing_night: false,
  timing_before_meal: false,
  timing_after_meal: false,
  timing_empty_stomach: false,
  timing_bedtime: false,
  timing_as_needed: false,
  daily_target_count: 3,
  takenCount: 2,
  imageUrl: "https://example.com/omega3.jpg",
};

const mockProps = {
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onTakeDose: vi.fn(),
  onIncreaseCount: vi.fn(),
  onDecreaseCount: vi.fn(),
  showFeedback: false,
  animatingIds: [],
};

describe("SupplementCard", () => {
  it("サプリメント名が表示される", () => {
    render(<SupplementCard supplement={mockSupplement} {...mockProps} />);
    expect(screen.getByText("ビタミンC")).toBeInTheDocument();
  });

  it("容量情報が表示される", () => {
    render(<SupplementCard supplement={mockSupplement} {...mockProps} />);

    // 残り容量の情報を確認
    expect(screen.getByText("残り:")).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();

    // 1回分の情報を確認
    expect(screen.getByText("1回:")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    // 単位「錠」が2つあることを確認
    const units = screen.getAllByText("錠");
    expect(units).toHaveLength(2);
  });

  it("タイミングベースの場合、朝・昼・夜のボタンが表示される", () => {
    render(<SupplementCard supplement={mockSupplement} {...mockProps} />);

    // AnimatedButtonとして朝・昼・夜のボタンが表示されることを確認
    expect(screen.getByLabelText(/朝の服用/)).toBeInTheDocument();
    expect(screen.getByLabelText(/昼の服用/)).toBeInTheDocument();
    expect(screen.getByLabelText(/夜の服用/)).toBeInTheDocument();
  });

  it("タイミングボタンクリック時にonTakeDoseが呼ばれる", () => {
    render(<SupplementCard supplement={mockSupplement} {...mockProps} />);

    const morningButton = screen.getByLabelText(/朝の服用/);
    fireEvent.click(morningButton);

    expect(mockProps.onTakeDose).toHaveBeenCalledWith("test-1", "morning");
  });

  it("回数ベースの場合、カウンター表示と増減ボタンが表示される", () => {
    render(
      <SupplementCard supplement={mockCountBasedSupplement} {...mockProps} />
    );

    // 正円の回数表示（2つの丸）が表示されることを確認
    expect(screen.getByLabelText("1回目の服用")).toBeInTheDocument();
    expect(screen.getByLabelText("2回目の服用")).toBeInTheDocument();

    // 増減ボタンが表示されることを確認
    expect(screen.getByLabelText("服用回数を増やす")).toBeInTheDocument();
    expect(screen.getByLabelText("服用回数を減らす")).toBeInTheDocument();
  });

  it("回数増減ボタンクリック時に対応する関数が呼ばれる", () => {
    render(
      <SupplementCard supplement={mockCountBasedSupplement} {...mockProps} />
    );

    const increaseButton = screen.getByLabelText("服用回数を増やす");
    const decreaseButton = screen.getByLabelText("服用回数を減らす");

    fireEvent.click(increaseButton);
    expect(mockProps.onIncreaseCount).toHaveBeenCalledWith("test-2");

    fireEvent.click(decreaseButton);
    expect(mockProps.onDecreaseCount).toHaveBeenCalledWith("test-2");
  });

  it("編集・削除ボタンが表示される", () => {
    render(<SupplementCard supplement={mockSupplement} {...mockProps} />);

    expect(screen.getByLabelText(/ビタミンCを編集/)).toBeInTheDocument();
    expect(screen.getByLabelText(/ビタミンCを削除/)).toBeInTheDocument();
  });
});
