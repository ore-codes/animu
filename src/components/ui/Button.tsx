import React from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "icon" | "nav-tab";
  active?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", active, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "transition-all duration-200",
          {
            "font-bebas text-[1.1rem] tracking-[0.15em] px-10 py-[0.7rem] bg-gradient-to-br from-brand-pink to-brand-indigo text-white rounded-sm hover:opacity-90 hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none":
              variant === "primary",
            "font-space text-[0.75rem] tracking-[0.1em] px-6 py-[0.7rem] bg-transparent border border-brand-border text-brand-muted rounded-sm hover:border-brand-muted hover:text-brand-text":
              variant === "ghost",
            "bg-brand-pink text-white px-4 rounded-sm text-base hover:opacity-85":
              variant === "icon",
            "font-space text-[0.75rem] tracking-[0.2em] uppercase px-8 py-4 cursor-pointer border border-transparent border-b-0 bg-transparent text-brand-muted relative -bottom-[1px] hover:text-brand-text":
              variant === "nav-tab",
            "text-brand-text bg-brand-surface border-brand-border border-b-brand-surface":
              variant === "nav-tab" && active,
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
