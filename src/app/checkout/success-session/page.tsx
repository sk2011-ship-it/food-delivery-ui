"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, ShoppingBag, Receipt, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";

function SuccessSessionContent() {
  const searchParams = useSearchParams();
  const orderSessionId = searchParams.get("order_session_id");
  const router = useRouter();

  const [verifying, setVerifying] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { session, isReady } = useAuthStore();

  useEffect(() => {
    // Only verify if the auth store is ready
    if (!isReady) return;

    const verifyPayment = async () => {
      const sessionId = searchParams.get("session_id");
      if (!orderSessionId || !sessionId) {
        setVerifying(false);
        return;
      }

      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const res = await fetch(`/api/orders/session/${orderSessionId}/stripe/verify`, {
          method: "POST",
          headers,
          body: JSON.stringify({ sessionId }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || data.message || "Failed to verify payment");
        }
      } catch (err) {
        setError("Network error during verification");
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [orderSessionId, searchParams, isReady, session]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-16 h-16 border-4 border-gray-100 border-t-emerald-500 rounded-full animate-spin shadow-lg" />
        <h1 className="text-xl font-heading font-black text-gray-900 tracking-tight uppercase">Confirming Payment</h1>
        <p className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest leading-none">Please hold on a moment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 font-sans overflow-hidden py-12 relative">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/50 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100/40 rounded-full blur-3xl" />

      {/* Main Success Card */}
      <motion.div 
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 p-8 relative z-10 border border-gray-100 flex flex-col items-center"
      >
        {/* Animated Checkmark Circle */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            delay: 0.1
          }}
          className="relative w-24 h-24 mb-6"
        >
          {error ? (
            <div className="absolute inset-0 bg-red-100 rounded-full flex items-center justify-center shadow-xl shadow-red-100">
               <span className="text-red-500 text-3xl font-black">!</span>
            </div>
          ) : (
            <>
              {/* Outer ripples */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 bg-emerald-400 rounded-full"
              />
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
                className="absolute inset-0 bg-emerald-400 rounded-full"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-emerald-400 rounded-full flex items-center justify-center shadow-xl shadow-emerald-200">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <Check strokeWidth={4} className="w-10 h-10 text-white" />
                </motion.div>
              </div>
            </>
          )}
        </motion.div>

        {/* Text Content */}
        <div className="text-center space-y-2 mb-8 w-full">
          <motion.h1 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-heading font-black text-gray-900 tracking-tight"
          >
            {error ? "Verification Issue" : "Payment Successful!"}
          </motion.h1>
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm font-medium text-gray-500 leading-relaxed px-4"
          >
            {error 
              ? `There was an issue verifying your payment: ${error}. Your group order might still be processing.`
              : "Your multi-restaurant order is confirmed. The sub-orders are now being prepared."}
          </motion.p>
        </div>

        {/* Divider / Mini Receipt Area */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full bg-gray-50 rounded-2xl p-4 mb-8 border border-gray-100 border-dashed"
        >
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-500 font-medium">
              <Receipt className="w-4 h-4 text-gray-400" />
              <span className="text-xs uppercase font-bold tracking-widest">Session ID</span>
            </div>
            <span className="font-mono font-bold text-gray-900 text-xs bg-white px-2 py-1 rounded-md border border-gray-200 shadow-sm">
              #{orderSessionId?.slice(0, 8).toUpperCase() || "NEW-SESSION"}
            </span>
          </div>
        </motion.div>

        {/* Call to Actions */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col gap-3 w-full"
        >
          <Link 
            href="/dashboard/customer/orders"
            className="group relative w-full bg-gray-900 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-gray-900/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <LayoutDashboard className="w-4 h-4 text-emerald-400" /> View Sub-Orders
          </Link>
          
          <Link 
            href="/dashboard/customer"
            className="w-full bg-white text-gray-600 border-2 border-gray-100 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:border-gray-200 hover:bg-gray-50 transition-all active:scale-[0.98]"
          >
            <ShoppingBag className="w-4 h-4 text-gray-400" /> Back Home
          </Link>
        </motion.div>
      </motion.div>
      
      {/* Footer Text */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]"
      >
        A confirmation receipt has been emailed.
      </motion.p>
    </div>
  );
}

export default function SuccessSessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        <span className="font-sans font-bold text-[10px] uppercase tracking-widest text-gray-400">Loading Session...</span>
      </div>
    }>
      <SuccessSessionContent />
    </Suspense>
  );
}
