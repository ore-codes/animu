import React from "react";
import { cn } from "../../lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => {
  return (
    <div className="relative w-full">
      <select
        ref={ref}
        className={cn(
          "w-full bg-brand-bg border border-brand-border text-brand-text px-3 py-2.5 font-noto text-[0.85rem] rounded-[4px] outline-none transition-colors duration-200 focus:border-brand-pink appearance-none cursor-pointer pr-10",
          className
        )}
        {...props}
      />
      {/* Custom dropdown arrow */}
      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-brand-muted">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  );
});
Select.displayName = "Select";
