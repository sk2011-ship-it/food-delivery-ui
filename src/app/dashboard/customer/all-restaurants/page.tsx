"use client";

import { useState, Suspense } from "react";
import { useSite } from "@/context/SiteContext";
import { useRestaurants } from "@/hooks/useRestaurants";
import RestaurantCard from "@/components/dashboard/customer/RestaurantCard";
import { RestaurantCardSkeleton } from "@/components/ui/Skeleton";
import { Sparkles, Utensils, Search, ChevronLeft, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * AllRestaurantsPage.tsx - Premium restaurant listing experience with staggered animations
 * and performant filtering using the useRestaurants hook.
 */

export default function AllRestaurantsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AllRestaurantsContent />
    </Suspense>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-[var(--dash-bg)] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <RestaurantCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}

function AllRestaurantsContent() {
  const { site } = useSite();
  const searchParams = useSearchParams();
  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");
  
  // Custom hook for unified data management
  const { featured, normal, isLoading, error, refresh } = useRestaurants(localSearch);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[var(--dash-bg)] pb-20 selection:bg-primary/20 selection:text-primary">
      {/* Premium Header */}
      <div className="glass-premium sticky top-16 z-30 !border-none !shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/customer"
              className="p-2.5 bg-white/50 hover:bg-white hover:shadow-soft rounded-full transition-all duration-300 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Explore Cuisines</h1>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{site.location}'s Finest</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-6 flex flex-col items-center text-center gap-4">
            <p className="text-red-900 font-bold">{error}</p>
            <button 
              onClick={refresh} 
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-200 rounded-full text-xs font-black uppercase text-red-600 shadow-soft hover:shadow-elevated transition-all"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        )}

        {/* Featured Section */}
        {(isLoading || featured.length > 0) && (
          <section>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2.5 mb-8"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
              </div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Handpicked Favourites</h2>
            </motion.div>
            
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <RestaurantCardSkeleton key={i} />)
              ) : (
                featured.map((r, i) => (
                  <motion.div variants={itemVariants} key={r.id}>
                    <RestaurantCard restaurant={r} theme={site.theme} featured={true} />
                  </motion.div>
                ))
              )}
            </motion.div>
          </section>
        )}

        {/* Normal Section */}
        <section>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Utensils className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Authentic Local Eats</h2>
            </div>
            {!isLoading && (
              <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 px-4 py-1.5 rounded-full border border-border/40">
                {normal.length} Places Found
              </span>
            )}
          </motion.div>

          {normal.length > 0 ? (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {normal.map((r) => (
                <motion.div variants={itemVariants} key={r.id}>
                  <RestaurantCard restaurant={r} theme={site.theme} />
                </motion.div>
              ))}
            </motion.div>
          ) : !isLoading && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24 bg-white/40 glass-premium rounded-[3rem] border border-dashed border-border/60"
            >
               <div className="w-24 h-24 rounded-[2.5rem] bg-muted/20 flex items-center justify-center mx-auto mb-8 shadow-inset">
                 <Search className="w-10 h-10 text-muted-foreground/40" />
               </div>
               <h3 className="text-gray-900 font-black text-3xl tracking-tighter">No Culinary Matches</h3>
               <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto leading-relaxed font-medium">
                We couldn't find any results for "{localSearch}". Maybe try exploring different categories or cuisines?
               </p>
               <button 
                 onClick={() => setLocalSearch("")}
                 className="mt-10 text-xs font-black uppercase tracking-widest transition-all px-10 py-4 rounded-full bg-white border border-border/40 shadow-soft hover:shadow-elevated active:scale-95 text-primary"
               >
                 Clear Search Filter
               </button>
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
}
