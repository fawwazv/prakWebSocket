import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiveTicker — Real-Time Financial Markets",
  description:
    "Live streaming financial dashboard with real-time WebSocket price feed, order book, and interactive charts for USD/IDR, EUR/USD, and GBP/JPY currency pairs.",
  keywords: ["financial ticker", "forex", "real-time", "order book", "websocket"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="theme-color" content="#020617" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
