import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "StockVista",
  description: "Multi-market stock performance analysis for BSE, NSE, and NASDAQ."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
