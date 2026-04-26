"use client";

import { BinanceTicker } from "@/hooks/useMarketFeed";
import { AnimatedPrice } from "./AnimatedPrice";

interface TickerStripProps {
  latest: Record<string, BinanceTicker>;
  connected: boolean;
}

const SYMBOLS = ["BTC/USDT", "ETH/USDT", "BNB/USDT"];

const SYMBOL_ICONS: Record<string, string> = {
  "BTC/USDT": "₿",
  "ETH/USDT": "Ξ",
  "BNB/USDT": "◈",
};

export function TickerStrip({ latest, connected }: TickerStripProps) {
  // Duplicate 4x untuk seamless loop
  const items = [...SYMBOLS, ...SYMBOLS, ...SYMBOLS, ...SYMBOLS];

  return (
    <div
      className="w-full overflow-hidden border-b"
      style={{
        borderColor: "var(--color-border)",
        background: "rgba(15,23,42,0.97)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", padding: "0" }}>
        {/* Status Badge */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
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
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.1em",
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
              const isUp = tick?.direction === "UP";
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
                    gap: "8px",
                    padding: "9px 24px",
                    borderRight: "1px solid var(--color-border)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {/* Ikon simbol */}
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: tick ? color : "var(--color-text-muted)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {SYMBOL_ICONS[sym] ?? sym[0]}
                  </span>

                  {/* Nama simbol */}
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                      color: "var(--color-text-secondary)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {sym}
                  </span>

                  {/* Harga — AnimatedPrice (odometer) */}
                  {tick ? (
                    <>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--color-text-muted)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        $
                      </span>
                      <AnimatedPrice
                        price={tick.price}
                        symbol={sym}
                        direction={tick.direction}
                        size="xs"
                      />
                    </>
                  ) : (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--color-text-muted)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      —
                    </span>
                  )}

                  {/* Arah panah */}
                  {tick && (
                    <span
                      style={{
                        fontSize: "10px",
                        color,
                        transition: "color 300ms ease",
                      }}
                    >
                      {isUp ? "▲" : "▼"}
                    </span>
                  )}

                  {/* 24h change */}
                  {tick && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color,
                        fontFamily: "var(--font-mono)",
                        transition: "color 300ms ease",
                      }}
                    >
                      {tick.change24h >= 0 ? "+" : ""}
                      {tick.change24h.toFixed(2)}%
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
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
}
