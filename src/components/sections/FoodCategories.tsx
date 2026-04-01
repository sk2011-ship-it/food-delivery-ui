"use client";

import { useSite } from "@/context/SiteContext";

const categories = [
  { emoji: "🍕", name: "Pizza", count: 12 },
  { emoji: "🍔", name: "Burgers", count: 18 },
  { emoji: "🍜", name: "Asian", count: 9 },
  { emoji: "🌮", name: "Mexican", count: 7 },
  { emoji: "🍣", name: "Sushi", count: 5 },
  { emoji: "🥗", name: "Healthy", count: 14 },
  { emoji: "🍗", name: "Chicken", count: 11 },
  { emoji: "🍩", name: "Desserts", count: 8 },
];

export default function FoodCategories() {
  const { site } = useSite();

  return (
    <section id="restaurants" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full text-white mb-3"
              style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})` }}
            >
              Browse {site.location}
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-gray-900">
              What Are You Craving?
            </h2>
          </div>
          <a
            href="#"
            className="text-sm font-semibold underline underline-offset-4"
            style={{ color: site.theme.primary }}
          >
            View all →
          </a>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-14">
          {categories.map((c, i) => (
            <button
              key={i}
              className="group flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-gray-100"
            >
              <span
                className="text-3xl w-14 h-14 flex items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}15, ${site.theme.gradientTo}25)` }}
              >
                {c.emoji}
              </span>
              <span className="text-xs font-semibold text-gray-700">{c.name}</span>
              <span className="text-[10px] text-gray-400">{c.count} places</span>
            </button>
          ))}
        </div>

        {/* Featured restaurants */}
        <h3 className="font-heading text-2xl font-bold text-gray-900 mb-6">
          Top Restaurants in {site.location}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_RESTAURANTS.map((r, i) => (
            <RestaurantCard key={i} restaurant={r} siteTheme={site.theme} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface MockRestaurant {
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: string;
  promo?: string;
  emoji: string;
  bg: string;
}

function RestaurantCard({
  restaurant,
  siteTheme,
}: {
  restaurant: MockRestaurant;
  siteTheme: { gradientFrom: string; gradientVia: string; gradientTo: string; primary: string; accent: string };
}) {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100 cursor-pointer">
      {/* Image area */}
      <div
        className="h-44 flex items-center justify-center text-7xl relative"
        style={{ background: `linear-gradient(135deg, ${restaurant.bg})` }}
      >
        {restaurant.emoji}
        {restaurant.promo && (
          <span
            className="absolute top-3 left-3 text-xs font-bold text-white px-2.5 py-1 rounded-full"
            style={{ background: `linear-gradient(135deg, ${siteTheme.gradientFrom}, ${siteTheme.accent})` }}
          >
            {restaurant.promo}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-heading font-bold text-gray-900">{restaurant.name}</h4>
          <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
            ⭐ {restaurant.rating}
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-3">{restaurant.cuisine}</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>🕐 {restaurant.deliveryTime}</span>
          <span>🚴 {restaurant.deliveryFee}</span>
          <button
            className="text-white text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${siteTheme.gradientFrom}, ${siteTheme.accent})` }}
          >
            Order
          </button>
        </div>
      </div>
    </div>
  );
}

const MOCK_RESTAURANTS: MockRestaurant[] = [
  { name: "The Pizza Palace", cuisine: "Pizza · Italian", rating: 4.8, deliveryTime: "20-30 min", deliveryFee: "Free delivery", promo: "20% OFF", emoji: "🍕", bg: "#FF6B6B22, #FF8E5322" },
  { name: "Burger Barn", cuisine: "Burgers · American", rating: 4.6, deliveryTime: "15-25 min", deliveryFee: "£1.99 delivery", promo: undefined, emoji: "🍔", bg: "#F59E0B22, #EF444422" },
  { name: "Dragon Noodles", cuisine: "Asian · Chinese", rating: 4.7, deliveryTime: "25-35 min", deliveryFee: "Free delivery", promo: "New", emoji: "🍜", bg: "#10B98122, #0EA5E922" },
  { name: "Taco Fiesta", cuisine: "Mexican · Tex-Mex", rating: 4.5, deliveryTime: "20-30 min", deliveryFee: "£0.99 delivery", promo: undefined, emoji: "🌮", bg: "#8B5CF622, #EC489922" },
  { name: "Sushi Zen", cuisine: "Sushi · Japanese", rating: 4.9, deliveryTime: "30-40 min", deliveryFee: "Free delivery", promo: "Popular", emoji: "🍣", bg: "#06B6D422, #3B82F622" },
  { name: "Green Garden", cuisine: "Salads · Healthy", rating: 4.6, deliveryTime: "15-20 min", deliveryFee: "Free delivery", promo: undefined, emoji: "🥗", bg: "#22C55E22, #84CC1622" },
];
