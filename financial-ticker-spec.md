# Live Financial Ticker & Order Book Specification

## 1. Tech Stack Overview
* **Frontend:** Next.js 15 (App Router), Tailwind CSS, Framer Motion (untuk animasi transisi angka), Recharts (untuk rendering grafik real-time).
* **Backend:** Hono (Node.js Adapter) / Express.js.
* **WebSocket:** Socket.io atau native ws.

## 2. UI/UX & Design System (Modern & Interactive)
* **Theme:** Dark Mode by default. Menggunakan warna latar belakang abu-abu sangat gelap (slate-900) dengan aksen warna neon.
* **Typography:** Font sans-serif yang bersih (seperti Inter atau Roboto Mono untuk angka).
* **Visual Cues:** * Angka harga harus berkedip hijau (text-green-400) saat harga naik, dan merah (text-red-400) saat harga turun.
  * Tambahkan animasi transisi yang *smooth* menggunakan Framer Motion setiap kali ada pembaruan data harga di Order Book.
* **Layout:** Grid berbasis Dashboard. Bagian kiri memuat Grafik Garis (*Line Chart*) real-time, bagian kanan memuat *Order Book* (daftar Ask dan Bid).

## 3. Core Logic (Backend Market Engine)
* Server tidak menunggu request, melainkan bertindak sebagai *Broadcaster*.
* Buat sebuah fungsi `MarketSimulator` di backend yang men-generate data harga fluktuatif untuk pasangan mata uang konvensional (gunakan *symbol* seperti: `USD/IDR`, `EUR/USD`, `GBP/JPY`) setiap 500ms.
* Data yang di-broadcast memiliki struktur JSON: `{ symbol: string, currentPrice: number, timestamp: number, type: 'UP' | 'DOWN', volume: number }`.

## 4. Frontend Handling (Data Streaming)
* Komponen Next.js menggunakan `useEffect` untuk mendengarkan event WebSocket.
* Gunakan array state (misal: membatasi maksimal 50 data point terakhir) untuk dimasukkan ke dalam komponen Recharts agar grafik bergerak menggeser secara *real-time* tanpa membuat browser lag/memory leak.