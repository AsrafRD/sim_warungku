import { WifiOff, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function OfflineFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
        <WifiOff className="w-12 h-12" />
      </div>
      <h1 className="text-2xl font-black text-slate-800 mb-2">Anda Sedang Offline</h1>
      <p className="text-slate-500 mb-8 max-w-sm">
        Koneksi internet Anda terputus. Beberapa fitur aplikasi mungkin tidak dapat digunakan sampai koneksi pulih.
      </p>
      
      <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl flex items-start gap-3 max-w-md text-left mb-8">
        <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-orange-600" />
        <p className="text-sm">
          <strong>Perhatian:</strong> Karena ini adalah aplikasi cloud, transaksi POS membutuhkan internet untuk menyimpan data ke server pusat.
        </p>
      </div>

      <Link 
        href="/"
        className="bg-[#FF8F00] hover:bg-[#e68100] text-white font-bold py-3 px-8 rounded-xl transition-colors"
      >
        Coba Muat Ulang Halaman
      </Link>
    </div>
  );
}
