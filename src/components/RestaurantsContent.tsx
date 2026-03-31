"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { restaurantService } from "@/services/api";
import { Restaurant, RestaurantLocation } from "@/types/restaurant";
import {
  Clock,
  MapPin,
  ChevronRight,
  Search,
  Star,
  Loader2,
  Store
} from "lucide-react";

export default function RestaurantsContent() {
  const searchParams = useSearchParams();
  const locationParam = searchParams.get("location");

  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>(locationParam || "all");

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const data = await restaurantService.getPublicRestaurants();
        setAllRestaurants(data as Restaurant[]);
      } catch (err) {
        console.error("Failed to fetch restaurants", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  const filteredRestaurants = useMemo(() => {
    return allRestaurants.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = selectedLocation === "all" || r.location === selectedLocation;
      return matchesSearch && matchesLocation;
    });
  }, [allRestaurants, searchTerm, selectedLocation]);

  if (loading) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Search & Location Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] shadow-xl shadow-slate-200/50">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
          <Input
            placeholder="Search by name or location..."
            className="pl-12 h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white transition-all font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {["all", "Newcastle", "Downpatrick", "Kilkeel"].map((loc) => (
            <button
              key={loc}
              onClick={() => setSelectedLocation(loc)}
              className={`px-6 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${selectedLocation === loc
                ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
            >
              {loc === "all" ? "All Cities" : loc}
            </button>
          ))}
        </div>
      </div>

      {filteredRestaurants.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm border-2 border-dashed border-slate-100">
          <Store className="w-16 h-16 text-slate-100 mx-auto mb-4" />
          <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">No restaurants found</h3>
          <p className="text-slate-400 mt-2 font-medium">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRestaurants.map((restaurant) => (
            <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`} className="group">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden transition-all group-hover:-translate-y-2 group-hover:shadow-2xl">
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Store className="w-20 h-20 text-slate-200 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="absolute top-6 right-6">
                    <Badge className="bg-white/80 backdrop-blur-md text-slate-900 border-none font-black px-4 py-2 rounded-xl shadow-sm">
                      $Low
                    </Badge>
                  </div>
                </div>
                <CardHeader className="p-8">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                      {restaurant.name}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-amber-500 font-black">
                      <Star className="w-4 h-4 fill-current" /> 4.8
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 pt-0 space-y-6">
                  <div className="flex items-center gap-4 text-slate-400 font-bold text-sm">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-orange-500" /> {restaurant.location}
                    </div>
                    <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-orange-500" /> 25-35 min
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-orange-600 font-black flex items-center gap-2">
                      View Menu <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <Badge variant="outline" className="rounded-lg font-bold text-slate-300 border-slate-100">
                      FREE DELIVERY
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}