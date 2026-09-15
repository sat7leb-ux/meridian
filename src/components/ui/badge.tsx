import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "confirmed" | "pending" | "cancelled" | "outline";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-hairline/20 text-ink",
    confirmed: "pill-confirmed",
    pending: "pill-pending",
    cancelled: "pill-cancelled",
    outline: "border border-hairline text-mute",
  };
  return (
    <span className={cn("pill inline-flex items-center gap-1", variants[variant], className)}>
      {children}
    </span>
  );
}
