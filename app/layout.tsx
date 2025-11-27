import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Holiday Postcard Share Proxy",
  description: "Proxy service for sharing holiday postcards",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
