"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Filter, ArrowRight, MessageSquare, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";
import ReviewCard from "./ReviewCard";
import Link from "next/link";
import { formatReviewCount } from "@/lib/utils/reviewUtils";
import type { Review } from "@/types/api.types";

interface ReviewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  reviews: Review[];
  restaurantName: string;
}

export default function ReviewSheet({ isOpen, onClose, reviews, restaurantName }: ReviewSheetProps) {
  const [sortBy, setSortBy] = useState<"latest" | "highest">("latest");
  const [selectedStars, setSelectedStars] = useState<number | null>(null);

  const breakdown = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        counts[5 - r.rating]++;
      }
    });
    return counts;
  }, [reviews]);

  const filteredAndSortedReviews = useMemo(() => {
    let result = [...reviews];
    
    // 1. Filter by stars if selected
    if (selectedStars !== null) {
      result = result.filter(r => Math.floor(r.rating) === selectedStars);
    }

    // 2. Sort
    result.sort((a, b) => {
      if (sortBy === "latest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return b.rating - a.rating;
    });

    // 3. Limit to 10
    return result.slice(0, 10);
  }, [reviews, sortBy, selectedStars]);

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden border-l border-gray-100"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white sticky top-0 z-20">
              <div>
                <div className="flex items-center gap-3 mb-1">
                   <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-100">
                     <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                   </div>
                   <h2 className="text-lg font-black text-gray-900 tracking-tight">Reviews</h2>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-heading">
                  Verified feedback for {restaurantName}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-2.5 rounded-full bg-gray-50 border border-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
              {/* Summary Stats Card */}
              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <p className="text-4xl font-black text-gray-900 tracking-tighter">{avgRating}</p>
                    <div>
                      <div className="flex gap-0.5 mb-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              className={cn(
                                "w-3 h-3", 
                                parseFloat(avgRating) >= s ? "fill-amber-400 text-amber-400" : "text-gray-200"
                              )} 
                            />
                          ))}
                      </div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest font-sans">
                          From {formatReviewCount(reviews.length)} customers
                      </p>
                    </div>
                  </div>
                  {selectedStars !== null && (
                    <button 
                      onClick={() => setSelectedStars(null)}
                      className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {breakdown.map((count, i) => {
                    const stars = 5 - i;
                    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    const isSelected = selectedStars === stars;
                    
                    return (
                      <button 
                        key={stars} 
                        onClick={() => setSelectedStars(isSelected ? null : stars)}
                        className={cn(
                          "w-full flex items-center gap-3 transition-all hover:translate-x-1 group",
                          isSelected ? "opacity-100" : selectedStars === null ? "opacity-100" : "opacity-40"
                        )}
                      >
                        <span className={cn("text-[9px] font-black w-3", isSelected ? "text-amber-600" : "text-gray-400")}>
                          {stars}
                        </span>
                        <div className={cn(
                          "flex-1 h-1.5 rounded-full overflow-hidden border shadow-inner transition-colors",
                          isSelected ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"
                        )}>
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className={cn("h-full rounded-full transition-colors", isSelected ? "bg-amber-500" : "bg-amber-400")}
                          />
                        </div>
                        <span className={cn("text-[9px] font-black w-8 text-right", isSelected ? "text-amber-600" : "text-gray-400")}>
                          {Math.round(percentage)}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sorting Bar */}
              <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md py-3 z-10 border-b border-gray-50 -mx-5 px-5">
                <div className="flex items-center gap-2">
                  <Filter className="w-3 h-3 text-gray-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                    {selectedStars ? `${selectedStars} Star Reviews` : "Sort Reviews"}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {[
                    { id: "latest", label: "Newest" },
                    { id: "highest", label: "Top" }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setSortBy(btn.id as any)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border",
                        sortBy === btn.id 
                          ? "bg-gray-900 text-white border-gray-900 shadow-md shadow-gray-400/20" 
                          : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                      )}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-3.5 pb-20">
                {filteredAndSortedReviews.length === 0 ? (
                  <div className="py-16 text-center">
                    <MessageSquare className="w-10 h-10 text-gray-100 mx-auto mb-3" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                      {selectedStars ? `No ${selectedStars} star reviews found` : "No reviews found"}
                    </p>
                  </div>
                ) : (
                  <>
                    {filteredAndSortedReviews.map((r) => (
                      <ReviewCard key={r.id} review={r} />
                    ))}
                    {reviews.length > 10 && !selectedStars && filteredAndSortedReviews.length === 10 && (
                      <p className="text-[9px] text-center text-gray-400 font-bold uppercase tracking-widest py-4">
                        Showing 10 most recent reviews
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Fixed Footer CTA */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pt-3 bg-gradient-to-t from-white via-white to-white/0 border-t border-gray-50 flex items-center justify-center pointer-events-none">
               <Link
                href="/dashboard/customer/orders"
                className="w-full h-14 rounded-2xl bg-gray-900 flex items-center justify-center gap-3 text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gray-900/20 pointer-events-auto"
               >
                 Rate your order
                 <ArrowRight className="w-4 h-4" />
               </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
