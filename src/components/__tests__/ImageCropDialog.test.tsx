import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ImageCropDialog from "../ImageCropDialog";

vi.mock("react-easy-crop", () => ({
  default: ({ crop, zoom, onCropChange, onZoomChange }: any) => (
    <div>
      <div data-testid="crop-value">{`${crop.x},${crop.y}`}</div>
      <div data-testid="zoom-value">{String(zoom)}</div>
      <button
        type="button"
        data-testid="change-crop"
        onClick={() => onCropChange({ x: 10, y: 20 })}
      >
        crop
      </button>
      <button
        type="button"
        data-testid="change-zoom"
        onClick={() => onZoomChange(2.5)}
      >
        zoom
      </button>
    </div>
  ),
}));

describe("ImageCropDialog", () => {
  it("再オープン時にcrop/zoom状態を初期値へ戻す", () => {
    const props = {
      onClose: vi.fn(),
      onCropComplete: vi.fn(),
    };

    const { rerender } = render(
      <ImageCropDialog isOpen={true} imageSrc="image-a.jpg" {...props} />
    );

    expect(screen.getByTestId("crop-value")).toHaveTextContent("0,0");
    expect(screen.getByTestId("zoom-value")).toHaveTextContent("1");

    fireEvent.click(screen.getByTestId("change-crop"));
    fireEvent.click(screen.getByTestId("change-zoom"));

    expect(screen.getByTestId("crop-value")).toHaveTextContent("10,20");
    expect(screen.getByTestId("zoom-value")).toHaveTextContent("2.5");

    rerender(<ImageCropDialog isOpen={false} imageSrc="image-a.jpg" {...props} />);
    rerender(<ImageCropDialog isOpen={true} imageSrc="image-b.jpg" {...props} />);

    expect(screen.getByTestId("crop-value")).toHaveTextContent("0,0");
    expect(screen.getByTestId("zoom-value")).toHaveTextContent("1");
  });
});
