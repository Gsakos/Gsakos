import type { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
}

export function GlassCard({ strong, className = "", children, ...rest }: GlassCardProps) {
  return (
    <div
      className={`${strong ? "glass-strong" : "glass"} rounded-3xl p-6 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
