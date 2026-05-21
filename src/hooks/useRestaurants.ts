import { useState, useEffect, useCallback, useMemo } from "react";
import { useConfigStore } from "@/store/useConfigStore";
import { customerService } from "@/services/customer.service";
import type { RestaurantItem, FeaturedItem, OpeningHours } from "@/types/api.types";
import { isRestaurantOpen } from "@/lib/utils/restaurantUtils";
import { isSameLocation } from "@/lib/locations";
import { createClient } from "@/lib/supabase/client";

/**
 * useRestaurants.ts - Unified hook for fetching and managing restaurant data.
 * Leverages the service layer and site config for robust performance.
 */

export function useRestaurants(searchQuery: string = "") {
  const { site } = useConfigStore();
  const [featured, setFeatured] = useState<FeaturedItem[]>([]);
  const [normal, setNormal] = useState<RestaurantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [featRes, normRes] = await Promise.all([
        customerService.getFeatured({ 
          location: site.location, 
          type: "restaurant" 
        }),
        customerService.getRestaurants({ location: site.location })
      ]);
      
      if (featRes.success && featRes.data) {
        setFeatured(featRes.data.items);
      }
      
      if (normRes.success && normRes.data) {
        setNormal(normRes.data.items);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [site.location]);

  useEffect(() => {
    fetchRestaurants();
    // Fallback poll every 30s for time-based transitions (e.g. closes at 10pm by schedule)
    const interval = setInterval(fetchRestaurants, 30_000);
    return () => clearInterval(interval);
  }, [fetchRestaurants]);

  // Supabase Realtime: re-fetch instantly when any restaurant in this location updates.
  // Fires within ~1s of the owner saving opening hours — no poll delay.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("restaurants-location-watch")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "restaurants" },
        () => {
          // Re-fetch all restaurants so open/closed badges update immediately
          fetchRestaurants();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchRestaurants]);

  // Filtering Logic - Show all restaurants in location, even if closed (UI handles status)
  const filteredFeatured = useMemo(() => {
    const base = featured.filter(
      (r) => isSameLocation(r.location, site.location)
    );
    if (!searchQuery) return base;
    return base.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [featured, searchQuery, site.location]);

  const filteredNormal = useMemo(() => {
    const base = normal.filter(
      (r) => isSameLocation(r.location, site.location)
    );
    if (!searchQuery) return base;
    const query = searchQuery.toLowerCase();
    return base.filter(r => 
      r.name.toLowerCase().includes(query)
    );
  }, [normal, searchQuery, site.location]);


  return {
    featured: filteredFeatured,
    normal: filteredNormal,
    isLoading,
    error,
    refresh: fetchRestaurants
  };
}
