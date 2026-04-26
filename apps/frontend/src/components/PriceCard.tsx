"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Tick } from "@/hooks/useMarketFeed";

interface PriceCardProps {
  symbol: string;
  tick: Tick | undefined;
  isSelected: boolean;
  onClick: () => void;
}

function formatPrice(symbol: string, price: number): string {
  return symbol.includes("IDR")
    ? price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : price.toFixed(5);
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)}M`;
  return `${(vol / 1_000).toFixed(1)}K`;
}

const SYMBOL_FLAGS: Record<string, string> = {
  "USD/IDR": "🇺🇸 / 🇮🇩",
  "EUR/USD": "🇪🇺 / 🇺🇸",
  "GBP/JPY": "🇬🇧 / 🇯🇵",
};

export function PriceCard({ symbol, tick, isSelected, onClick }: PriceCardProps) {
  const [flashClass, setFlashClass] = useState("");
  const prevPriceRef = useRef<number | undefined>(undefined);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isUp = tick?.type === "UP";
  const priceColor = tick
    ? isUp
      ? "var(--color-up)"
      : "var(--color-down)"
    : "var(--color-text-muted)";

  useEffect(() => {
    if (!tick) return;
    if (
      prevPriceRef.current !== undefined &&
      prevPriceRef.current !== tick.currentPrice
    ) {
      // Clear any pending flash
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      setFlashClass(isUp ? "flash-up" : "flash-down");
      flashTimerRef.current = setTimeout(() => setFlashClass(""), 650);
    }
    prevPriceRef.current = tick.currentPrice;

    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, [tick?.currentPrice, isUp]);

  return (
    <motion.button
      id={`price-card-${symbol.replace("/", "-")}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{
        width: "100%",
        background: isSelected
          ? "linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(129, 140, 248, 0.08))"
          : "var(--color-bg-card)",
        border: isSelected
          ? "1px solid rgba(56, 189, 248, 0.4)"
          : "1px solid var(--color-border)",
        borderRadius: "12px",
        padding: "16px 20px",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
        boxShadow: isSelected
          ? "0 0 20px rgba(56, 189, 248, 0.1)"
          : "none",
      }}
    >
      {/* Symbol Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div>
          <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "2px" }}>
            {SYMBOL_FLAGS[symbol] ?? symbol}
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {symbol}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 10px",
            borderRadius: "20px",
            background: tick
              ? isUp
                ? "rgba(74,222,128,0.12)"
                : "rgba(248,113,113,0.12)"
              : "rgba(71,85,105,0.2)",
            border: tick
              ? isUp
                ? "1px solid rgba(74,222,128,0.3)"
                : "1px solid rgba(248,113,113,0.3)"
              : "1px solid var(--color-border)",
          }}
        >
          <span style={{ fontSize: "11px", color: priceColor }}>
            {tick ? (isUp ? "▲" : "▼") : "—"}
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: priceColor,
              fontFamily: "var(--font-mono)",
            }}
          >
            {tick ? tick.type : "WAIT"}
          </span>
        </div>
      </div>

      {/* Price Display */}
      <div
        className={flashClass}
        style={{
          fontSize: "22px",
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
          color: priceColor,
          letterSpacing: "0.02em",
          marginBottom: "10px",
          borderRadius: "6px",
          padding: "2px 0",
          transition: "color 0.3s ease",
        }}
      >
        {tick ? formatPrice(symbol, tick.currentPrice) : "—"}
      </div>

      {/* Volume */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
          Vol
        </span>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 500,
            color: "var(--color-text-secondary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {tick ? formatVolume(tick.volume) : "—"}
        </span>
      </div>
    </motion.button>
  );
}
