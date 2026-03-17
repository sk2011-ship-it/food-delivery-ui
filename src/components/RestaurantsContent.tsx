"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { restaurants } from "@/constants/restaurants";
import {
  Clock,
  MapPin,
  ChevronRight,
  Search,
  Star,
  StarHalf,
  StarOff,
  Heart,
  HeartOff,
  DollarSign,
} from "lucide-react";

type SortOption = "name" | "price" | "items" | "rating";
type FilterOption = "all" | string;

function parseTimeToMinutes(time: string) {
  const matches = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!matches) return 0;

  let hours = Number(matches[1]);
  const minutes = Number(matches[2]);
  const period = matches[3].toUpperCase();

  if (hours === 12) hours = 0;
  if (period === "PM") hours += 12;

  return hours * 60 + minutes;
}

function isOpenNow(opening: string, closing: string, nowMinutes: number) {
  const open = parseTimeToMinutes(opening);
  const close = parseTimeToMinutes(closing);

  if (open === close) {
    return true;
  }

  if (open < close) {
    return nowMinutes >= open && nowMinutes <= close;
  }

  // Handles places that close after midnight (e.g., 10:00 PM - 2:00 AM)
  return nowMinutes >= open || nowMinutes <= close;
}

function estimateRating(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const min = 3.2;
  const max = 4.9;
  const normalized = ((hash % 100) + 100) % 100 / 100;
  return Math.round((min + (max - min) * normalized) * 10) / 10;
}

function renderStars(rating: number) {
  const icons = [];
  for (let i = 1; i <= 5; i += 1) {
    if (rating >= i) {
      icons.push(<Star key={i} className="w-4 h-4 text-amber-400" />);
    } else if (rating >= i - 0.5) {
      icons.push(<StarHalf key={i} className="w-4 h-4 text-amber-400" />);
    } else {
      icons.push(<StarOff key={i} className="w-4 h-4 text-gray-300" />);
    }
  }

  return <div className="flex items-center gap-0.5">{icons}</div>;
}

