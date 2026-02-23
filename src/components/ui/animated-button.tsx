import { motion } from "framer-motion";
import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  label: ReactNode;
}

const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, checked = false, label, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          "relative overflow-hidden rounded-full border border-gray-300 px-4 py-2 h-10 text-sm font-medium min-w-[48px]",
          "transition-all duration-200 ease-in-out",
          "shadow-md hover:shadow-lg focus:shadow-xl",
          "outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1",
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
