"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  type TooltipProps,
} from "recharts";

import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    color?: string;
  }
>;

type ChartContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig;
  children: React.ReactNode;
};

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ className, config, children, style, ...props }, ref) => {
    const cssVars = React.useMemo(() => {
      const entries = Object.entries(config).map(([key, value]) => {
        const color = value.color ?? "hsl(var(--foreground))";
        return [`--color-${key}`, color];
      });
      return Object.fromEntries(entries);
    }, [config]);

    return (
      <div
        ref={ref}
        className={cn("h-[260px] w-full", className)}
        style={{
          ...(style as React.CSSProperties),
          ...(cssVars as React.CSSProperties),
        }}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    );
  },
);
ChartContainer.displayName = "ChartContainer";

type ChartTooltipWrapperProps = React.ComponentProps<typeof RechartsTooltip>;

const ChartTooltip = (props: ChartTooltipWrapperProps) => {
  return (
    <RechartsTooltip
      cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
      wrapperStyle={{ outline: "none" }}
      {...props}
    />
  );
};

const ChartTooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="min-w-[160px] rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 shadow-xl backdrop-blur">
      {label ? <div className="mb-2 text-slate-400">{label}</div> : null}
      <div className="space-y-1">
        {payload.map((item: any) => (
          <div
            key={item.dataKey?.toString() ?? item.name}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-2 w-2 rounded-full"
                style={{
                  backgroundColor: item.color,
                }}
              />
              <span className="text-slate-300">{item.name}</span>
            </div>
            <span className="font-semibold text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export { ChartContainer, ChartTooltip, ChartTooltipContent };
