import WebSocket from 'ws';

// ── Endpoint fallback list (dicoba berurutan jika timeout) ────────────────────
// Port 443 melewati sebagian besar firewall yang memblokir 9443
const ENDPOINTS = [
  'wss://stream.binance.com:443/stream?streams=btcusdt@ticker/ethusdt@ticker/bnbusdt@ticker/btcusdt@depth5/ethusdt@depth5/bnbusdt@depth5',
  'wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker/bnbusdt@ticker/btcusdt@depth5/ethusdt@depth5/bnbusdt@depth5',
  'wss://data-stream.binance.vision:443/stream?streams=btcusdt@ticker/ethusdt@ticker/bnbusdt@ticker/btcusdt@depth5/ethusdt@depth5/bnbusdt@depth5',
];

// ── Symbol mapping ──────────────────────────────────────────────────────────
const SYMBOL_MAP: Record<string, string> = {
  BTCUSDT: 'BTC/USDT',
  ETHUSDT: 'ETH/USDT',
  BNBUSDT: 'BNB/USDT',
};

// ── Public interfaces (di-relay ke frontend) ─────────────────────────────────
export interface BinanceTicker {
  symbol: string;       // "BTC/USDT"
  price: number;        // harga terkini
  volume: number;       // volume 24h (dalam quote asset USDT)
  change24h: number;    // perubahan harga 24h dalam persen
  direction: 'UP' | 'DOWN';
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

// ── Internal Binance raw shapes ───────────────────────────────────────────────
interface RawTickerStream {
  stream: string;
  data: {
    e: '24hrTicker';
    s: string;   // "BTCUSDT"
    c: string;   // close price
    v: string;   // volume (base asset)
    q: string;   // quote volume (USDT)
    P: string;   // price change percent
    o: string;   // open price
  };
}

interface RawDepthStream {
  stream: string;
  data: {
    lastUpdateId: number;
    bids: [string, string][];
    asks: [string, string][];
  };
}

// ── Callback types ────────────────────────────────────────────────────────────
type OnTickerCallback = (ticker: BinanceTicker) => void;
type OnOrderBookCallback = (orderBook: OrderBookData) => void;

// ── BinanceRelay class ────────────────────────────────────────────────────────
export class BinanceRelay {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000; // ms, doubles on each failure
  private readonly MAX_RECONNECT_DELAY = 30_000;
  private stopped = false;
  private endpointIndex = 0; // rotasi endpoint saat reconnect

  // Per-simbol: simpan harga sebelumnya untuk menentukan direction
  private prevPrices: Record<string, number> = {};

  constructor(
    private readonly onTicker: OnTickerCallback,
    private readonly onOrderBook: OnOrderBookCallback
  ) {}

  start(): void {
    this.stopped = false;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.terminate();
      this.ws = null;
    }
    console.log('🔌  BinanceRelay stopped.');
  }

  // ── Internal: buka koneksi WebSocket ke Binance ───────────────────────────
  private connect(): void {
    const url = ENDPOINTS[this.endpointIndex % ENDPOINTS.length];
    const shortUrl = url.split('?')[0]; // log singkat tanpa query string
    console.log(`🔗  Connecting to Binance stream... [${shortUrl}]`);
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.on('open', () => {
      console.log('✅  Connected to Binance WebSocket stream');
      this.reconnectDelay = 1000; // reset backoff setelah sukses
    });

    ws.on('message', (raw: Buffer) => {
      try {
        this.handleMessage(JSON.parse(raw.toString()));
      } catch {
        // abaikan pesan malformed
      }
    });

    ws.on('error', (err) => {
      console.error(`⚠️  Binance WS error: ${err.message}`);
    });

    ws.on('close', (code, reason) => {
      if (this.stopped) return;
      console.warn(
        `⚡  Binance WS closed (${code}: ${reason}). Reconnecting in ${this.reconnectDelay}ms...`
      );
      this.scheduleReconnect();
    });
  }

  // ── Internal: eksponensial backoff reconnect dengan rotasi endpoint ────────
  private scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => {
      if (!this.stopped) {
        this.endpointIndex++; // coba endpoint berikutnya
        this.reconnectDelay = Math.min(
          this.reconnectDelay * 1.5,
          this.MAX_RECONNECT_DELAY
        );
        this.connect();
      }
    }, this.reconnectDelay);
  }

  // ── Internal: routing pesan berdasarkan stream name ───────────────────────
  private handleMessage(msg: RawTickerStream | RawDepthStream): void {
    const streamName: string = (msg as { stream: string }).stream ?? '';

    if (streamName.endsWith('@ticker')) {
      this.handleTicker(msg as RawTickerStream);
    } else if (streamName.endsWith('@depth5')) {
      this.handleDepth(msg as RawDepthStream, streamName);
    }
  }

  // ── Internal: parse data ticker ──────────────────────────────────────────
  private handleTicker(msg: RawTickerStream): void {
    const raw = msg.data;
    const symbol = SYMBOL_MAP[raw.s];
    if (!symbol) return;

    const price = parseFloat(raw.c);
    const prev = this.prevPrices[symbol];
    const direction: 'UP' | 'DOWN' = prev !== undefined && price < prev ? 'DOWN' : 'UP';
    this.prevPrices[symbol] = price;

    const ticker: BinanceTicker = {
      symbol,
      price,
      volume: parseFloat(raw.q),   // quote volume (USDT) — lebih informatif
      change24h: parseFloat(raw.P),
      direction,
      timestamp: Date.now(),
    };

    this.onTicker(ticker);
  }

  // ── Internal: parse data order book depth5 ───────────────────────────────
  private handleDepth(msg: RawDepthStream, streamName: string): void {
    // Extract simbol dari stream name: "btcusdt@depth5" → "BTCUSDT"
    const rawSym = streamName.replace('@depth5', '').toUpperCase();
    const symbol = SYMBOL_MAP[rawSym];
    if (!symbol) return;

    const orderBook: OrderBookData = {
      symbol,
      bids: msg.data.bids.map(([p, q]) => ({
        price: parseFloat(p),
        qty: parseFloat(q),
      })),
      asks: msg.data.asks.map(([p, q]) => ({
        price: parseFloat(p),
        qty: parseFloat(q),
      })),
    };

    this.onOrderBook(orderBook);
  }
}
