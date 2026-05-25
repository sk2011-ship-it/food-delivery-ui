import { useState, useEffect, useCallback, useMemo } from "react";
import { useConfigStore } from "@/store/useConfigStore";
import { customerService } from "@/services/customer.service";
import type { RestaurantItem, FeaturedItem } from "@/types/api.types";
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
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchRestaurants = useCallback(async () => {
    const location = site.location?.trim();

    // The site location can hydrate a moment after mount from persisted state.
    // Avoid firing a request with an empty location, which would fail and leave
    // the page in an empty/error state until the next refresh.
    if (!location) {
      setFeatured([]);
      setNormal([]);
      setError(null);
      setIsLoading(false);
      setHasLoaded(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [featRes, normRes] = await Promise.allSettled([
        customerService.getFeatured({
          location,
          type: "restaurant",
        }),
        customerService.getRestaurants({ location }),
      ]);

      if (featRes.status === "fulfilled" && featRes.value.success && featRes.value.data) {
        setFeatured(featRes.value.data.items);
      } else if (featRes.status === "rejected") {
        console.warn("[useRestaurants] featured fetch failed:", featRes.reason);
      }

      if (normRes.status === "fulfilled" && normRes.value.success && normRes.value.data) {
        setNormal(normRes.value.data.items);
      } else if (normRes.status === "rejected") {
        console.warn("[useRestaurants] restaurant fetch failed:", normRes.reason);
      }

      // If the restaurant list failed but featured succeeded, keep the page alive.
      if (
        (featRes.status === "fulfilled" && featRes.value.success) ||
        (normRes.status === "fulfilled" && normRes.value.success)
      ) {
        setError(null);
      } else {
        setError("An unexpected error occurred");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, [site.location]);

  useEffect(() => {
    fetchRestaurants();
    // Poll every 10s — keeps open/closed status on the list page fresh without
    // depending on Supabase Realtime. The API is no-store so each call hits the DB.
    const interval = setInterval(fetchRestaurants, 10_000);
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
    hasLoaded,
    error,
    refresh: fetchRestaurants
  };
}
