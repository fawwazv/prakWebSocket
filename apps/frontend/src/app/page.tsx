"use client";

import { useState, useEffect } from "react";
import { useMarketFeed, SYMBOLS } from "@/hooks/useMarketFeed";
import { TickerStrip } from "@/components/TickerStrip";
import { LiveChart } from "@/components/LiveChart";
import { OrderBook } from "@/components/OrderBook";
import { PriceCard } from "@/components/PriceCard";
import { AnimatedPrice } from "@/components/AnimatedPrice";

export default function DashboardPage() {
  const { ticks, latest, orderBooks, connected } = useMarketFeed();
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTC/USDT");

  const selectedTick = latest[selectedSymbol];
  const selectedTicks = ticks[selectedSymbol] ?? [];
  const selectedOrderBook = orderBooks[selectedSymbol];

  return (
    <div
      id="dashboard-root"
      style={{
        minHeight: "100vh",
        background: "var(--color-bg-base)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          padding: "0 24px",
          height: "58px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--color-border)",
          background: "rgba(2, 6, 23, 0.97)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Logo */}
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "9px",
              background: "linear-gradient(135deg, #38bdf8, #818cf8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "17px",
              boxShadow: "0 0 16px rgba(56,189,248,0.3)",
            }}
          >
            ₿
          </div>
          <div>
            <h1
              className="text-gradient"
              style={{
                fontSize: "18px",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              CryptoLive
            </h1>
            <p
              style={{
                fontSize: "10px",
                color: "var(--color-text-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginTop: "2px",
              }}
            >
              Binance Real-Time Feed
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Clock */}
          <LiveClock />

          {/* Connection status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "20px",
              background: connected
                ? "rgba(74,222,128,0.08)"
                : "rgba(248,113,113,0.08)",
              border: `1px solid ${
                connected
                  ? "rgba(74,222,128,0.25)"
                  : "rgba(248,113,113,0.25)"
              }`,
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: connected
                  ? "var(--color-up)"
                  : "var(--color-down)",
                display: "block",
                animation: connected ? "status-pulse 2s infinite" : "none",
              }}
            />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: connected
                  ? "var(--color-up)"
                  : "var(--color-down)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.05em",
              }}
            >
              {connected ? "LIVE · BINANCE" : "DISCONNECTED"}
            </span>
          </div>
        </div>
      </header>

      {/* ── Ticker Strip ── */}
      <TickerStrip latest={latest} connected={connected} />

      {/* ── Main Content ── */}
      <main
        style={{
          flex: 1,
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxWidth: "1600px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {/* ── Symbol Selector Cards ── */}
        <section id="symbol-cards" aria-label="Crypto Pair Selector">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
            }}
          >
            {SYMBOLS.map((sym) => (
              <PriceCard
                key={sym}
                symbol={sym}
                tick={latest[sym]}
                isSelected={selectedSymbol === sym}
                onClick={() => setSelectedSymbol(sym)}
              />
            ))}
          </div>
        </section>

        {/* ── Chart + OrderBook ── */}
        <section
          id="chart-orderbook"
          aria-label="Live Chart and Order Book"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: "20px",
            flex: 1,
            minHeight: "420px",
          }}
        >
          {/* Live Chart Panel */}
          <div
            className="card"
            style={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            {/* Chart Header */}
            <div
              style={{
                padding: "16px 20px 12px",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--color-text-muted)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: "4px",
                  }}
                >
                  Live Price Chart · Binance
                </div>
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-text-primary)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {selectedSymbol}
                </div>
              </div>

              {/* Price besar di chart header — pakai AnimatedPrice */}
              <div style={{ textAlign: "right" }}>
                {selectedTick && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "4px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        color: "var(--color-text-muted)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      $
                    </span>
                    <AnimatedPrice
                      price={selectedTick.price}
                      symbol={selectedSymbol}
                      direction={selectedTick.direction}
                      size="lg"
                    />
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "flex-end",
                    marginTop: "4px",
                  }}
                >
                  {selectedTick && (
                    <span
                      style={{
                        fontSize: "12px",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        color:
                          selectedTick.change24h >= 0
                            ? "var(--color-up)"
                            : "var(--color-down)",
                        transition: "color 300ms ease",
                      }}
                    >
                      {selectedTick.change24h >= 0 ? "+" : ""}
                      {selectedTick.change24h.toFixed(2)}% (24h)
                    </span>
                  )}
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--color-text-muted)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {selectedTicks.length} / 50 pts
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div
              style={{
                flex: 1,
                padding: "16px 8px 8px",
                minHeight: 0,
                height: "320px",
              }}
            >
              <LiveChart symbol={selectedSymbol} ticks={selectedTicks} />
            </div>
          </div>

          {/* Order Book Panel */}
          <div
            className="card"
            style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            <div
              style={{
                padding: "16px 20px 12px",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--color-text-muted)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                Order Book · Depth 5
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-text-primary)",
                }}
              >
                {selectedSymbol}
              </div>
            </div>

            <div style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
              <OrderBook data={selectedOrderBook} symbol={selectedSymbol} />
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          padding: "12px 24px",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(2,6,23,0.8)",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            color: "var(--color-text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          ⚡ Live Binance Feed · Throttled 250ms · Sliding window 50 pts · Framer Motion
        </span>
        <span
          style={{
            fontSize: "11px",
            color: "var(--color-text-muted)",
          }}
        >
          CryptoLive © {new Date().getFullYear()} · Data from Binance WebSocket
        </span>
      </footer>

      <style jsx global>{`
        @keyframes status-pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(74, 222, 128, 0);
          }
        }
      `}</style>
    </div>
  );
}

// ── Live Clock Component ──────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "13px",
        fontWeight: 500,
        color: "var(--color-text-secondary)",
        letterSpacing: "0.05em",
      }}
    >
      {time.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      })}
    </div>
  );
}
