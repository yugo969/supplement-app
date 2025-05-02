import { motion } from "framer-motion";
import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AnimatedButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  label: ReactNode;
}

const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, checked = false, label, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          "relative overflow-hidden rounded-full border-2 border-gray-500 px-3 py-1 h-8 text-xs font-medium",
          "transition-all duration-200 ease-in-out",
          "shadow-sm hover:shadow focus:shadow-md",
          "outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1",
          "hover:scale-105 active:scale-95",
          disabled &&
            "opacity-70 cursor-not-allowed hover:scale-100 active:scale-100",
          className
        )}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        {/* 背景色として満ちていく部分 */}
        <motion.div
          className="absolute inset-0 bg-gray-700"
          initial={{ y: "100%" }}
          animate={{
            y: checked ? "0%" : "100%",
          }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        />

        {/* テキスト */}
        <span
          className={cn(
            "relative z-10 transition-colors duration-200 flex items-center justify-center",
            checked ? "text-white" : "text-gray-700"
          )}
        >
          {label}
        </span>
      </button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

export { AnimatedButton };
