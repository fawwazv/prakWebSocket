export interface Tick {
  symbol: string;
  currentPrice: number;
  timestamp: number;
  type: 'UP' | 'DOWN';
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

const INITIAL_PRICES: Record<string, number> = {
  'USD/IDR': 16350.00,
  'EUR/USD': 1.08420,
  'GBP/JPY': 191.450,
};

type OnTickCallback = (tick: Tick, orderBook: OrderBookData) => void;

export class MarketSimulator {
  private prices: Map<string, number> = new Map();
  private interval: NodeJS.Timeout | null = null;

  constructor() {
    for (const [symbol, price] of Object.entries(INITIAL_PRICES)) {
      this.prices.set(symbol, price);
    }
  }

  start(onTick: OnTickCallback): void {
    if (this.interval) return; // prevent double-start

    this.interval = setInterval(() => {
      for (const symbol of this.prices.keys()) {
        const prevPrice = this.prices.get(symbol)!;

        // Random walk: ±0.15% fluctuation
        const bps = (Math.random() * 3 - 1.5) / 1000;
        const rawNext = prevPrice * (1 + bps);

        const decimals = symbol.includes('IDR') ? 2 : 5;
        const newPrice = parseFloat(rawNext.toFixed(decimals));

        this.prices.set(symbol, newPrice);

        const tick: Tick = {
          symbol,
          currentPrice: newPrice,
          timestamp: Date.now(),
          type: newPrice >= prevPrice ? 'UP' : 'DOWN',
          volume: Math.floor(Math.random() * 900_000) + 100_000,
        };

        const orderBook = this.generateOrderBook(symbol, newPrice, decimals);
        onTick(tick, orderBook);
      }
    }, 500);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private generateOrderBook(
    symbol: string,
    midPrice: number,
    decimals: number
  ): OrderBookData {
    // Spread = 0.01% of price
    const tickSize = midPrice * 0.0001;

    const asks: OrderLevel[] = Array.from({ length: 5 }, (_, i) => ({
      price: parseFloat((midPrice + tickSize * (i + 1)).toFixed(decimals)),
      qty: Math.floor(Math.random() * 80_000) + 10_000,
    }));

    const bids: OrderLevel[] = Array.from({ length: 5 }, (_, i) => ({
      price: parseFloat((midPrice - tickSize * (i + 1)).toFixed(decimals)),
      qty: Math.floor(Math.random() * 80_000) + 10_000,
    }));

    return { symbol, asks, bids };
  }
}
