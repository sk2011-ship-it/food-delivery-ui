"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  danger?: boolean;
  accentColor?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  danger = true,
  accentColor = "#ef4444"
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={loading ? undefined : onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 text-center">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-50' : 'bg-gray-50'}`}
              >
                <AlertTriangle className={`w-8 h-8 ${danger ? 'text-red-500' : 'text-gray-400'}`} />
              </div>

              <h2 className="text-xl font-black text-gray-900 tracking-tight mb-2">
                {title}
              </h2>
              <p className="text-sm font-medium text-gray-500 leading-relaxed">
                {message}
              </p>
            </div>

            <div className="p-6 pt-0 flex flex-col gap-3">
              <button
                onClick={onConfirm}
                disabled={loading}
                className="w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  background: danger ? "linear-gradient(135deg, #ef4444, #dc2626)" : `linear-gradient(135deg, ${accentColor}, ${accentColor})`,
                }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {confirmText}
              </button>

              <button
                onClick={onClose}
                disabled={loading}
                className="w-full py-3 rounded-2xl text-gray-400 font-black text-sm uppercase tracking-widest hover:text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                {cancelText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
