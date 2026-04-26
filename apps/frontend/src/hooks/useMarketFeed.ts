"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const BACKEND_URL = "http://localhost:4000";
const MAX_POINTS = 50;
const THROTTLE_MS = 250; // flush state 4x per detik maksimum

export const SYMBOLS = ["BTC/USDT", "ETH/USDT", "BNB/USDT"] as const;
export type SymbolKey = (typeof SYMBOLS)[number];

// ── Interfaces (sesuai output BinanceRelay) ────────────────────────────────
export interface BinanceTicker {
  symbol: string;
  price: number;
  volume: number;       // quote volume (USDT)
  change24h: number;    // perubahan harga 24h dalam persen
  direction: "UP" | "DOWN";
  timestamp: number;
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
  ticks: Record<string, BinanceTicker[]>;   // sliding window untuk chart
  latest: Record<string, BinanceTicker>;    // snapshot terbaru per simbol
  orderBooks: Record<string, OrderBookData>;
  connected: boolean;
}

const emptyTicks = () =>
  Object.fromEntries(SYMBOLS.map((s) => [s, []])) as Record<string, BinanceTicker[]>;

/**
 * useMarketFeed — Throttled WebSocket hook (250ms interval flush)
 *
 * Arsitektur:
 * - socket.on("tick")  → tulis ke tickBufferRef (tidak trigger render)
 * - socket.on("orderBook") → tulis ke obBufferRef (tidak trigger render)
 * - setInterval(250ms) → drain buffer → setState sekali (max 4 render/detik)
 *
 * Memory safety:
 * 1. Chart array capped di MAX_POINTS (50) via .slice(-MAX_POINTS)
 * 2. Buffer berupa Record<symbol, latestTick> — bukan array (tidak terakumulasi)
 * 3. Cleanup: socket.off + socket.disconnect + clearInterval
 * 4. Functional updater `prev =>` untuk menghindari stale closure
 */
export function useMarketFeed(): MarketState {
  const [state, setState] = useState<MarketState>({
    ticks: emptyTicks(),
    latest: {},
    orderBooks: {},
    connected: false,
  });

  // Buffer refs: terima data mentah — TIDAK trigger render
  // Hanya simpan tick TERBARU per simbol (bukan array) untuk efisiensi
  const tickBufferRef = useRef<Record<string, BinanceTicker>>({});
  const obBufferRef = useRef<Record<string, OrderBookData>>({});
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    const handleConnect = () => setState((prev) => ({ ...prev, connected: true }));
    const handleDisconnect = () => setState((prev) => ({ ...prev, connected: false }));
    const handleTick = (data: BinanceTicker) => { tickBufferRef.current[data.symbol] = data; };
    const handleOrderBook = (data: OrderBookData) => { obBufferRef.current[data.symbol] = data; };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("tick", handleTick);
    socket.on("orderBook", handleOrderBook);

    // ── Throttle flush: drain buffer → setState setiap 250ms ─────────────
    flushIntervalRef.current = setInterval(() => {
      // Ambil snapshot atomik & reset buffer
      const tickSnap = { ...tickBufferRef.current };
      const obSnap = { ...obBufferRef.current };
      tickBufferRef.current = {};
      obBufferRef.current = {};

      // Jika tidak ada data baru di window ini, skip render
      if (
        Object.keys(tickSnap).length === 0 &&
        Object.keys(obSnap).length === 0
      ) {
        return;
      }

      setState((prev) => {
        const newTicks = { ...prev.ticks };
        const newLatest = { ...prev.latest };
        const newOrderBooks = { ...prev.orderBooks };

        // Merge tick ke sliding window
        for (const [sym, ticker] of Object.entries(tickSnap)) {
          const existing = newTicks[sym] ?? [];
          const merged = [...existing, ticker];
          newTicks[sym] =
            merged.length > MAX_POINTS ? merged.slice(-MAX_POINTS) : merged;
          newLatest[sym] = ticker;
        }

        // Update order books
        for (const [sym, ob] of Object.entries(obSnap)) {
          newOrderBooks[sym] = ob;
        }

        return {
          ...prev,
          ticks: newTicks,
          latest: newLatest,
          orderBooks: newOrderBooks,
        };
      });
    }, THROTTLE_MS);

    // ── Cleanup: cegah ghost connection pada re-mount (Strict Mode, HMR) ─
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("tick", handleTick);
      socket.off("orderBook", handleOrderBook);
      socket.disconnect();

      if (flushIntervalRef.current !== null) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
    };
  }, []);

  return state;
}
