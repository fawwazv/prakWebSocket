# High-Frequency Crypto Ticker & Order Book Specification

## 1. Tech Stack Overview
* **Frontend:** Next.js 15 (App Router), Tailwind CSS, Framer Motion (untuk animasi angka yang mulus), Recharts (untuk grafik).
* **Backend:** Hono (Node.js Adapter) / Express.js.
* **WebSocket:** `ws` (native untuk koneksi ke Binance) dan `socket.io` (untuk relay ke Next.js).

## 2. Core Logic (Backend Relay Server)
* Hapus `Math.random()`. Gunakan library `ws` untuk terhubung ke Binance WebSocket API: `wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker/bnbusdt@ticker`.
* Parsing data JSON dari Binance. Ambil data harga terbaru (`c`), volume (`v`), dan simbol (`s`).
* Format ulang simbol dari `BTCUSDT` menjadi `BTC/USDT`.
* Relay (broadcast) data tersebut ke frontend Next.js menggunakan `socket.io` setiap kali data masuk. Tangani auto-reconnect jika koneksi ke Binance terputus.

## 3. Frontend Optimization (Anti-Lag & Throttling)
* Data dari Binance bisa datang 20x per detik. **JANGAN** langsung memasukkan setiap pesan WebSocket ke dalam React `useState`.
* Implementasikan mekanisme `Throttle` (misalnya menggunakan `lodash.throttle` atau custom hook `useRef`). Tumpuk (buffer) data yang masuk, dan perbarui `useState` React secara batch hanya setiap 250ms (4 FPS) agar browser tidak lag/memory leak.
* Untuk grafik Recharts, pastikan panjang array state dibatasi (misal max 50 titik) dengan metode `array.slice()`.

## 4. UI/UX & Smooth Animation (Anti-Jengat)
* **Wajib Mulus:** Perubahan angka harga tidak boleh patah-patah. Gunakan `AnimatePresence` dari Framer Motion. Saat harga berubah, animasikan angka lama bergeser ke atas/bawah dan memudar, digantikan angka baru yang masuk secara mulus.
* **Visual Cues:** Gunakan transisi CSS (`transition-colors duration-300`) agar perubahan warna teks (hijau saat naik, merah saat turun) membaur dengan lembut, tidak berkedip kasar.
* **Theme:** Dark Mode by default. Gunakan warna latar belakang gelap (slate-900) dan aksen neon (misalnya cyan atau emerald) untuk indikator harga naik/turun dan border Order Book.