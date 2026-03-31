"use client";

import { useEffect, useState, Suspense } from "react";
import { useCart } from "@/components/CartContext";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function SuccessContent() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    if (!cleared) {
      clearCart();
      setCleared(true);
    }
  }, [clearCart, cleared]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-8 text-center">
      <div className="w-32 h-32 bg-green-50 rounded-[3rem] flex items-center justify-center mb-10 shadow-inner animate-bounce-slow">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
      </div>
      
      <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter">
        Payment <span className="text-green-500">Successful!</span>
      </h1>
      
      <p className="text-xl text-slate-500 font-bold max-w-lg mb-10 leading-relaxed italic">
        "One cannot think well, love well, sleep well, if one has not dined well." - Your food is on its way!
      </p>

      {orderId && (
        <div className="mb-10 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 inline-block">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Order Reference</p>
          <p className="text-lg font-black text-slate-900 tracking-tight">#{orderId.slice(0, 8)}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-6">
        <Link href="/restaurants">
          <Button className="bg-slate-900 hover:bg-slate-800 h-16 px-10 text-lg font-black rounded-[2rem] shadow-xl transition-all active:scale-95 group">
            Order More <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" className="h-16 px-10 text-lg font-black rounded-[2rem] border-slate-200 hover:bg-slate-50 transition-all active:scale-95">
             Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
