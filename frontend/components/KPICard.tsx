"use client";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  color?: "green" | "red" | "yellow" | "blue" | "gray";
}

const colorClasses: Record<string, string> = {
  green: "bg-green-50 border-green-200 text-green-700",
  red: "bg-red-50 border-red-200 text-red-700",
  yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
  blue: "bg-blue-50 border-blue-200 text-blue-700",
  gray: "bg-gray-50 border-gray-200 text-gray-700",
};

export function KPICard({ title, value, subtitle, color = "gray" }: KPICardProps) {
  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-sm mt-1 opacity-70">{subtitle}</p>}
    </div>
  );
}
