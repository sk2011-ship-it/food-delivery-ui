import { useState, useEffect, useCallback, useMemo } from "react";
import { useConfigStore } from "@/store/useConfigStore";
import { customerService } from "@/services/customer.service";
import type { RestaurantItem, FeaturedItem, OpeningHours } from "@/types/api.types";
import { isRestaurantOpen } from "@/lib/utils/restaurantUtils";
import { isSameLocation } from "@/lib/locations";

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
  }, [fetchRestaurants]);

  // Filtering Logic - Only show OPEN restaurants
  const filteredFeatured = useMemo(() => {
    const base = featured.filter(
      (r) => isSameLocation(r.location, site.location) && isRestaurantOpen(r.openingHours as OpeningHours | null | undefined)
    );
    if (!searchQuery) return base;
    return base.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [featured, searchQuery, site.location]);

  const filteredNormal = useMemo(() => {
    const base = normal.filter(
      (r) => isSameLocation(r.location, site.location) && isRestaurantOpen(r.openingHours as OpeningHours | null | undefined)
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