export default function RestaurantsContent() {
  const searchParams = useSearchParams();
  const location = searchParams.get("location");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [cuisineFilter, setCuisineFilter] = useState<FilterOption>("all");
  const [priceFilter, setPriceFilter] = useState<FilterOption>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [openNow, setOpenNow] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const itemsPerPage = 9;

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem("favorites");
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]
    );
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSortBy("name");
    setCuisineFilter("all");
    setPriceFilter("all");
    setOpenNow(false);
    setShowFavorites(false);
    resetPagination();
  };

  // Get unique cuisine types
  const cuisineTypes = useMemo(() => {
    const types = new Set<string>();
    restaurants.forEach(restaurant => {
      restaurant.categories.forEach(category => {
        types.add(category.name);
      });
    });
    return Array.from(types).sort();
  }, []);

  const restaurantsWithStats = useMemo(() => {
    return restaurants.map((restaurant) => {
      const prices = restaurant.menu.map((item) => item.price);
      const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
      const cuisines = restaurant.categories.map((cat) => cat.name);

      return {
        ...restaurant,
        avgPrice: Math.round(avgPrice * 100) / 100,
        cuisines,
        rating: estimateRating(restaurant.name),
      };
    });
  }, []);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  type RestaurantWithStatus = (typeof restaurantsWithStats)[number] & {
    isOpen: boolean;
    isFavorite: boolean;
  };

  const filteredAndSortedRestaurants = useMemo(() => {
    let filtered: RestaurantWithStatus[] = location
      ? (restaurantsWithStats.filter((r) =>
          r.location.toLowerCase().includes(location.toLowerCase())
        ) as RestaurantWithStatus[])
      : (restaurantsWithStats as RestaurantWithStatus[]);

    const withStatus = filtered.map((r) => ({
      ...r,
      isOpen: isOpenNow(r.opening, r.closing, nowMinutes),
      isFavorite: favorites.includes(r.id),
    }));

    // Search filter
    if (searchTerm) {
      filtered = withStatus.filter((r) =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.cuisines.some((cuisine) => cuisine.toLowerCase().includes(searchTerm.toLowerCase())) ||
        r.menu.some(
          (item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      filtered = withStatus;
    }

    // Open now filter
    if (openNow) {
      filtered = filtered.filter((r) => r.isOpen);
    }

    // Favorites filter
    if (showFavorites) {
      filtered = filtered.filter((r) => r.isFavorite);
    }

    // Cuisine filter
    if (cuisineFilter !== "all") {
      filtered = filtered.filter((r) => r.cuisines.includes(cuisineFilter));
    }

    // Price filter
    if (priceFilter !== "all") {
      const [min, max] = priceFilter.split("-").map(Number);
      filtered = filtered.filter((r) => {
        if (max) {
          return r.avgPrice >= min && r.avgPrice <= max;
        }
        return r.avgPrice >= min;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price":
          return a.avgPrice - b.avgPrice;
        case "items":
          return b.menu.length - a.menu.length;
        case "rating":
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    location,
    searchTerm,
    sortBy,
    cuisineFilter,
    priceFilter,
    openNow,
    showFavorites,
    favorites,
    restaurantsWithStats,
    nowMinutes,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedRestaurants.length / itemsPerPage);
  const paginatedRestaurants = filteredAndSortedRestaurants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetPagination = () => setCurrentPage(1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {location ? `Restaurants in ${location}` : 'Find Your Favorite Restaurant'}
          </h1>
          <p className="text-gray-600">
            {location ? `Showing restaurants near ${location}` : 'Choose from our selection of amazing restaurants'}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search restaurants, cuisines, or dishes..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                resetPagination();
              }}
              className="pl-10"
            />
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortOption);
                  resetPagination();
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="name">Name</option>
                <option value="price">Average Price</option>
                <option value="items">Menu Items</option>
                <option value="rating">Rating</option>
              </select>
            </div>

            {/* Cuisine Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Cuisine:</span>
              <select
                value={cuisineFilter}
                onChange={(e) => {
                  setCuisineFilter(e.target.value as FilterOption);
                  resetPagination();
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Cuisines</option>
                {cuisineTypes.map(cuisine => (
                  <option key={cuisine} value={cuisine}>{cuisine}</option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Price Range:</span>
              <select
                value={priceFilter}
                onChange={(e) => {
                  setPriceFilter(e.target.value as FilterOption);
                  resetPagination();
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Prices</option>
                <option value="0-10">Under $10</option>
                <option value="10-15">$10 - $15</option>
                <option value="15-20">$15 - $20</option>
                <option value="20">Over $20</option>
              </select>
            </div>

            {/* Open Now */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={openNow}
                onChange={(e) => {
                  setOpenNow(e.target.checked);
                  resetPagination();
                }}
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              Open now
            </label>

            {/* Favorites */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showFavorites}
                onChange={(e) => {
                  setShowFavorites(e.target.checked);
                  resetPagination();
                }}
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              Favorites
            </label>

            <button
              onClick={resetFilters}
              className="ml-auto rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
            >
              Clear filters
            </button>

            {/* Results count */}
            <div className="text-sm text-gray-600 w-full md:w-auto md:ml-auto">
              {filteredAndSortedRestaurants.length} restaurant{filteredAndSortedRestaurants.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* Restaurant Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paginatedRestaurants.map((restaurant) => (
            <Link key={restaurant.id} href={`/restaurant/${restaurant.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{restaurant.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(restaurant.rating)}
                        <span className="text-xs text-gray-500">{restaurant.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleFavorite(restaurant.id);
                        }}
                        className="rounded-full p-1 hover:bg-gray-100"
                        aria-label={
                          favorites.includes(restaurant.id)
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                      >
                        {favorites.includes(restaurant.id) ? (
                          <Heart className="w-5 h-5 text-rose-500" />
                        ) : (
                          <HeartOff className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      {restaurant.isOpen ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Open
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          Closed
                        </Badge>
                      )}
                      <Badge variant="outline">{restaurant.menu.length} items</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>Avg. ${restaurant.avgPrice.toFixed(2)}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{restaurant.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">
                      {restaurant.opening} - {restaurant.closing}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {restaurant.cuisines.slice(0, 3).map(cuisine => (
                      <Badge key={cuisine} variant="secondary" className="text-xs">
                        {cuisine}
                      </Badge>
                    ))}
                    {restaurant.cuisines.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{restaurant.cuisines.length - 3} more
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-2 text-orange-600 font-medium">
                    View Menu <ChevronRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 border rounded-md text-sm ${
                    currentPage === page
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}

        {/* No results message */}
        {filteredAndSortedRestaurants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No restaurants found matching your criteria.</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}