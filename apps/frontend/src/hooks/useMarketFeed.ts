"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const BACKEND_URL = "http://localhost:4000";
const MAX_POINTS = 50;
const SYMBOLS = ["USD/IDR", "EUR/USD", "GBP/JPY"] as const;

export type SymbolKey = (typeof SYMBOLS)[number];

export interface Tick {
  symbol: string;
  currentPrice: number;
  timestamp: number;
  type: "UP" | "DOWN";
  volume: number;
}

export interface OrderLevel {
  price: number;
  qty: number;
}

export interface OrderBookData {
  symbol: string;
  asks: OrderLevel[];
  bids: OrderLevel[];
}

export interface MarketState {
  ticks: Record<string, Tick[]>;
  latest: Record<string, Tick>;
  orderBooks: Record<string, OrderBookData>;
  connected: boolean;
}

const emptyTicks = () =>
  Object.fromEntries(SYMBOLS.map((s) => [s, []])) as Record<string, Tick[]>;

/**
 * useMarketFeed — WebSocket hook with sliding window + rAF batching
 *
 * Memory safety guarantees:
 * 1. Array capped at MAX_POINTS (50) via `.slice(-MAX_POINTS)`
 * 2. Buffer flushed via requestAnimationFrame (≤60 flushes/sec, not 6/sec)
 * 3. socket.off() + socket.disconnect() + cancelAnimationFrame in cleanup
 * 4. Functional updater `prev =>` avoids stale closures
 */
export function useMarketFeed(): MarketState {
  const [state, setState] = useState<MarketState>({
    ticks: emptyTicks(),
    latest: {},
    orderBooks: {},
    connected: false,
  });

  // Buffer ref: receives raw WS events — never triggers re-render
  const tickBufferRef = useRef<Record<string, Tick[]>>(emptyTicks());
  // rAF handle ref: ensures only one rAF is scheduled at a time
  const rafRef = useRef<number | null>(null);
  // Socket ref: stable reference for cleanup
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setState((prev) => ({ ...prev, connected: true }));
    });

    socket.on("disconnect", () => {
      setState((prev) => ({ ...prev, connected: false }));
    });

    // ── Tick handler: write-only to buffer, no setState here ──
    socket.on("tick", (data: Tick) => {
      const sym = data.symbol;
      if (!tickBufferRef.current[sym]) {
        tickBufferRef.current[sym] = [];
      }
      tickBufferRef.current[sym].push(data);

      // Schedule a single flush per animation frame (batches 500ms ticks → 1 render/frame)
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          // Snapshot & drain the buffer atomically
          const snapshot = tickBufferRef.current;
          tickBufferRef.current = emptyTicks();
          rafRef.current = null;

          setState((prev) => {
            const newTicks = { ...prev.ticks };
            const newLatest = { ...prev.latest };

            for (const [sym, buffered] of Object.entries(snapshot)) {
              if (!buffered || buffered.length === 0) continue;

              // Sliding window: merge + cap to MAX_POINTS
              const merged = [...(newTicks[sym] ?? []), ...buffered];
              newTicks[sym] =
                merged.length > MAX_POINTS
                  ? merged.slice(-MAX_POINTS)
                  : merged;

              // Latest tick for price display
              newLatest[sym] = buffered[buffered.length - 1];
            }

            return { ...prev, ticks: newTicks, latest: newLatest };
          });
        });
      }
    });

    // ── OrderBook handler: direct setState (low frequency, same rate as tick) ──
    socket.on("orderBook", (data: OrderBookData) => {
      setState((prev) => ({
        ...prev,
        orderBooks: { ...prev.orderBooks, [data.symbol]: data },
      }));
    });

    // ── Cleanup: prevent ghost connections on re-mount (Strict Mode, HMR) ──
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("tick");
      socket.off("orderBook");
      socket.disconnect();

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []); // empty deps = mount once, cleanup on unmount

  return state;
}
