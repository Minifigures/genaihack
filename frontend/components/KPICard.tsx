"use client";

import { Card, CardContent } from "@/components/ui/card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  color?: "green" | "red" | "yellow" | "blue" | "gray";
}

const colorConfig: Record<string, { border: string; icon: string; value: string }> = {
  green: { border: "border-emerald-200", icon: "text-emerald-600", value: "text-emerald-700" },
  red: { border: "border-red-200", icon: "text-red-600", value: "text-red-700" },
  yellow: { border: "border-amber-200", icon: "text-amber-600", value: "text-amber-700" },
  blue: { border: "border-blue-200", icon: "text-blue-600", value: "text-blue-700" },
  gray: { border: "border-gray-200", icon: "text-gray-600", value: "text-gray-700" },
};

export function KPICard({ title, value, subtitle, color = "gray" }: KPICardProps) {
  const colors = colorConfig[color];
  const numericValue = typeof value === "number" ? value : null;

  return (
    <Card className={cn("border-l-4 hover:shadow-md transition-shadow", colors.border)}>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={cn("text-3xl font-bold mt-1", colors.value)}>
          {numericValue !== null ? (
            <NumberTicker value={numericValue} />
          ) : (
            value
          )}
        </p>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
