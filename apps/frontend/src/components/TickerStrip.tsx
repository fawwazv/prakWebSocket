"use client";

import { Tick } from "@/hooks/useMarketFeed";

interface TickerStripProps {
  latest: Record<string, Tick>;
  connected: boolean;
}

const SYMBOLS = ["USD/IDR", "EUR/USD", "GBP/JPY"];

function formatPrice(symbol: string, price: number): string {
  return symbol.includes("IDR")
    ? price.toLocaleString("en-US", { minimumFractionDigits: 2 })
    : price.toFixed(5);
}

export function TickerStrip({ latest, connected }: TickerStripProps) {
  // Duplicate items for seamless loop
  const items = [...SYMBOLS, ...SYMBOLS, ...SYMBOLS, ...SYMBOLS];

  return (
    <div className="w-full overflow-hidden border-b" style={{ borderColor: "var(--color-border)", background: "rgba(15,23,42,0.95)" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "0" }}>
        {/* Status Badge */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRight: "1px solid var(--color-border)",
            background: "var(--color-bg-card)",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: connected ? "var(--color-up)" : "#ef4444",
              display: "block",
              boxShadow: connected
                ? "0 0 8px var(--color-up)"
                : "0 0 8px #ef4444",
              animation: connected ? "pulse 2s infinite" : "none",
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: connected ? "var(--color-up)" : "#ef4444",
              textTransform: "uppercase",
              fontFamily: "var(--font-mono)",
            }}
          >
            {connected ? "LIVE" : "OFFLINE"}
          </span>
        </div>

        {/* Scrolling Ticker */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div className="ticker-track">
            {items.map((sym, i) => {
              const tick = latest[sym];
              const isUp = tick?.type === "UP";
              const color = tick
                ? isUp
                  ? "var(--color-up)"
                  : "var(--color-down)"
                : "var(--color-text-secondary)";

              return (
                <div
                  key={`${sym}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 28px",
                    borderRight: "1px solid var(--color-border)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      color: "var(--color-text-secondary)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {sym}
                  </span>

                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color,
                      fontFamily: "var(--font-mono)",
                      transition: "color 0.2s",
                    }}
                  >
                    {tick ? formatPrice(sym, tick.currentPrice) : "—"}
                  </span>

                  {tick && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color,
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
                      }}
                    >
                      {isUp ? "▲" : "▼"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
