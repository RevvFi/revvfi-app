"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: { value: number }[];
  color?: string;
  className?: string;
  showTooltip?: boolean;
}

export function Sparkline({ data, color = "#FF8C47", className, showTooltip = false }: SparklineProps) {
  return (
    <div className={cn("w-full h-8", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          {showTooltip && (
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded bg-surface-container-high border border-outline-variant/20 px-2 py-1 text-xs text-on-surface shadow-lg">
                    {payload[0].value}
                  </div>
                );
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
