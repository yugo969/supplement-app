import "@testing-library/jest-dom";
import { vi } from "vitest";

// Firebase Mock
const mockFirebase = {
  auth: () => ({
    currentUser: null,
    onAuthStateChanged: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
  }),
  firestore: () => ({
    collection: vi.fn(),
    doc: vi.fn(),
  }),
  storage: () => ({
    ref: vi.fn(),
  }),
};

vi.mock("@/lib/firebaseClient", () => ({
  default: mockFirebase,
}));

// React Hook Form Mock
vi.mock("react-hook-form", async () => {
  const actual = await vi.importActual("react-hook-form");
  return {
    ...actual,
    useForm: vi.fn(() => ({
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
      setValue: vi.fn(),
      reset: vi.fn(),
      watch: vi.fn(),
    })),
  };
});

// Next.js Image Mock
vi.mock("next/image", () => ({
  default: vi.fn(),
}));

// Framer Motion Mock
vi.mock("framer-motion", () => ({
  motion: {
    div: "div",
    button: "button",
    span: "span",
  },
  AnimatePresence: vi.fn(),
}));

if (typeof global.ResizeObserver === "undefined") {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // Radix UI の Slider/Dialog で参照されるため、jsdom環境で定義する
  (global as typeof globalThis).ResizeObserver =
    ResizeObserverMock as unknown as typeof ResizeObserver;
}
