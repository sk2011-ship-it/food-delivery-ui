"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, X, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Order } from "@/types/api.types";
import type { SiteConfig } from "@/config/sites";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  site: SiteConfig;
  onSuccess: () => void;
}

export default function FeedbackModal({ isOpen, onClose, order, site, onSuccess }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charLimit = 500;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/customer/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          rating,
          comment,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Review submitted successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Failed to submit review");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden"
          >
            {/* Header / Graphic */}
            <div 
              className="p-8 text-center bg-gray-50/50 border-b border-gray-100 relative"
            >
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-gray-600 shadow-sm transition-all focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-blue-500" />
              </div>
              
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Rate your experience</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                Order #{order.id?.slice(0, 8)} • {order.restaurant?.name}
              </p>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Stars Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center block">
                  How was the food & service?
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform active:scale-90 focus:outline-none"
                    >
                      <Star
                        className={cn(
                          "w-10 h-10 transition-all duration-200 cursor-pointer",
                          (hoveredRating || rating) >= star
                            ? "fill-amber-400 text-amber-400 drop-shadow-sm scale-110"
                            : "text-gray-200"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Textarea */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Your Feedback (Optional)
                  </label>
                  <span className={cn(
                    "text-[10px] font-bold tracking-widest",
                    comment.length > charLimit ? "text-red-500" : "text-gray-300"
                  )}>
                    {comment.length}/{charLimit}
                  </span>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you liked or how we can improve..."
                  className="w-full h-32 px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all resize-none placeholder:text-gray-300"
                />
              </div>

              {/* Action Button */}
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting || comment.length > charLimit}
                className="w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
                style={{ 
                  background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})` 
                }}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </button>
              
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center leading-relaxed">
                By submitting, you agree to our community guidelines.<br/>
                All reviews are moderated for safety.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
