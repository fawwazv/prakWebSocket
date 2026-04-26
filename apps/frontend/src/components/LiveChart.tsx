"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BinanceTicker } from "@/hooks/useMarketFeed";

interface LiveChartProps {
  symbol: string;
  ticks: BinanceTicker[];
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

function formatPrice(_symbol: string, price: number): string {
  // Crypto prices: formatted with commas, 2 decimals
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  symbol: string;
}

function CustomTooltip({ active, payload, label, symbol }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border-bright)",
        borderRadius: "8px",
        padding: "10px 14px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <p style={{ color: "var(--color-text-muted)", fontSize: "11px", marginBottom: "4px", fontFamily: "var(--font-mono)" }}>
        {label}
      </p>
      <p style={{ color: "var(--color-brand)", fontWeight: 600, fontSize: "14px", fontFamily: "var(--font-mono)" }}>
        {formatPrice(symbol, payload[0].value)}
      </p>
    </div>
  );
}

export function LiveChart({ symbol, ticks }: LiveChartProps) {
  const chartData = useMemo(
    () =>
      ticks.map((t) => ({
        time: formatTime(t.timestamp),
        price: t.price,
        direction: t.direction,
      })),
    [ticks]
  );

  const isCurrentlyUp = ticks.length >= 1
    ? ticks[ticks.length - 1].direction !== "DOWN"
    : true;

  const strokeColor = isCurrentlyUp ? "#4ade80" : "#f87171";
  const gradientId = `gradient-${symbol.replace("/", "-")}`;

  // Dynamic Y-axis domain with padding
  const prices = ticks.map((t) => t.price);
  const minP = prices.length > 0 ? Math.min(...prices) : 0;
  const maxP = prices.length > 0 ? Math.max(...prices) : 1;
  const pad = (maxP - minP) * 0.3 || maxP * 0.001;
  const domain = [minP - pad, maxP + pad];

  if (ticks.length === 0) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-muted)",
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "2px solid var(--color-border-bright)",
            borderTopColor: "var(--color-brand)",
            animation: "spin 1s linear infinite",
          }}
        />
        <span>Waiting for data...</span>
        <style jsx global>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
            <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(51,65,85,0.4)"
          vertical={false}
        />

        <XAxis
          dataKey="time"
          tick={{ fill: "#475569", fontSize: 10, fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={60}
        />

        <YAxis
          domain={domain}
          tick={{ fill: "#475569", fontSize: 10, fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          width={80}
          tickFormatter={(v) => formatPrice(symbol, v)}
        />

        <Tooltip
          content={<CustomTooltip symbol={symbol} />}
          cursor={{ stroke: "var(--color-border-bright)", strokeWidth: 1, strokeDasharray: "4 4" }}
        />

        <Area
          type="monotone"
          dataKey="price"
          stroke={strokeColor}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, fill: strokeColor, strokeWidth: 0 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
