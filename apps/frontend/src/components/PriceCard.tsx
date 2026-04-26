"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BinanceTicker } from "@/hooks/useMarketFeed";
import { AnimatedPrice } from "./AnimatedPrice";

interface PriceCardProps {
  symbol: string;
  tick: BinanceTicker | undefined;
  isSelected: boolean;
  onClick: () => void;
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(2)}B`;
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(2)}M`;
  return `$${(vol / 1_000).toFixed(1)}K`;
}

const SYMBOL_META: Record<
  string,
  { icon: string; label: string; name: string }
> = {
  "BTC/USDT": { icon: "₿", label: "Bitcoin", name: "BTC/USDT" },
  "ETH/USDT": { icon: "Ξ", label: "Ethereum", name: "ETH/USDT" },
  "BNB/USDT": { icon: "◈", label: "BNB", name: "BNB/USDT" },
};

export function PriceCard({ symbol, tick, isSelected, onClick }: PriceCardProps) {
  const [flashClass, setFlashClass] = useState("");
  const prevPriceRef = useRef<number | undefined>(undefined);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isUp = tick?.direction === "UP";
  const priceColor = tick
    ? isUp
      ? "var(--color-up)"
      : "var(--color-down)"
    : "var(--color-text-muted)";

  // Flash background ketika harga berubah
  useEffect(() => {
    if (!tick) return;
    if (
      prevPriceRef.current !== undefined &&
      prevPriceRef.current !== tick.price
    ) {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      setFlashClass(isUp ? "flash-up" : "flash-down");
      flashTimerRef.current = setTimeout(() => setFlashClass(""), 650);
    }
    prevPriceRef.current = tick.price;
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, [tick?.price, isUp]);

  const meta = SYMBOL_META[symbol];
  const change = tick?.change24h ?? 0;
  const changePositive = change >= 0;

  return (
    <motion.button
      id={`price-card-${symbol.replace("/", "-")}`}
      onClick={onClick}
      whileHover={{ scale: 1.025, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{
        width: "100%",
        background: isSelected
          ? "linear-gradient(135deg, rgba(56,189,248,0.12), rgba(129,140,248,0.1))"
          : "var(--color-bg-card)",
        border: isSelected
          ? "1px solid rgba(56,189,248,0.45)"
          : "1px solid var(--color-border)",
        borderRadius: "14px",
        padding: "18px 20px",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.25s, border-color 0.25s, box-shadow 0.25s",
        boxShadow: isSelected
          ? "0 0 28px rgba(56,189,248,0.12), 0 4px 24px rgba(0,0,0,0.3)"
          : "0 2px 12px rgba(0,0,0,0.2)",
      }}
    >
      {/* Symbol Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "14px",
        }}
      >
        {/* Icon + Name */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: isSelected
                ? "linear-gradient(135deg, rgba(56,189,248,0.2), rgba(129,140,248,0.15))"
                : "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: 700,
              color: isSelected ? "#38bdf8" : "var(--color-text-secondary)",
              fontFamily: "var(--font-mono)",
              flexShrink: 0,
            }}
          >
            {meta?.icon ?? symbol[0]}
          </div>
          <div>
            <div
              style={{
                fontSize: "13px",
                color: "var(--color-text-muted)",
                marginBottom: "1px",
              }}
            >
              {meta?.label ?? symbol}
            </div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {symbol}
            </div>
          </div>
        </div>

        {/* Direction badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
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
          <span style={{ fontSize: "10px", color: priceColor }}>
            {tick ? (isUp ? "▲" : "▼") : "•"}
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: priceColor,
              fontFamily: "var(--font-mono)",
            }}
          >
            {tick ? tick.direction : "WAIT"}
          </span>
        </div>
      </div>

      {/* Price Display — AnimatedPrice (odometer) */}
      <div
        className={flashClass}
        style={{
          marginBottom: "12px",
          borderRadius: "6px",
          padding: "2px 0",
          display: "flex",
          alignItems: "baseline",
          gap: "4px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            color: "var(--color-text-muted)",
            fontFamily: "var(--font-mono)",
            marginRight: "2px",
            alignSelf: "center",
          }}
        >
          $
        </span>
        <AnimatedPrice
          price={tick?.price}
          symbol={symbol}
          direction={tick?.direction ?? null}
          size="md"
        />
      </div>

      {/* Bottom Row: Volume + 24h change */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <span
            style={{ fontSize: "10px", color: "var(--color-text-muted)" }}
          >
            Vol 24h
          </span>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {tick ? formatVolume(tick.volume) : "—"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span
            style={{ fontSize: "10px", color: "var(--color-text-muted)" }}
          >
            24h Change
          </span>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              color: tick
                ? changePositive
                  ? "var(--color-up)"
                  : "var(--color-down)"
                : "var(--color-text-muted)",
              // Transisi warna lembut (tidak berkedip)
              transition: "color 300ms ease",
            }}
          >
            {tick ? `${changePositive ? "+" : ""}${change.toFixed(2)}%` : "—"}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
