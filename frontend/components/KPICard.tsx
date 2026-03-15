"use client";

import { Card, CardContent } from "@/components/ui/card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: "green" | "red" | "yellow" | "blue" | "gray";
}

// Left-border accent colors — 3px solid, semantic palette
const accentMap: Record<string, string> = {
  green:  "border-l-[3px] border-l-primary",
  red:    "border-l-[3px] border-l-[hsl(var(--status-review-fg))]",
  yellow: "border-l-[3px] border-l-[hsl(43_96%_50%)]",
  blue:   "border-l-[3px] border-l-[hsl(221_83%_53%)]",
  gray:   "border-l-[3px] border-l-muted-foreground",
};

const valueColorMap: Record<string, string> = {
  green:  "text-primary",
  red:    "text-[hsl(var(--status-review-fg))]",
  yellow: "text-[hsl(43_96%_38%)]",
  blue:   "text-[hsl(221_83%_46%)]",
  gray:   "text-foreground",
};

export function KPICard({ title, value, subtitle, color = "gray" }: KPICardProps) {
  const numericValue = typeof value === "number" ? value : null;

  return (
    <Card className={cn("hover:shadow-none transition-none", accentMap[color])}>
      <CardContent className="pt-5 pb-4">
        <p className="font-mono text-2xs uppercase tracking-[0.1em] text-muted-foreground mb-2">
          {title}
        </p>
        <p className={cn("font-mono text-[2rem] font-medium leading-none tabular", valueColorMap[color])}>
          {numericValue !== null ? (
            <NumberTicker value={numericValue} />
          ) : (
            value
          )}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
