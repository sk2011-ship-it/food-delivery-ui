"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";

function CancelContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const router = useRouter();

  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    if (!orderId) {
      router.push("/dashboard/customer/orders");
      return;
    }

    try {
      setIsRetrying(true);
      const session = useAuthStore.getState().session;
      const res = await fetch(`/api/orders/${orderId}/stripe/session`, {
        method: "POST",
        headers: {
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
        },
      });
      const data = await res.json();
      const sessionUrl = data.url || data.data?.url;

      if (sessionUrl) {
        window.location.href = sessionUrl;
      } else {
        router.push(`/dashboard/customer/status/${orderId}`);
      }
    } catch (err) {
      router.push(`/dashboard/customer/status/${orderId}`);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 200 }}
        className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center mb-8 border-2 border-red-100"
      >
        <AlertCircle className="w-12 h-12 text-red-400" />
      </motion.div>

      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-black text-gray-900 tracking-tight mb-4 uppercase"
      >
        Payment Cancelled
      </motion.h1>

      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm font-medium text-gray-400 max-w-sm leading-relaxed mb-10"
      >
        The payment session was cancelled. Don't worry, your order is still in the 'CONFIRMED' state. You can try again whenever you're ready.
      </motion.p>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
      >
        <button 
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex-1 bg-gray-900 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl disabled:opacity-50"
        >
          {isRetrying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Try Again
        </button>
        
        <Link 
          href="/dashboard/customer/orders"
          className="flex-1 bg-gray-100 text-gray-400 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 hover:text-gray-600 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </motion.div>

      <div className="mt-12 p-8 bg-gray-50/50 rounded-[2rem] border border-gray-100 max-w-sm">
         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Need help?</p>
         <p className="text-xs font-medium text-gray-500 leading-relaxed">
            If you're having trouble with the payment, please contact our support team or check your network connection.
         </p>
      </div>
    </div>
  );
}

export default function CancelPage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen flex items-center justify-center font-black text-xs uppercase tracking-widest text-gray-300">
         Loading...
       </div>
    }>
      <CancelContent />
    </Suspense>
  );
}
