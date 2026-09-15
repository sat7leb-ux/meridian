import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover }: CardProps) {
  return (
    <div
      className={cn(
        "card p-5",
        hover && "hover:border-teal transition-colors cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
}

export function StatCard({ label, value, icon, trend }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-mute">{label}</span>
        {icon && <div className="text-teal">{icon}</div>}
      </div>
      <div className="tabular text-2xl font-display font-bold">{value}</div>
      {trend && <div className="text-xs text-mute mt-1">{trend}</div>}
    </Card>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-display font-semibold mb-2">{title}</h3>
      <p className="text-mute mb-4">{description}</p>
      {action}
    </div>
  );
}
