import type { Metadata } from "next";
import "./globals.css";
import NextTopLoader from 'nextjs-toploader';
import { NetworkProvider } from "@/components/providers/network-provider";

export const metadata: Metadata = {
  title: {
    template: "%s | Warung SaaS",
    default: "Warung SaaS — Sistem Informasi & POS",
  },
  description:
    "Sistem Informasi dan Point of Sale (POS) untuk Warung. Multi-tenant, mobile-first, dengan fitur stok opname dan Bluetooth thermal printing.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextTopLoader 
          color="#d87840ff" 
          showSpinner={false} 
          height={5}
          shadow="0 0 10px #e91f04ff,0 0 5px #9c1700ff"
        />
        <NetworkProvider>
          {children}
        </NetworkProvider>
      </body>
    </html>
  );
}
