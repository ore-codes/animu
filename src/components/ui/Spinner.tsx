import React from "react";
import { cn } from "../../lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function Spinner({ className, label = "LOADING...", ...props }: SpinnerProps) {
  return (
    <div
      className={cn(
        "text-center p-16 font-space text-brand-muted text-[0.8rem] tracking-[0.2em]",
        className
      )}
      {...props}
    >
      <div className="inline-block w-[30px] h-[30px] border-2 border-brand-border border-t-brand-pink rounded-full animate-spin mb-4" />
      <br />
      {label}
    </div>
  );
}
