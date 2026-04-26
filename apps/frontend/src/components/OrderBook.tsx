"use client";

import { motion, AnimatePresence } from "framer-motion";
import { OrderBookData, OrderLevel } from "@/hooks/useMarketFeed";

interface OrderBookProps {
  data: OrderBookData | undefined;
  symbol: string;
}

function formatPrice(_symbol: string, price: number): string {
  // Crypto order book prices — always 2 decimal places (USDT pairs)
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatQty(qty: number): string {
  // Crypto qty bisa berupa desimal kecil (mis. 0.5 BTC)
  if (qty >= 1_000) return `${(qty / 1_000).toFixed(2)}K`;
  if (qty >= 1) return qty.toFixed(4);
  return qty.toFixed(6);
}

function getBarWidth(qty: number, maxQty: number): number {
  return Math.max(6, (qty / maxQty) * 100);
}

interface OrderRowProps {
  level: OrderLevel;
  side: "ask" | "bid";
  maxQty: number;
  symbol: string;
  index: number;
}

function OrderRow({ level, side, maxQty, symbol, index }: OrderRowProps) {
  const isAsk = side === "ask";
  const barColor = isAsk
    ? "rgba(248, 113, 113, 0.15)"
    : "rgba(74, 222, 128, 0.15)";
  const textColor = isAsk ? "var(--color-down)" : "var(--color-up)";
  const barWidth = getBarWidth(level.qty, maxQty);

  return (
    <motion.div
      layout
      key={`${side}-${index}-${level.price}`}
      initial={{ opacity: 0, x: isAsk ? 10 : -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{
        position: "relative",
        display: "flex",
        justifyContent: "space-between",
        padding: "5px 12px",
        fontSize: "12px",
        fontFamily: "var(--font-mono)",
        overflow: "hidden",
        borderRadius: "4px",
      }}
    >
      {/* Depth Bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          [isAsk ? "right" : "left"]: 0,
          height: "100%",
          width: `${barWidth}%`,
          background: barColor,
          borderRadius: "4px",
          transition: "width 0.3s ease",
        }}
      />

      {/* Price */}
      <span style={{ color: textColor, fontWeight: 600, position: "relative", zIndex: 1 }}>
        {formatPrice(symbol, level.price)}
      </span>

      {/* Quantity */}
      <span
        style={{
          color: "var(--color-text-secondary)",
          fontWeight: 400,
          position: "relative",
          zIndex: 1,
        }}
      >
        {formatQty(level.qty)}
      </span>
    </motion.div>
  );
}

export function OrderBook({ data, symbol }: OrderBookProps) {
  if (!data) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "var(--color-text-muted)",
          fontSize: "13px",
          fontFamily: "var(--font-mono)",
        }}
      >
        Connecting...
      </div>
    );
  }

  const allQtys = [...data.asks, ...data.bids].map((l) => l.qty);
  const maxQty = Math.max(...allQtys, 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px", height: "100%" }}>
      {/* Column Headers */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "2px 12px 6px",
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
          fontFamily: "var(--font-mono)",
          borderBottom: "1px solid var(--color-border)",
          marginBottom: "4px",
        }}
      >
        <span>Price</span>
        <span>Qty</span>
      </div>

      {/* ASK Section */}
      <div style={{ marginBottom: "4px" }}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-down)",
            padding: "3px 12px",
            marginBottom: "2px",
          }}
        >
          ASK
        </div>
        <AnimatePresence mode="popLayout">
          {[...data.asks].reverse().map((level, i) => (
            <OrderRow
              key={`ask-${i}`}
              level={level}
              side="ask"
              maxQty={maxQty}
              symbol={symbol}
              index={i}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Spread Indicator */}
      {data.asks.length > 0 && data.bids.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "6px 12px",
            margin: "2px 0",
            background: "var(--color-bg-base)",
            borderRadius: "6px",
            borderTop: "1px solid var(--color-border)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <span style={{ fontSize: "10px", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            SPREAD
          </span>
          <span style={{ fontSize: "11px", color: "var(--color-brand)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            {(data.asks[0].price - data.bids[0].price).toFixed(2)}
          </span>
        </div>
      )}

      {/* BID Section */}
      <div>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-up)",
            padding: "3px 12px",
            marginBottom: "2px",
          }}
        >
          BID
        </div>
        <AnimatePresence mode="popLayout">
          {data.bids.map((level, i) => (
            <OrderRow
              key={`bid-${i}`}
              level={level}
              side="bid"
              maxQty={maxQty}
              symbol={symbol}
              index={i}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
