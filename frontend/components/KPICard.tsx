"use client";

import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  color?: "green" | "red" | "yellow" | "blue" | "gray";
  icon?: LucideIcon;
}

const colorConfig: Record<
  string,
  { border: string; iconBg: string; iconText: string; valueTxt: string }
> = {
  green: {
    border: "border-t-vigil-500",
    iconBg: "bg-vigil-50",
    iconText: "text-vigil-600",
    valueTxt: "text-vigil-700",
  },
  red: {
    border: "border-t-red-500",
    iconBg: "bg-red-50",
    iconText: "text-red-500",
    valueTxt: "text-red-600",
  },
  yellow: {
    border: "border-t-amber-500",
    iconBg: "bg-amber-50",
    iconText: "text-amber-500",
    valueTxt: "text-amber-600",
  },
  blue: {
    border: "border-t-blue-500",
    iconBg: "bg-blue-50",
    iconText: "text-blue-500",
    valueTxt: "text-blue-600",
  },
  gray: {
    border: "border-t-slate-400",
    iconBg: "bg-slate-50",
    iconText: "text-slate-500",
    valueTxt: "text-slate-700",
  },
};

export function KPICard({
  title,
  value,
  subtitle,
  color = "gray",
  icon: Icon,
}: KPICardProps) {
  const cfg = colorConfig[color];
  return (
    <div
      className={`card border-t-2 ${cfg.border} p-5 transition-all duration-200 hover:shadow-elevated`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {Icon && (
          <div
            className={`w-8 h-8 rounded-lg ${cfg.iconBg} ${cfg.iconText} flex items-center justify-center`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <p className={`text-3xl font-bold ${cfg.valueTxt} tracking-tight`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
