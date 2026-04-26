import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { BinanceRelay } from './relay/BinanceRelay';

const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST'],
  })
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket'],
  pingInterval: 10_000,
  pingTimeout: 5_000,
});

// Track connection count for monitoring
let connectionCount = 0;

io.on('connection', (socket) => {
  connectionCount++;
  console.log(
    `[+] Client connected: ${socket.id}  (total: ${connectionCount})`
  );

  socket.on('disconnect', (reason) => {
    connectionCount--;
    console.log(
      `[-] Client disconnected: ${socket.id} (${reason})  (total: ${connectionCount})`
    );
  });
});

// ── Binance Relay: terima data riil, broadcast ke semua klien ──────────────
const relay = new BinanceRelay(
  // onTicker: relay setiap tick Binance ke semua frontend
  (ticker) => {
    io.emit('tick', ticker);
  },
  // onOrderBook: relay order book depth5 ke semua frontend
  (orderBook) => {
    io.emit('orderBook', orderBook);
  }
);

relay.start();

const PORT = 4000;

httpServer.listen(PORT, () => {
  console.log(`\n🚀  Relay Server  →  http://localhost:${PORT}`);
  console.log(`📡  Relaying Binance stream: BTC/USDT · ETH/USDT · BNB/USDT`);
  console.log(`📊  Events: @ticker (price) + @depth5 (order book)\n`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n⏹  Shutting down Relay Server...');
  relay.stop();
  httpServer.close(() => {
    console.log('✅  Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
