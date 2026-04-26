"use client";

import { AnimatePresence, motion } from "framer-motion";

// ── Formatting helpers ─────────────────────────────────────────────────────
export function formatCryptoPrice(symbol: string, price: number): string {
  if (symbol.startsWith("BTC")) {
    // BTC biasanya $60k-$100k → 2 desimal
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (symbol.startsWith("BNB")) {
    // BNB $300-$700 → 2 desimal
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  // ETH dan lainnya → 2 desimal
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ── Easing kurva: ease-out cubic (terasa natural) ─────────────────────────
const EASE_OUT_CUBIC: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ── Size presets ───────────────────────────────────────────────────────────
const SIZE_MAP = {
  xs: { fontSize: "12px", lineHeight: "18px", shiftY: 10 },
  sm: { fontSize: "13px", lineHeight: "20px", shiftY: 12 },
  md: { fontSize: "22px", lineHeight: "28px", shiftY: 16 },
  lg: { fontSize: "28px", lineHeight: "36px", shiftY: 20 },
  xl: { fontSize: "36px", lineHeight: "44px", shiftY: 24 },
};

interface AnimatedPriceProps {
  price: number | undefined;
  symbol: string;
  direction: "UP" | "DOWN" | null;
  size?: keyof typeof SIZE_MAP;
  /** Override warna teks. Default: hijau/merah sesuai direction */
  colorOverride?: string;
  fontWeight?: number;
  fontFamily?: string;
}

/**
 * AnimatedPrice — Komponen atom untuk harga dengan animasi odometer.
 *
 * Prinsip utama:
 * - `key={formatted}` berubah setiap harga baru → React unmount lama, mount baru
 * - AnimatePresence `mode="popLayout"` menjalankan exit + enter bersamaan
 * - Direction "UP"  → lama bergeser ke atas + fade, baru datang dari bawah
 * - Direction "DOWN" → kebalikannya
 * - Warna teks berubah via CSS transition-colors (300ms, tidak berkedip)
 */
export function AnimatedPrice({
  price,
  symbol,
  direction,
  size = "md",
  colorOverride,
  fontWeight = 700,
  fontFamily = "var(--font-mono)",
}: AnimatedPriceProps) {
  const { fontSize, lineHeight, shiftY } = SIZE_MAP[size];

  // Warna teks berdasarkan direction
  const color =
    colorOverride ??
    (direction === "UP"
      ? "var(--color-up)"
      : direction === "DOWN"
      ? "var(--color-down)"
      : "var(--color-text-muted)");

  if (price === undefined || price === null) {
    return (
      <span
        style={{
          fontSize,
          lineHeight,
          fontWeight,
          fontFamily,
          color: "var(--color-text-muted)",
        }}
      >
        —
      </span>
    );
  }

  const formatted = formatCryptoPrice(symbol, price);

  // Arah gerak animasi:
  // UP   → angka lama exit ke atas (y: -shiftY), baru masuk dari bawah (initial y: +shiftY)
  // DOWN → angka lama exit ke bawah (y: +shiftY), baru masuk dari atas (initial y: -shiftY)
  const enterY = direction === "UP" ? shiftY : -shiftY;
  const exitY = direction === "UP" ? -shiftY : shiftY;

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        overflow: "hidden",
        // Height harus tetap agar layout tidak loncat saat animasi
        height: lineHeight,
        verticalAlign: "bottom",
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={formatted}
          initial={{ y: enterY, opacity: 0, filter: "blur(3px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: exitY, opacity: 0, filter: "blur(3px)" }}
          transition={{ duration: 0.22, ease: EASE_OUT_CUBIC }}
          style={{
            display: "block",
            fontSize,
            lineHeight,
            fontWeight,
            fontFamily,
            color,
            // Transisi warna yang lembut (tidak berkedip)
            transition: "color 300ms ease",
            whiteSpace: "nowrap",
          }}
        >
          {formatted}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
