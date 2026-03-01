import React from "react";
import { cn } from "../../lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = "404",
  description,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn("text-center py-20 px-8 text-brand-muted", className)}
      {...props}
    >
      <span className="block font-bebas text-8xl text-brand-border tracking-[0.1em] leading-none mb-2">
        {title}
      </span>
      {description && <p>{description}</p>}
    </div>
  );
}
