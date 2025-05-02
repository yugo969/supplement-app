import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  errorMessage?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, errorMessage, ...props }, ref) => {
    const uniqueId = React.useId();
    const inputId = props.id || `input-${uniqueId}`;
    const errorId = errorMessage ? `${inputId}-error` : undefined;

    return (
      <div className="relative w-full">
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-500 focus-visible:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            errorMessage &&
              "border-destructive focus-visible:ring-destructive focus-visible:border-destructive",
            className
          )}
          ref={ref}
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={errorId}
          {...props}
        />
        {errorMessage && (
          <p id={errorId} className="mt-1 text-sm text-destructive">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
