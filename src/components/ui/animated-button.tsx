import { motion } from "framer-motion";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface AnimatedButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  label: string;
}

const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, checked = false, label, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          "relative overflow-hidden rounded-full border border-orange-400 px-4 py-2 text-sm font-medium",
          "transition-colors duration-200 ease-in-out",
          "outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2",
          disabled && "opacity-70 cursor-not-allowed",
          className
        )}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        {/* 背景色として満ちていく部分 */}
        <motion.div
          className="absolute inset-0 bg-orange-400"
          initial={{ y: "100%" }}
          animate={{
            y: checked ? "0%" : "100%",
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {/* テキスト */}
        <span
          className={cn(
            "relative z-10 transition-colors duration-300",
            checked ? "text-white" : "text-orange-600"
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
