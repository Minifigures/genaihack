"use client";

import { Card, CardContent } from "@/components/ui/card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  color?: "green" | "red" | "yellow" | "blue" | "gray";
  icon?: LucideIcon;
}

const colorConfig: Record<string, { border: string; iconBg: string; iconText: string; value: string }> = {
  green: { border: "border-t-emerald-500", iconBg: "bg-emerald-50", iconText: "text-emerald-600", value: "text-emerald-700" },
  red: { border: "border-t-red-500", iconBg: "bg-red-50", iconText: "text-red-500", value: "text-red-600" },
  yellow: { border: "border-t-amber-500", iconBg: "bg-amber-50", iconText: "text-amber-500", value: "text-amber-600" },
  blue: { border: "border-t-blue-500", iconBg: "bg-blue-50", iconText: "text-blue-500", value: "text-blue-600" },
  gray: { border: "border-t-gray-400", iconBg: "bg-gray-50", iconText: "text-gray-500", value: "text-gray-700" },
};

export function KPICard({ title, value, subtitle, color = "gray", icon: Icon }: KPICardProps) {
  const colors = colorConfig[color];
  const numericValue = typeof value === "number" ? value : null;

  return (
    <Card className={cn("border-t-2 hover:shadow-md transition-shadow", colors.border)}>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {Icon && (
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colors.iconBg, colors.iconText)}>
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
        <p className={cn("text-3xl font-bold tracking-tight", colors.value)}>
          {numericValue !== null ? <NumberTicker value={numericValue} /> : value}
        </p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
