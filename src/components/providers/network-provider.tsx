"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true
  );
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {

    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <>
      {children}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] bg-red-600 text-white p-3 flex items-center justify-center gap-2 shadow-lg"
          >
            <WifiOff className="size-5" />
            <span className="font-semibold text-sm">Anda sedang offline. Menunggu jaringan...</span>
          </motion.div>
        )}
        {showRestored && isOnline && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] bg-emerald-600 text-white px-4 py-2 rounded-full flex items-center justify-center gap-2 shadow-lg"
          >
            <Wifi className="size-4" />
            <span className="font-semibold text-sm">Koneksi internet pulih</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
