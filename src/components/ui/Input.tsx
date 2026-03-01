import React from "react";
import { cn } from "../../lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full bg-brand-bg border border-brand-border text-brand-text px-3 py-2.5 font-noto text-[0.85rem] rounded-[4px] outline-none transition-colors duration-200 focus:border-brand-pink appearance-none cursor-text",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
