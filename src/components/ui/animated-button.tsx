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
          "shadow-[0_4px_10px_rgba(15,23,42,0.18)] focus:shadow-[0_6px_14px_rgba(15,23,42,0.2)]",
          "outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1",
          "hover:translate-y-[1px] hover:shadow-[0_2px_6px_rgba(15,23,42,0.16)] active:translate-y-[1px] active:shadow-[0_2px_6px_rgba(15,23,42,0.16)]",
          disabled &&
            "opacity-70 cursor-not-allowed hover:translate-y-0 hover:shadow-[0_4px_10px_rgba(15,23,42,0.18)] active:translate-y-0 active:shadow-[0_4px_10px_rgba(15,23,42,0.18)]",
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
