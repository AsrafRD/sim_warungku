import { ReactNode } from "react";
import { Store } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-50 p-4">
      <div className="flex items-center gap-2 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shadow-sm">
          <Store className="size-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">
          Warung SaaS
        </span>
      </div>
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-both">
        {children}
      </div>
    </div>
  );
}
