import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  color: "blue" | "amber" | "green" | "purple" | "red";
}

const colorMap = {
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  green: "bg-green-50 text-green-600",
  purple: "bg-purple-50 text-purple-600",
  red: "bg-red-50 text-red-600",
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: StatsCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-surface-500">{title}</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-surface-900">
              {value}
            </span>
            {subtitle && (
              <span className="text-sm text-surface-400">{subtitle}</span>
            )}
          </div>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            colorMap[color]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
