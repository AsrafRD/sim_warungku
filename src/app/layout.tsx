import type { Metadata } from "next";
import "./globals.css";
import NextTopLoader from 'nextjs-toploader';

export const metadata: Metadata = {
  title: {
    template: "%s | Warung SaaS",
    default: "Warung SaaS — Sistem Informasi & POS",
  },
  description:
    "Sistem Informasi dan Point of Sale (POS) untuk Warung. Multi-tenant, mobile-first, dengan fitur stok opname dan Bluetooth thermal printing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextTopLoader 
          color="#4f46e5" 
          showSpinner={false} 
          height={3}
          shadow="0 0 10px #4f46e5,0 0 5px #4f46e5"
        />
        {children}
      </body>
    </html>
  );
}
