import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { MarketSimulator } from './market/MarketSimulator';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  })
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
  // Tune transport for performance
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

// Single MarketSimulator instance — one interval for all symbols
const simulator = new MarketSimulator();

simulator.start((tick, orderBook) => {
  // Broadcast to all connected clients
  io.emit('tick', tick);
  io.emit('orderBook', orderBook);
});

const PORT = 4000;

httpServer.listen(PORT, () => {
  console.log(`\n🚀  Market Engine  →  http://localhost:${PORT}`);
  console.log(`📡  WebSocket broadcasting every 500ms`);
  console.log(`📊  Symbols: USD/IDR · EUR/USD · GBP/JPY\n`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n⏹  Shutting down Market Engine...');
  simulator.stop();
  httpServer.close(() => {
    console.log('✅  Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
